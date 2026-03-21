# Architecture Patterns

**Domain:** Retail staff scheduling with real-time labor cost visibility
**Researched:** 2026-03-21

## Recommended Architecture

Next.js App Router with server-first data fetching, client-side interactive islands for the schedule builder and cost meter, and a clean Data Access Layer (DAL) pattern for authorization and database queries.

```
                    +---------------------------+
                    |     Next.js Middleware     |
                    |  (Auth gate + role check)  |
                    +---------------------------+
                              |
              +---------------+---------------+
              |                               |
     Server Components                Client Islands
     (layouts, pages,                 (schedule grid,
      data fetching)                   cost meter,
              |                        drag-and-drop)
              |                               |
     +--------+--------+            +--------+--------+
     |   Data Access    |            | React State     |
     |   Layer (DAL)    |            | (optimistic     |
     |   - auth check   |            |  updates, local |
     |   - queries      |            |  calculations)  |
     +--------+--------+            +--------+--------+
              |                               |
     +--------+--------+            +--------+--------+
     |  Drizzle ORM     |           | Server Actions   |
     |  (type-safe SQL)  |<---------| (mutations)      |
     +---------+---------+           +-----------------+
               |
     +---------+---------+
     |  Neon PostgreSQL   |
     +-------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Auth Middleware** | Route protection, role gating, session validation | NextAuth v5 callbacks, all routes |
| **App Layout Shell** | Navigation, sidebar, role-based menu rendering | Auth session, all page routes |
| **Schedule Grid (Client)** | Weekly calendar rendering, drag-and-drop interaction, shift CRUD UI | Cost Calculator, Server Actions, Employee data |
| **Cost Meter (Client)** | Real-time labor cost calculation, overtime warnings, budget comparison | Schedule Grid (reads shift state), Store config |
| **Employee Management (Server + Client)** | Employee CRUD, availability editing, role assignment | DAL, Server Actions |
| **Shift Swap System (Server + Client)** | Swap request creation, approval workflow, conflict detection | DAL, Server Actions, Cost Calculator |
| **Compliance Engine (Server)** | Schedule posting deadline checks, premium pay calculation, audit logging | DAL, Schedule data |
| **Team Dashboard (Server)** | Today view, weekly overview, historical trends | DAL (read-only queries) |
| **Data Access Layer** | Centralized auth-checked database queries, authorization logic | Drizzle ORM, NextAuth session |
| **Seed System** | Demo data generation, realistic schedule population | Drizzle ORM (direct) |

### Data Flow

**Schedule Building Flow (the hero flow):**
```
1. Manager opens /schedule?week=2026-W13
2. Server Component fetches: employees, existing shifts, store config, availability
3. Data passed to Client Island: <ScheduleGrid /> + <CostMeter />
4. Manager drags shift onto grid cell
5. Client state updates immediately (optimistic)
6. CostMeter recalculates from local state (no server round-trip for cost display)
7. Server Action persists shift to database
8. On success: state confirmed. On failure: rollback optimistic update
9. Audit log entry written server-side automatically
```

**Shift Swap Flow:**
```
1. Employee views own schedule, clicks "Request Swap"
2. Selects target employee + target shift
3. Server Action validates: no overtime created, no coverage gap, availability OK
4. If valid: swap request created with "pending" status
5. Manager/Supervisor sees pending request in dashboard
6. Manager approves -> Server Action executes swap (two shift updates in transaction)
7. Audit log records both the request and the resolution
```

**Cost Calculation Flow (client-side, no latency):**
```
1. All shifts for the week are loaded into client state
2. Employee rates and max hours are loaded into client state
3. On any shift change (add/move/delete/resize):
   a. Recalculate per-employee weekly hours
   b. Recalculate per-day cost (sum of employee_rate * shift_hours)
   c. Recalculate weekly total vs budget
   d. Flag overtime: amber >= 35hrs, red >= 40hrs
   e. Update CostMeter UI (all local, sub-millisecond)
```

## Database Schema Structure

### Core Tables

```
stores
  - id, name, open_time, close_time, weekly_budget, timezone
  - compliance_rules (jsonb - hardcoded predictive scheduling config)

users (auth + employee combined)
  - id, email, password_hash, name, role (manager|supervisor|employee)
  - hourly_rate, max_hours_per_week, phone, avatar_url
  - store_id (FK)

employee_roles (many-to-many: employees can work multiple positions)
  - id, user_id (FK), role_name (cashier|stock|manager|visual_merch)
  - color (for schedule grid color-coding)

availability
  - id, user_id (FK), day_of_week (0-6), start_time, end_time
  - (one row per available time block per day)

schedules (week container)
  - id, store_id (FK), week_start (date), status (draft|published), published_at
  - created_by (FK to users)

shifts
  - id, schedule_id (FK), user_id (FK, nullable for open shifts)
  - date, start_time, end_time, role_name, break_minutes
  - status (assigned|open|swap_pending)
  - created_at, updated_at

swap_requests
  - id, requester_id (FK), requester_shift_id (FK)
  - target_id (FK), target_shift_id (FK)
  - status (pending|approved|rejected|auto_rejected)
  - reason, resolved_by (FK), resolved_at

audit_log
  - id, store_id, user_id, action, entity_type, entity_id
  - old_values (jsonb), new_values (jsonb), timestamp
```

### Key Indexes
- `shifts(schedule_id, date)` - fetching a week's shifts
- `shifts(user_id, date)` - fetching an employee's shifts
- `availability(user_id, day_of_week)` - checking availability
- `swap_requests(status)` - finding pending requests
- `audit_log(store_id, timestamp)` - compliance audit queries

## Patterns to Follow

### Pattern 1: Client Island with Server-Fetched Data
**What:** Server Components fetch all data; pass it as props to a single large Client Component tree for the interactive schedule grid.
**When:** The schedule builder page -- needs both server-side data and rich client interactivity.
**Why:** Avoids waterfalls. Server fetches everything in one pass, client handles all interaction without round-trips for display updates.
```typescript
// app/schedule/page.tsx (Server Component)
export default async function SchedulePage({ searchParams }) {
  const week = searchParams.week;
  const [employees, shifts, store, availability] = await Promise.all([
    getEmployees(),
    getShiftsForWeek(week),
    getStoreConfig(),
    getAvailability(),
  ]);

  return (
    <ScheduleBuilder
      employees={employees}
      initialShifts={shifts}
      store={store}
      availability={availability}
    />
  );
}

// components/schedule-builder.tsx ("use client")
// Owns all interactive state, renders grid + cost meter
```

### Pattern 2: Optimistic Mutations via Server Actions
**What:** Update client state immediately on user action, then fire Server Action to persist. Rollback on failure.
**When:** Shift creation, movement, deletion -- any mutation where latency would break the "real-time" feel.
**Why:** The labor cost meter must update instantly. Waiting for a server round-trip would make the app feel sluggish.
```typescript
// Inside ScheduleBuilder client component
async function handleShiftCreate(shiftData: NewShift) {
  // 1. Optimistic: add to local state immediately
  const tempId = crypto.randomUUID();
  setShifts(prev => [...prev, { ...shiftData, id: tempId }]);

  // 2. Persist
  const result = await createShift(shiftData); // Server Action

  // 3. Reconcile
  if (result.error) {
    setShifts(prev => prev.filter(s => s.id !== tempId));
    toast.error(result.error);
  } else {
    setShifts(prev => prev.map(s => s.id === tempId ? result.shift : s));
  }
}
```

### Pattern 3: Data Access Layer (DAL) for Authorization
**What:** Centralized module that wraps all database queries with auth checks. Every query verifies the session and role before executing.
**When:** Every server-side data access point -- Server Components, Server Actions, API routes.
**Why:** Prevents authorization bypass. A single place to enforce "managers see all, employees see own schedule."
```typescript
// lib/dal.ts
export async function getShiftsForWeek(weekStart: string) {
  const session = await auth();
  if (!session?.user) throw new AuthError("Not authenticated");

  if (session.user.role === "employee") {
    return db.select().from(shifts)
      .where(and(eq(shifts.userId, session.user.id), eq(shifts.weekStart, weekStart)));
  }

  // Managers and supervisors see all shifts
  return db.select().from(shifts).where(eq(shifts.weekStart, weekStart));
}
```

### Pattern 4: Computed State for Cost Calculations
**What:** Derive all cost/overtime/budget data from the shifts array using pure functions. Never store computed costs in the database.
**When:** The CostMeter component and all cost-related displays.
**Why:** Shifts are the source of truth. Storing computed values creates sync issues. Pure functions are testable and instant.
```typescript
// lib/cost-calculator.ts (shared between client and server)
export function calculateWeekCosts(shifts: Shift[], employees: Employee[], budget: number) {
  const employeeHours = new Map<string, number>();
  let totalCost = 0;
  const dailyCosts = new Map<string, number>();

  for (const shift of shifts) {
    const hours = (shift.endTime - shift.startTime) / 60 - shift.breakMinutes / 60;
    const employee = employees.find(e => e.id === shift.userId);
    if (!employee) continue;

    const cost = hours * employee.hourlyRate;
    totalCost += cost;
    employeeHours.set(shift.userId, (employeeHours.get(shift.userId) || 0) + hours);
    dailyCosts.set(shift.date, (dailyCosts.get(shift.date) || 0) + cost);
  }

  return {
    totalCost,
    totalHours: [...employeeHours.values()].reduce((a, b) => a + b, 0),
    budgetPercent: (totalCost / budget) * 100,
    dailyCosts: Object.fromEntries(dailyCosts),
    overtimeAlerts: [...employeeHours.entries()]
      .filter(([_, hours]) => hours >= 35)
      .map(([id, hours]) => ({ employeeId: id, hours, level: hours >= 40 ? 'red' : 'amber' })),
  };
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Server Round-Trip for Every Cost Update
**What:** Calling a Server Action or API route every time a shift is dragged to recalculate costs.
**Why bad:** Adds 100-300ms latency per interaction. The "real-time cost meter" becomes a "slightly-delayed cost meter." Users lose the instant feedback that makes this app compelling.
**Instead:** Calculate costs entirely on the client from the local shifts array. Only hit the server for persistence.

### Anti-Pattern 2: Storing Shifts as JSON Blobs
**What:** Putting the entire week's schedule in a single JSON column instead of normalized shift rows.
**Why bad:** Cannot query individual shifts for swap requests, cannot enforce referential integrity, makes audit logging painful, prevents efficient conflict detection queries.
**Instead:** Normalized `shifts` table with proper foreign keys. One row per shift.

### Anti-Pattern 3: Building Custom Drag-and-Drop from Scratch
**What:** Using raw mouse/touch events to implement drag-and-drop for the schedule grid.
**Why bad:** Accessibility nightmare (keyboard, screen readers), mobile touch handling is complex, edge cases everywhere (scroll during drag, drop zones, visual feedback). Weeks of work for a mediocre result.
**Instead:** Use `@dnd-kit/core` -- mature, accessible, well-documented, handles all edge cases. Specifically `@dnd-kit/sortable` is not needed; use the base `DndContext` with custom drop zones for the grid cells.

### Anti-Pattern 4: Mixing Auth Checks Across Components
**What:** Checking `session.user.role` in individual components throughout the codebase.
**Why bad:** Auth logic scattered everywhere, easy to miss a check, impossible to audit security posture.
**Instead:** DAL pattern (see Pattern 3). All data access goes through authorized functions. Components receive pre-authorized data.

### Anti-Pattern 5: Separate Schedule and Cost State
**What:** Having the ScheduleGrid and CostMeter maintain independent state, synchronized via events or context.
**Why bad:** State desync bugs. The cost meter shows different numbers than what the grid displays.
**Instead:** Single source of truth: the shifts array lives in one parent component. CostMeter receives it as a prop (or via context) and derives all values.

## Component Architecture Detail

### Page Route Structure
```
app/
  (auth)/
    login/page.tsx              -- Login form
  (dashboard)/
    layout.tsx                  -- Authenticated shell (sidebar, nav, role context)
    page.tsx                    -- Redirect to /dashboard
    dashboard/page.tsx          -- Team dashboard (today view, week overview)
    schedule/page.tsx           -- Schedule builder (THE HERO PAGE)
    employees/page.tsx          -- Employee list
    employees/[id]/page.tsx     -- Employee detail + availability
    swaps/page.tsx              -- Swap requests (manager/supervisor)
    compliance/page.tsx         -- Compliance dashboard + audit log
    settings/page.tsx           -- Store settings, budget config
  api/
    auth/[...nextauth]/route.ts -- NextAuth handler
```

### Client Component Tree for Schedule Builder
```
<ScheduleBuilder>                    -- owns shifts state, week navigation
  <WeekNavigator />                  -- prev/next week, copy previous week
  <div className="flex">
    <div className="flex-1">
      <DndContext>                    -- @dnd-kit drag context
        <ScheduleGrid>               -- the weekly grid
          <GridHeader />             -- day columns (Mon-Sun with dates)
          {employees.map(emp => (
            <EmployeeRow>            -- one row per employee
              <EmployeeCell />       -- name, role badge, hours summary
              {days.map(day => (
                <DayCell>            -- droppable zone for one employee+day
                  <ShiftCard />      -- draggable shift block (color-coded)
                </DayCell>
              ))}
            </EmployeeRow>
          ))}
        </ScheduleGrid>
        <DragOverlay />              -- visual feedback during drag
      </DndContext>
    </div>
    <CostMeterSidebar>               -- sticky sidebar
      <TotalCostGauge />             -- total $ and % of budget
      <OvertimeAlerts />             -- employee-level warnings
      <DailyBreakdown />             -- per-day cost bars
      <WeeklyBudgetChart />          -- total vs budget comparison
    </CostMeterSidebar>
  </div>
  <ShiftDialog />                    -- modal for create/edit shift details
</ScheduleBuilder>
```

## Suggested Build Order

Dependencies flow from foundational to interactive. Build in this order:

### Phase 1: Foundation (no dependencies)
- Next.js project scaffolding with App Router
- Drizzle ORM setup + Neon connection
- Database schema (all tables) + migrations
- NextAuth v5 with credentials provider + role in JWT/session
- Auth middleware for route protection
- Seed script with all demo data (employees, store, availability)
- App layout shell with navigation

**Rationale:** Everything depends on auth, database, and seed data. Build this first so every subsequent phase has data to work with.

### Phase 2: Employee Management (depends on Phase 1)
- Employee list page (Server Component, simple table)
- Employee detail page with availability editing
- DAL functions for employee queries
- Role-based data filtering (employees see own profile, managers see all)

**Rationale:** Employees must exist and be manageable before shifts can reference them. Also a simpler page to validate the DAL pattern before tackling the complex schedule grid.

### Phase 3: Schedule Builder -- Core (depends on Phase 1, 2)
- Schedule grid with static rendering (no drag-drop yet)
- Shift creation via click-to-create dialog
- Shift editing and deletion
- Week navigation (prev/next, URL-based week parameter)
- Availability conflict highlighting
- Server Actions for shift CRUD

**Rationale:** Get the grid layout and data flow right before adding drag-and-drop complexity. This is the hardest UI component -- better to nail the layout first.

### Phase 4: Schedule Builder -- Interactive (depends on Phase 3)
- @dnd-kit integration for drag-and-drop shifts
- Optimistic updates for shift mutations
- Copy previous week functionality
- Real-time CostMeter sidebar with all calculations
- Overtime alerts (amber/red thresholds)
- Budget comparison visualization

**Rationale:** Adding interactivity on top of a working grid is safer than building both simultaneously. The cost meter is pure derived state -- plug it in once shifts work.

### Phase 5: Shift Swaps & Coverage (depends on Phase 3)
- Open shift board (unassigned shifts listing)
- Swap request creation (employee-facing)
- Swap approval workflow (manager/supervisor-facing)
- Auto-reject logic (overtime check, coverage gap check)
- Pick up open shift flow

**Rationale:** Requires working shifts and employee data. Can be built in parallel with Phase 4 if resources allow.

### Phase 6: Compliance & Dashboard (depends on Phase 3)
- Team dashboard: today view, week overview
- Historical labor cost trends (last 4 weeks)
- Compliance warnings for late schedule posting
- Premium pay calculator for last-minute changes
- Audit log viewer
- Audit log writes (integrated into all Server Actions retroactively)

**Rationale:** Read-heavy features that layer on top of existing data. Audit logging should be wired into existing Server Actions.

### Phase 7: Polish & Deploy (depends on all)
- Mobile responsive adjustments (employee schedule view priority)
- Loading states and error boundaries
- Final seed data verification (realistic demo story)
- Vercel deployment + Neon database provisioning
- Domain configuration (shiftwise.demos.fonnit.com)

### Parallelization Opportunities
- Phase 4 and Phase 5 can run in parallel (independent features on same data)
- Phase 6 dashboard work can start as soon as Phase 3 is complete
- Audit logging in Phase 6 touches Phase 3-5 Server Actions (retroactive integration)

## Scalability Considerations

| Concern | Demo (12 users) | 100 users | 1000 users |
|---------|-----------------|-----------|------------|
| Schedule grid rendering | All in one grid | Paginate or filter by department | Virtual scrolling, department views |
| Cost calculation | Client-side, instant | Client-side, instant | Server-side pre-calculation, cache |
| Shift queries | Single query, no index needed | Indexed by schedule_id+date | Partitioned by store+week |
| Real-time updates | Not needed (single user editing) | Polling every 30s | WebSocket/SSE for live collaboration |
| Audit log | Simple table scan | Indexed by timestamp | Time-series partitioning |

For this demo app, the "12 users" column applies. No scalability engineering needed -- focus on correctness and polish.

## Sources

- [Next.js App Router Patterns 2026](https://dev.to/teguh_coding/nextjs-app-router-the-patterns-that-actually-matter-in-2026-146) - MEDIUM confidence
- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication) - HIGH confidence
- [Auth.js Role-Based Access Control](https://authjs.dev/guides/role-based-access-control) - HIGH confidence
- [NextAuth v5 RBAC Middleware Discussion](https://github.com/nextauthjs/next-auth/discussions/9609) - MEDIUM confidence
- [dnd-kit Overview](https://dndkit.com/) - HIGH confidence
- [Top 5 Drag-and-Drop Libraries for React 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) - MEDIUM confidence
- [Drizzle ORM PostgreSQL Guide](https://orm.drizzle.team/docs/get-started/postgresql-new) - HIGH confidence
- [Feature-Sliced Design for Next.js App Router](https://feature-sliced.design/blog/nextjs-app-router-guide) - MEDIUM confidence
