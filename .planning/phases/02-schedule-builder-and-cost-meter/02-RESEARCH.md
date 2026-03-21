# Phase 2: Schedule Builder and Cost Meter - Research

**Researched:** 2026-03-21
**Domain:** Interactive drag-and-drop schedule grid with real-time labor cost calculation
**Confidence:** HIGH

## Summary

Phase 2 is the hero feature: a weekly schedule grid (employees x days) with drag-and-drop shift assignment and a real-time labor cost meter sidebar. The core technical challenges are: (1) building a performant drag-and-drop grid using @dnd-kit/react 0.3.x, (2) implementing client-side cost calculations that update instantly during drag interactions, (3) creating a shifts database schema with proper indexes and a seed script for realistic demo data, and (4) handling optimistic mutations via Server Actions.

The existing codebase provides a solid foundation: the database schema has stores, users, employeeRoles, and availability tables. The DAL pattern (auth-gated data access) and Server Actions pattern (zod validation, auth checks) are established. The schedule page placeholder exists at `/schedule`. Constants for ROLE_COLORS and DAYS_OF_WEEK are ready to reuse.

**Primary recommendation:** Build the static grid layout and shift CRUD first, then layer on @dnd-kit/react drag-and-drop and cost meter as derived state. Keep all shift data in a single parent client component state; derive costs via useMemo.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Weekly grid: rows = employees (12), columns = 7 days (Mon-Sun)
- 30-minute time increments for shift start/end
- Each shift cell shows time range + role badge, colored by ROLE_COLORS
- Click empty cell opens create shift modal; click existing shift opens edit modal with delete
- Conflicts (employee unavailable) shown with red border/highlight
- Today's column highlighted with subtle indigo/blue background
- Drag entire shift cells to different employee row or day column
- Visual feedback during drag: green outline valid, red if conflict
- Optimistic updates: grid updates immediately, saves in background, reverts on error
- Disable drag on mobile -- use edit modal for reassignment instead
- Only Manager role can drag shifts
- Cost meter: right sidebar, always visible on desktop (fixed position)
- Shows: total hours, total cost ($), % of revenue budget ($12K/week)
- Budget progress bar: green <80%, amber 80-100%, red >100%
- Daily cost breakdown row
- Weekly total vs budget bar chart (simple horizontal bars)
- Per-employee hours: collapsible list with amber (>=35h) and red (>=40h) indicators
- Cost updates in real-time (client-side calculation, no server round-trips)
- Mobile: collapsed to summary bar at top, expandable on tap
- Week navigation: prev/next arrows with date range display
- Copy from previous week with confirmation dialog
- Shift CRUD: modal form with employee, day, start/end time, role dropdown, break duration
- Validation: within store hours (9 AM - 9 PM), end > start, employee available
- Seed: current week fully scheduled, Jake Kim at 38 hrs, one open Thursday PM cashier shift

### Claude's Discretion
- Exact grid cell dimensions and spacing
- Shift modal form layout
- Loading states for schedule data
- Error toast design for failed saves
- Chart library usage for budget visualization (Recharts via shadcn chart recommended)
- Animation/transition effects for drag-and-drop

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCHED-01 | Manager can view weekly calendar grid (rows = employees, columns = days) | Custom grid component with CSS Grid, employees from DAL, DAYS_OF_WEEK constant |
| SCHED-02 | Manager can click to create a shift (start time, end time, role, break duration) | Dialog/Sheet modal with zod validation, Server Action for persistence |
| SCHED-03 | Manager can edit an existing shift | Same modal pre-filled, update Server Action |
| SCHED-04 | Manager can delete a shift | Confirmation dialog, delete Server Action |
| SCHED-05 | Manager can drag-and-drop shifts to reassign | @dnd-kit/react DragDropProvider + useDraggable/useDroppable |
| SCHED-06 | Shifts color-coded by role | ROLE_COLORS constant already exists, apply to ShiftCard background |
| SCHED-07 | Schedule conflicts highlighted when employee unavailable | Cross-reference availability table with shift day, red border on cell |
| SCHED-08 | Manager can navigate between weeks | URL-based week parameter, date-fns for week calculation |
| SCHED-09 | Manager can copy previous week's schedule | Server Action to duplicate shifts with new dates |
| COST-01 | Sidebar displays total scheduled hours | useMemo derived from shifts array |
| COST-02 | Sidebar displays total labor cost ($) | hours x hourlyRate per employee, summed |
| COST-03 | Sidebar displays % of revenue budget | totalCost / store.weeklyBudget * 100 |
| COST-04 | Cost meter updates in real-time | Client-side calculation on every shift state change |
| COST-05 | Overtime indicator amber at 35hrs, red at 40hrs | Per-employee hours map with threshold checks |
| COST-06 | Daily cost breakdown | Group shifts by date, sum costs per day |
| COST-07 | Weekly total vs budget bar chart | Recharts BarChart via shadcn Chart component |
| COST-08 | Per-employee hours tracker | Collapsible list derived from shifts state |
| DEMO-03 | Current week fully scheduled with realistic patterns | Seed script generating shifts relative to current date |
| DEMO-04 | Jake Kim near overtime (38 hrs) | Seed specific shift pattern for Jake |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Next.js | 16.2.1 | App Router, Server Components/Actions | Installed |
| React | 19.2.4 | UI library | Installed |
| Drizzle ORM | 0.45.1 | Database queries | Installed |
| date-fns | 4.1.x | Date arithmetic, week navigation | Installed |
| zod | 4.3.x | Form validation | Installed |
| shadcn/ui | CLI v4 | UI components (Dialog, Sheet, Select, etc.) | Installed |
| Sonner | 2.0.7 | Toast notifications for errors | Installed |
| lucide-react | 0.577.0 | Icons | Installed |

### New for this phase
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @dnd-kit/react | 0.3.2 | Drag-and-drop schedule grid | Recommended by STACK.md, designed for React 19, lightweight |
| recharts | 3.8.0 | Budget vs actual bar chart | Used by shadcn/ui Chart component wrapper |

### Installation
```bash
npm install @dnd-kit/react recharts
npx shadcn@latest add chart
```

**Note on @dnd-kit/react 0.3.2:** Pre-1.0 but the recommended package. Uses `DragDropProvider` (not `DndContext` from older @dnd-kit/core). Key exports: `DragDropProvider`, `useDraggable`, `useDroppable`. The API is simpler than the old @dnd-kit/core. If any stability issues arise, fallback to `@dnd-kit/core` 6.3.1 + `@dnd-kit/sortable` (mature, stable).

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/(dashboard)/
    schedule/
      page.tsx                    # Server Component: fetches data, renders client island
  components/
    schedule/
      schedule-builder.tsx        # "use client" - top-level state owner
      week-navigator.tsx          # Prev/next week, copy previous week button
      schedule-grid.tsx           # CSS Grid layout with DragDropProvider
      employee-row.tsx            # One row per employee (memoized)
      day-cell.tsx                # Droppable zone for employee+day
      shift-card.tsx              # Draggable shift block (color-coded)
      shift-dialog.tsx            # Create/edit shift modal
      cost-meter-sidebar.tsx      # Right sidebar with all cost displays
      daily-breakdown.tsx         # Per-day cost display
      employee-hours-list.tsx     # Per-employee collapsible hours
      budget-chart.tsx            # Recharts bar chart
  lib/
    dal/
      shifts.ts                   # DAL: getShiftsForWeek, getShiftsForEmployee
    actions/
      shifts.ts                   # Server Actions: createShift, updateShift, deleteShift, copyWeek
    utils/
      cost-calculator.ts          # Pure functions: calculateWeekCosts, getEmployeeHours, getOvertimeAlerts
      schedule-helpers.ts         # Week date range, time formatting, availability checks
    db/
      schema.ts                   # Add shifts table + relations
```

### Pattern 1: Client Island with Server-Fetched Data
**What:** Server Component fetches all data in parallel; passes as props to a single client component tree.
**When:** The schedule page -- needs server data + rich interactivity.
```typescript
// app/(dashboard)/schedule/page.tsx (Server Component)
import { getEmployees } from "@/lib/dal/employees"
import { getShiftsForWeek } from "@/lib/dal/shifts"
import { getStore } from "@/lib/dal/stores"
import { ScheduleBuilder } from "@/components/schedule/schedule-builder"
import { startOfWeek, parseISO } from "date-fns"

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const params = await searchParams
  const weekStart = params.week ? parseISO(params.week) : startOfWeek(new Date(), { weekStartsOn: 1 })

  const [employees, shifts, store] = await Promise.all([
    getEmployees(),
    getShiftsForWeek(weekStart),
    getStore(),
  ])

  return (
    <ScheduleBuilder
      employees={employees}
      initialShifts={shifts}
      store={store}
      weekStart={weekStart.toISOString()}
    />
  )
}
```

### Pattern 2: Single Source of Truth for Shifts State
**What:** The `ScheduleBuilder` client component owns a `shifts` state array. Both the grid and cost meter derive from it.
**When:** Always -- prevents state desync between grid display and cost calculations.
```typescript
// components/schedule/schedule-builder.tsx ("use client")
"use client"
import { useState, useMemo } from "react"
import { calculateWeekCosts } from "@/lib/utils/cost-calculator"

export function ScheduleBuilder({ employees, initialShifts, store, weekStart }) {
  const [shifts, setShifts] = useState(initialShifts)

  // Derived cost data -- recalculates whenever shifts change
  const costs = useMemo(
    () => calculateWeekCosts(shifts, employees, Number(store.weeklyBudget)),
    [shifts, employees, store.weeklyBudget]
  )

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <ScheduleGrid shifts={shifts} onShiftsChange={setShifts} employees={employees} />
      </div>
      <CostMeterSidebar costs={costs} employees={employees} budget={Number(store.weeklyBudget)} />
    </div>
  )
}
```

### Pattern 3: @dnd-kit/react Grid Integration
**What:** DragDropProvider wraps the grid. Each ShiftCard uses useDraggable. Each DayCell uses useDroppable.
**Key API (verified from official docs):**
```typescript
import { DragDropProvider } from "@dnd-kit/react"
import { useDraggable } from "@dnd-kit/react"
import { useDroppable } from "@dnd-kit/react"

// ShiftCard - draggable
function ShiftCard({ shift }: { shift: Shift }) {
  const { ref, isDragSource } = useDraggable({
    id: `shift-${shift.id}`,
    data: { shift },           // accessible in onDragEnd event
    disabled: false,           // set true for non-manager roles
  })
  return <div ref={ref} className={isDragSource ? "opacity-50" : ""}>{/* shift content */}</div>
}

// DayCell - droppable
function DayCell({ employeeId, date, children }: { employeeId: number; date: string; children: React.ReactNode }) {
  const { ref, isDropTarget } = useDroppable({
    id: `cell-${employeeId}-${date}`,
    data: { employeeId, date },  // accessible in onDragEnd
  })
  return (
    <div ref={ref} className={isDropTarget ? "ring-2 ring-green-400" : ""}>
      {children}
    </div>
  )
}

// Grid wrapper
function ScheduleGrid({ shifts, employees, onShiftMove }) {
  return (
    <DragDropProvider
      onDragEnd={({ source, target }) => {
        if (!target) return
        const shift = source.data.shift
        const { employeeId, date } = target.data
        onShiftMove(shift.id, employeeId, date)
      }}
    >
      {/* grid content */}
    </DragDropProvider>
  )
}
```

### Pattern 4: Optimistic Mutation with Server Action
**What:** Update client state immediately, persist via Server Action, rollback on failure.
```typescript
async function handleShiftMove(shiftId: string, newEmployeeId: number, newDate: string) {
  // Save previous state for rollback
  const previousShifts = shifts

  // Optimistic update
  setShifts(prev => prev.map(s =>
    s.id === shiftId ? { ...s, employeeId: newEmployeeId, date: newDate } : s
  ))

  // Persist
  const result = await moveShift(shiftId, newEmployeeId, newDate)

  if (!result.success) {
    setShifts(previousShifts) // Rollback
    toast.error(result.message || "Failed to move shift")
  }
}
```

### Pattern 5: Pure Cost Calculator (shared between client rendering and tests)
**What:** Pure functions that take shifts + employees + budget and return all cost metrics.
```typescript
// lib/utils/cost-calculator.ts
export interface CostSummary {
  totalHours: number
  totalCost: number
  budgetPercent: number
  dailyCosts: Record<string, number>       // date string -> cost
  dailyHours: Record<string, number>       // date string -> hours
  employeeHours: Record<number, number>    // employee ID -> total hours
  overtimeAlerts: { employeeId: number; hours: number; level: "amber" | "red" }[]
}

export function calculateWeekCosts(
  shifts: Shift[],
  employees: Employee[],
  weeklyBudget: number
): CostSummary {
  const employeeMap = new Map(employees.map(e => [e.id, e]))
  const employeeHours: Record<number, number> = {}
  const dailyCosts: Record<string, number> = {}
  const dailyHours: Record<string, number> = {}
  let totalCost = 0
  let totalHours = 0

  for (const shift of shifts) {
    if (!shift.employeeId) continue // skip open shifts
    const employee = employeeMap.get(shift.employeeId)
    if (!employee) continue

    const hours = calculateShiftHours(shift.startTime, shift.endTime, shift.breakMinutes)
    const rate = Number(employee.hourlyRate)
    const cost = hours * rate

    totalHours += hours
    totalCost += cost
    employeeHours[shift.employeeId] = (employeeHours[shift.employeeId] || 0) + hours
    dailyCosts[shift.date] = (dailyCosts[shift.date] || 0) + cost
    dailyHours[shift.date] = (dailyHours[shift.date] || 0) + hours
  }

  const overtimeAlerts = Object.entries(employeeHours)
    .filter(([_, hours]) => hours >= 35)
    .map(([id, hours]) => ({
      employeeId: Number(id),
      hours,
      level: hours >= 40 ? "red" as const : "amber" as const,
    }))

  return {
    totalHours,
    totalCost,
    budgetPercent: weeklyBudget > 0 ? (totalCost / weeklyBudget) * 100 : 0,
    dailyCosts,
    dailyHours,
    employeeHours,
    overtimeAlerts,
  }
}

function calculateShiftHours(startTime: string, endTime: string, breakMinutes: number): number {
  // startTime/endTime in "HH:mm" format
  const [sh, sm] = startTime.split(":").map(Number)
  const [eh, em] = endTime.split(":").map(Number)
  const totalMinutes = (eh * 60 + em) - (sh * 60 + sm) - breakMinutes
  return Math.max(0, totalMinutes / 60)
}
```

### Anti-Patterns to Avoid
- **Server round-trip for cost updates:** Never call a Server Action to recalculate costs during drag. All cost computation is client-side from the shifts state array.
- **Separate state for grid and cost meter:** Both MUST derive from the same `shifts` state. Having independent state causes desync.
- **Full grid re-render on drag:** Memoize EmployeeRow and DayCell components with React.memo. Each cell re-renders only when its specific shift data changes.
- **react-beautiful-dnd:** Deprecated and unmaintained. Does not work with React 19 Strict Mode.
- **Storing computed costs in the database:** Costs are always derived from shifts. Never persist cost summaries.

## Database Schema Extension

### New: shifts table
```typescript
// Add to src/lib/db/schema.ts

export const shiftStatusEnum = pgEnum("shift_status", [
  "assigned",
  "open",
])

export const shifts = pgTable("shifts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employee_id")
    .references(() => users.id, { onDelete: "cascade" }),  // nullable for open shifts
  date: varchar({ length: 10 }).notNull(),        // "2026-03-16" ISO date string
  startTime: varchar("start_time", { length: 5 }).notNull(), // "09:00"
  endTime: varchar("end_time", { length: 5 }).notNull(),     // "15:00"
  roleName: jobRoleEnum("role_name").notNull(),
  breakMinutes: integer("break_minutes").notNull().default(0),
  status: shiftStatusEnum().notNull().default("assigned"),
  storeId: integer("store_id")
    .notNull()
    .references(() => stores.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})
```

**Key design decisions:**
- `date` as varchar ISO string ("2026-03-16") -- simpler than date type for JS interop, no timezone issues
- `startTime`/`endTime` as varchar "HH:mm" -- shifts are within a single day (9 AM - 9 PM store hours), no midnight crossing needed for this demo
- `employeeId` nullable for open shifts (used by Phase 3)
- No separate `schedules` table -- shifts reference storeId + date directly. Week grouping is derived from date range in queries.
- Identity column for PK (consistent with existing schema pattern)

**Indexes needed:**
```typescript
// Add after table definition or via SQL migration
// idx_shifts_store_date ON shifts(store_id, date)
// idx_shifts_employee ON shifts(employee_id)
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop | HTML5 DnD API | @dnd-kit/react | Accessibility, touch support, smooth animations, collision detection all handled |
| Date arithmetic | Raw Date math | date-fns (startOfWeek, addDays, format, parseISO) | DST handling, week boundaries, formatting |
| Bar chart | Custom SVG | Recharts via shadcn Chart component | Responsive, themed, tooltip support |
| Form validation | Manual checks | zod schemas + safeParse | Type-safe, composable, error messages |
| Toast notifications | Custom toast | Sonner (already installed) | Accessible, animated, stacking |
| Modal dialogs | Custom overlay | shadcn Dialog component | Focus trap, keyboard nav, accessibility |
| Time picker | Custom input | Select component with 30-min increments | List of options from "09:00" to "21:00" in 30-min steps |

## Common Pitfalls

### Pitfall 1: Grid Performance During Drag
**What goes wrong:** Entire grid (12 rows x 7 days = 84+ cells) re-renders on every drag event, causing jank.
**Why it happens:** Drag state changes flow through parent component, triggering full re-render tree.
**How to avoid:**
- Wrap EmployeeRow in React.memo with stable key
- Wrap DayCell in React.memo -- only re-render when its shifts change
- Use @dnd-kit's built-in overlay system for drag preview (not moving actual DOM)
- Cost calculation via useMemo only recalculates when shifts array reference changes
**Warning signs:** Visible lag when dragging a shift across the grid with 20+ shifts populated.

### Pitfall 2: Stale Cost Meter After Server Action
**What goes wrong:** Cost meter shows optimistic values that diverge from DB after failed save.
**How to avoid:** Always rollback local state on Server Action failure. After successful save, optionally re-fetch from server to reconcile (but not required for single-user demo).

### Pitfall 3: Date Arithmetic for Week Navigation
**What goes wrong:** "Next week" calculation breaks around DST transitions or uses wrong week start day.
**How to avoid:** Use date-fns `startOfWeek(date, { weekStartsOn: 1 })` (Monday start) consistently. Use `addWeeks` and `subWeeks` for navigation. Format dates with `format(date, "yyyy-MM-dd")` for URL params.

### Pitfall 4: Availability Conflict False Positives
**What goes wrong:** Availability is stored as day-level booleans (existing schema), but shifts have specific times.
**How to avoid:** For this demo, day-level availability is sufficient. If isAvailable is false for that dayOfWeek, show red border. The existing availability table uses dayOfWeek + isAvailable boolean. This is fine for the BRIEF's requirements.

### Pitfall 5: Seed Data Becomes Stale
**What goes wrong:** Hardcoded dates in seed data become "last month" after deployment.
**How to avoid:** Generate seed shift dates relative to `new Date()`. Calculate current week's Monday, create shifts for that week. Jake Kim's 38-hour schedule must be dynamically computed.

### Pitfall 6: Mobile Grid Unusable
**What goes wrong:** 7-column grid on 375px screen = 53px columns, too small for shift info.
**How to avoid:** On mobile (<768px), show a simplified daily list view or a horizontally scrollable grid. Disable drag-and-drop on mobile (per CONTEXT.md decision). Cost meter collapses to summary bar at top (per CONTEXT.md decision).

## Code Examples

### Week Navigation Helper
```typescript
// lib/utils/schedule-helpers.ts
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, eachDayOfInterval } from "date-fns"

export function getWeekRange(weekStart: Date) {
  const start = startOfWeek(weekStart, { weekStartsOn: 1 }) // Monday
  const end = endOfWeek(weekStart, { weekStartsOn: 1 })     // Sunday
  return { start, end }
}

export function getWeekDays(weekStart: Date): Date[] {
  const { start, end } = getWeekRange(weekStart)
  return eachDayOfInterval({ start, end })
}

export function formatWeekLabel(weekStart: Date): string {
  const { start, end } = getWeekRange(weekStart)
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
}

export function getNextWeek(weekStart: Date): Date {
  return addWeeks(startOfWeek(weekStart, { weekStartsOn: 1 }), 1)
}

export function getPrevWeek(weekStart: Date): Date {
  return subWeeks(startOfWeek(weekStart, { weekStartsOn: 1 }), 1)
}

// Generate time options for shift start/end (30-min increments within store hours)
export function getTimeOptions(storeOpen = "09:00", storeClose = "21:00"): string[] {
  const options: string[] = []
  const [openH, openM] = storeOpen.split(":").map(Number)
  const [closeH, closeM] = storeClose.split(":").map(Number)
  let h = openH, m = openM
  while (h < closeH || (h === closeH && m <= closeM)) {
    options.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
    m += 30
    if (m >= 60) { h++; m = 0 }
  }
  return options
}
```

### Availability Conflict Check
```typescript
// lib/utils/schedule-helpers.ts
import { getDay } from "date-fns"

export function isEmployeeAvailable(
  employeeAvailability: { dayOfWeek: number; isAvailable: boolean }[],
  date: Date
): boolean {
  // date-fns getDay: 0=Sunday, 1=Monday, etc.
  // Our schema: 0=Monday, 6=Sunday
  const jsDay = getDay(date)
  const ourDay = jsDay === 0 ? 6 : jsDay - 1 // Convert to our 0=Monday convention
  const avail = employeeAvailability.find(a => a.dayOfWeek === ourDay)
  return avail?.isAvailable ?? true // Default available if no record
}
```

### Shift Server Action (create)
```typescript
// lib/actions/shifts.ts
"use server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { shifts } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"

const createShiftSchema = z.object({
  employeeId: z.number().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  roleName: z.enum(["cashier", "stock", "manager", "visual_merch"]),
  breakMinutes: z.number().int().min(0).max(120).default(0),
})

export async function createShift(data: z.infer<typeof createShiftSchema>) {
  const session = await auth()
  if (!session?.user || session.user.role !== "manager") {
    return { success: false, message: "Unauthorized" }
  }

  const parsed = createShiftSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, message: "Invalid shift data" }
  }

  // Validate end > start
  if (parsed.data.endTime <= parsed.data.startTime) {
    return { success: false, message: "End time must be after start time" }
  }

  const [newShift] = await db.insert(shifts).values({
    ...parsed.data,
    storeId: 1, // Single store demo
    status: parsed.data.employeeId ? "assigned" : "open",
  }).returning()

  revalidatePath("/schedule")
  return { success: true, shift: newShift }
}
```

### shadcn Chart (Budget vs Actual)
```typescript
// Using shadcn/ui Chart component wrapping Recharts
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis } from "recharts"

const chartConfig = {
  cost: { label: "Actual", color: "hsl(var(--chart-1))" },
  budget: { label: "Budget", color: "hsl(var(--chart-2))" },
}

function BudgetChart({ dailyCosts, dailyBudget }: { dailyCosts: Record<string, number>; dailyBudget: number }) {
  const data = Object.entries(dailyCosts).map(([date, cost]) => ({
    day: format(parseISO(date), "EEE"),
    cost: Math.round(cost),
    budget: Math.round(dailyBudget),
  }))

  return (
    <ChartContainer config={chartConfig} className="h-[200px]">
      <BarChart data={data}>
        <XAxis dataKey="day" />
        <Bar dataKey="cost" fill="var(--color-cost)" radius={4} />
        <Bar dataKey="budget" fill="var(--color-budget)" radius={4} />
        <ChartTooltip content={<ChartTooltipContent />} />
      </BarChart>
    </ChartContainer>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @dnd-kit/core DndContext | @dnd-kit/react DragDropProvider | 2025 | New API: DragDropProvider, useDraggable returns { ref, isDragSource }, useDroppable returns { ref, isDropTarget } |
| react-beautiful-dnd | @dnd-kit/react | 2023 (deprecated) | rbd does not work with React 19 Strict Mode |
| Manual Recharts config | shadcn Chart component | 2024 | `npx shadcn@latest add chart` gives pre-themed chart wrappers |
| date math with Date() | date-fns v4 | Ongoing | v4 has first-class timezone support, tree-shakeable |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COST-01/02/03/04/05/06 | Cost calculator produces correct totals, daily breakdown, overtime alerts | unit | `npx vitest run src/lib/utils/cost-calculator.test.ts -t "cost"` | No - Wave 0 |
| SCHED-07 | Availability conflict detection | unit | `npx vitest run src/lib/utils/schedule-helpers.test.ts -t "availability"` | No - Wave 0 |
| SCHED-02/03/04 | Shift CRUD Server Actions validation | unit | `npx vitest run src/lib/actions/shifts.test.ts` | No - Wave 0 |
| SCHED-01/05/06 | Grid renders, drag-drop works, color coding | manual-only | Visual check in browser | N/A |
| SCHED-08 | Week navigation | unit | `npx vitest run src/lib/utils/schedule-helpers.test.ts -t "week"` | No - Wave 0 |
| DEMO-03/04 | Seed creates full schedule, Jake at 38hrs | smoke | `npm run db:seed && npx vitest run src/lib/db/seed.test.ts` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before verify

### Wave 0 Gaps
- [ ] `src/lib/utils/cost-calculator.test.ts` -- covers COST-01 through COST-06
- [ ] `src/lib/utils/schedule-helpers.test.ts` -- covers SCHED-07, SCHED-08 (week navigation, availability checks)

## Open Questions

1. **@dnd-kit/react overlay during drag**
   - What we know: The library supports drag overlays for visual feedback during drag
   - What's unclear: Exact API for rendering a custom drag overlay in 0.3.x (may need DragOverlay component import)
   - Recommendation: Start with basic ref-based dragging; add overlay polish as enhancement

2. **Conflict validation for drop targets**
   - What we know: Green/red visual feedback needed during drag-over
   - What's unclear: Whether @dnd-kit/react's onDragOver gives access to target data before drop
   - Recommendation: Use onDragOver event to read target.data and check availability, set visual state accordingly

## Sources

### Primary (HIGH confidence)
- [@dnd-kit/react DragDropProvider docs](https://dndkit.com/react/components/drag-drop-provider) - API, props, events
- [@dnd-kit/react useDraggable docs](https://dndkit.com/react/hooks/use-draggable) - Hook API, return values
- [@dnd-kit/react useDroppable docs](https://dndkit.com/react/hooks/use-droppable) - Hook API, accepts filtering
- [shadcn/ui Chart docs](https://ui.shadcn.com/docs/components/radix/chart) - Recharts wrapper component
- [shadcn/ui Bar Charts](https://ui.shadcn.com/charts/bar) - Bar chart examples
- Existing codebase: schema.ts, constants.ts, employees DAL, employees actions

### Secondary (MEDIUM confidence)
- [npm: @dnd-kit/react 0.3.2](https://www.npmjs.com/package/@dnd-kit/react) - Version confirmed
- [npm: recharts 3.8.0](https://www.npmjs.com/package/recharts) - Version confirmed
- Project research: STACK.md, PITFALLS.md, ARCHITECTURE.md

### Tertiary (LOW confidence)
- @dnd-kit/react DragOverlay component API -- not fully verified for 0.3.x

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all packages version-verified, most already installed
- Architecture: HIGH - patterns established in Phase 1 (DAL, Server Actions, client islands)
- DnD integration: MEDIUM - @dnd-kit/react 0.3.x API verified from official docs but pre-1.0
- Cost calculator: HIGH - pure functions, well-understood domain
- Pitfalls: HIGH - documented extensively in project PITFALLS.md

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable domain, @dnd-kit/react may release new minor)
