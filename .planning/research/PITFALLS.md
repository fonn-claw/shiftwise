# Domain Pitfalls

**Domain:** Retail Staff Scheduling with Real-Time Labor Cost Visibility
**Researched:** 2026-03-21

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Drag-and-Drop Grid Performance Death Spiral

**What goes wrong:** The schedule grid (12 employees x 7 days = 84+ cells, each with shift data) re-renders the entire grid on every drag event. As shifts are added, the labor cost sidebar also recalculates, triggering cascading re-renders. The UI becomes janky at 20+ shifts, unusable at 50+.

**Why it happens:** React re-renders all children when parent state changes. Drag events fire dozens of times per second. Naive state management (storing all shifts in a single useState) causes the entire grid + cost sidebar to re-render on every mouse move.

**Consequences:** The hero feature -- the visual schedule builder -- feels broken. Drag-and-drop is stuttery, cost meter lags behind, and the app feels amateur. This is the LinkedIn showcase centerpiece; poor performance here kills the demo.

**Prevention:**
- Use `dnd-kit` (not react-beautiful-dnd, which is in maintenance mode). dnd-kit is ~10KB, zero dependencies, maintains 60fps in complex grids.
- Memoize individual grid cells with `React.memo` and stable keys. Each cell should only re-render when its specific shift data changes.
- Separate drag state from shift data. Use `dnd-kit`'s built-in overlay system for the drag preview instead of moving actual DOM elements.
- Compute labor costs in a `useMemo` that depends only on the shifts array, not on drag position.
- Use React Strict Mode awareness: dnd-kit handles it, but react-beautiful-dnd does not (double-render in dev mode breaks drag state).

**Detection:** Test with all 12 employees and a full week of shifts populated. If dragging a shift shows any visible jank or the cost sidebar lags, this pitfall has been hit.

**Phase relevance:** Must be addressed in the schedule builder phase (likely Phase 1-2). Retrofitting performance into a working but slow grid is painful.

---

### Pitfall 2: NextAuth v5 Credentials Provider Session Trap

**What goes wrong:** NextAuth v5 has a fundamental design constraint: users authenticated via credentials are NOT persisted in the database by default. The credentials provider only works with JWT sessions, not database sessions. Developers set up database sessions (common with Drizzle adapter) and find that `auth()` returns null despite valid cookies, causing redirect loops and broken protected routes.

**Why it happens:** NextAuth v5 (still in beta as of early 2026) has documented but poorly understood limitations. The credentials provider deliberately does not create database sessions. Combining credentials auth with a Drizzle database adapter creates a strategy mismatch where OAuth would work but credentials silently fails.

**Consequences:** Auth appears to work during initial testing, then breaks in production-like scenarios. Session data is inconsistent on initial login (works after hard reload but not on first render). Role-based access (Manager/Supervisor/Employee) becomes unreliable.

**Prevention:**
- Explicitly configure JWT strategy: `session: { strategy: "jwt" }` in the auth config. Do NOT use database session strategy with credentials.
- Store role information in the JWT token via the `jwt` callback, then expose it in the `session` callback.
- Set `AUTH_SECRET` environment variable (missing secret = silent session failures).
- Test all three demo accounts (manager, supervisor, employee) and verify role-gated UI works after fresh login without page reload.
- Do NOT attempt to extend the session object using patterns from v4 documentation -- the v5 API differs.

**Detection:** Login works but `auth()` returns null in Server Components. Users can log in but see "unauthorized" on protected pages. Session only appears after hard reload.

**Phase relevance:** Must be addressed in the auth/foundation phase (Phase 1). Getting this wrong means every subsequent phase building on role-based views is broken.

---

### Pitfall 3: Time and Date Calculation Errors Across Week Boundaries

**What goes wrong:** Overtime calculation, weekly cost totals, and "copy previous week" all depend on correctly defining what constitutes a "week." JavaScript Date math silently produces wrong results around DST transitions, week boundaries, and midnight-crossing shifts. A shift from 9 PM Sunday to 2 AM Monday belongs to which week? Which day's cost? Both, and getting the split wrong corrupts overtime calculations.

**Why it happens:** JavaScript's Date object has no concept of "work week." Developers use simple date arithmetic (add 7 days = next week) which breaks during DST transitions (one week has 167 or 169 hours instead of 168). Shifts that cross midnight are stored as a single record but affect two calendar days. Overtime is calculated per FLSA workweek, which may not align with the calendar display.

**Consequences:** Jake Kim shows 38 hours but the system calculates 36 or 40 depending on how midnight-crossing shifts and DST are handled. The labor cost meter -- the key differentiating feature -- shows wrong numbers. Compliance warnings fire incorrectly (or worse, fail to fire when they should).

**Prevention:**
- Use `date-fns` for all date arithmetic. Never use raw `Date` math for adding days/weeks.
- Define a clear "week start" (e.g., Monday 00:00:00 local time) and use it consistently everywhere.
- Store shifts with explicit start/end timestamps (not "date + start time + duration"). Always store in UTC, display in local.
- For overtime: calculate total hours per employee per defined workweek, not per calendar week display. Handle midnight-crossing shifts by treating them as one shift for overtime but splitting the cost display across days.
- For "copy previous week": copy shift patterns (day-of-week + time), not absolute dates.
- Test around March and November DST boundaries specifically.

**Detection:** Create a shift that crosses midnight (e.g., 6 PM - 2 AM). Check if the cost appears on the correct day(s). Check if overtime calculation counts hours correctly for an employee with shifts in both the ending and starting portions of a midnight-crossing shift.

**Phase relevance:** Must be designed correctly in the data model phase and implemented carefully in the labor cost calculation phase. Fixing date math retroactively requires touching every calculation.

---

### Pitfall 4: Mobile Schedule Grid is Unusable

**What goes wrong:** The 12-row x 7-column schedule grid that looks great on desktop becomes an unusable mess on mobile. Cells are too small to tap. Drag-and-drop conflicts with scroll gestures. Employees (the majority mobile users) cannot read their own schedules.

**Why it happens:** Desktop-first grid design does not scale down. A 7-column grid on a 375px screen means each column is ~53px -- too narrow for shift information (time, role, break). Touch drag-and-drop on a scrollable container causes gesture conflicts (is the user scrolling or dragging?).

**Consequences:** The brief explicitly states "Mobile responsive (employees check schedules on phones)." Employee role users see their own schedule on mobile. If this is broken, one of three demo personas is broken.

**Prevention:**
- Design two distinct views: weekly grid for desktop (manager workflow), daily list for mobile (employee workflow).
- On mobile, replace drag-and-drop with tap-to-assign or modal-based shift editing. Do not attempt to make grid DnD work on small screens.
- Use CSS container queries or responsive breakpoints to switch between grid and list layouts at ~768px.
- For employee view specifically: show a simple daily agenda (today's shift, upcoming shifts) rather than the full grid.
- Touch-friendly tap targets: minimum 44x44px for any interactive element.

**Detection:** Open the schedule builder on a 375px viewport. Can you read shift times? Can you create/edit a shift without accidentally scrolling? Can an employee see their schedule for the week?

**Phase relevance:** UI/layout phase. Must be designed from the start, not bolted on after building the desktop grid.

## Moderate Pitfalls

### Pitfall 5: Availability Conflict Validation is Deceptively Complex

**What goes wrong:** Simple "available/unavailable per day" seems easy but breaks down with partial-day availability. An employee available "Mon-Fri" might mean 9-5 only, but gets scheduled for an evening shift. The system shows green (available that day) when they are actually unavailable for that specific shift time.

**Why it happens:** The brief defines availability as day-level ("Mon-Sat", "Tue-Sun") but shifts have specific times. Day-level availability is a simplification that creates false confidence.

**Prevention:**
- Model availability as time windows per day (e.g., "Monday 9:00-17:00"), not just day booleans.
- When validating shift assignment, check overlap between the shift time and the availability window, not just the day.
- Display availability conflicts with specificity: "Emma is available Monday but only until 5 PM; this shift ends at 9 PM."
- For the demo, define availability windows in the seed data that align with realistic patterns.

**Detection:** Schedule Tom Liu (available Sat-Sun, Wed) for a 3 PM - 9 PM shift on Wednesday. Does the system validate this correctly if his availability is actually only morning on Wednesdays?

**Phase relevance:** Employee management and schedule builder phases. The data model must support time-windowed availability even if the initial UI simplifies to day-level.

---

### Pitfall 6: Swap Request Logic Creates Impossible States

**What goes wrong:** The shift swap system (Ana trades Friday PM with Carlos for Saturday AM) must validate multiple constraints simultaneously: neither employee goes into overtime, both employees are available for the swapped shift, role requirements are met (can Carlos work as a cashier?), and the swap does not create a coverage gap. Missing any one check creates invalid schedules.

**Why it happens:** Each constraint is simple individually, but they interact. Approving a swap changes hours for two employees simultaneously, which can push one into overtime while taking the other below minimum. Role validation requires checking if the receiving employee has the right role for the shift they are picking up.

**Consequences:** Manager approves swap thinking the system validated it. One employee now has 42 hours (overtime penalty). The other has 18 hours (understaffed). A cashier shift is now covered by someone who is only qualified for stock.

**Prevention:**
- Validate swaps atomically: compute the post-swap state for both employees before allowing approval.
- Check: overtime threshold, availability conflict, role qualification, minimum rest between shifts (clopening prevention), and coverage requirements.
- Show the manager a preview: "If approved: Ana goes from 30hrs to 24hrs, Carlos goes from 36hrs to 42hrs (OVERTIME WARNING)."
- Use a database transaction for swap execution -- either both sides update or neither does.

**Detection:** Set up the Ana/Carlos swap from the demo data. Carlos is at some hour count. Does approving the swap show overtime warnings? Does rejecting it leave both schedules unchanged?

**Phase relevance:** Shift swap feature phase. Must be designed with the validation engine from the schedule builder, not as a separate system.

---

### Pitfall 7: Drizzle ORM Migration and Schema Mistakes

**What goes wrong:** Schema changes during development create migration conflicts. Using `drizzle-kit push` in development and `drizzle-kit migrate` in production creates divergent database states. Serial columns instead of identity columns, missing indexes on frequently queried columns (employee_id, week_start_date, shift_date), and incorrectly defined relationships cause silent data integrity issues.

**Why it happens:** Drizzle is newer than Prisma and has different migration semantics. Developers familiar with Prisma expect `push` to be safe for development iteration, but Drizzle's push can silently drop data in some cases. Relationship definitions in Drizzle use a different API than Prisma's and are easy to get wrong.

**Prevention:**
- Use `drizzle-kit generate` + `drizzle-kit migrate` for all schema changes, even in development. Avoid `push` except for initial prototyping.
- Use identity columns (`integer().primaryKey().generatedAlwaysAsIdentity()`) not serial.
- Add indexes explicitly on: `shifts.employee_id`, `shifts.date`, `shifts.week_id`, `employees.store_id`.
- Define relations using Drizzle's `relations()` API and test with `.query` API to verify joins work.
- Select only needed columns: use `.select({ id: shifts.id, startTime: shifts.startTime })` not bare `.select()`.

**Detection:** Run `drizzle-kit check` after any schema change. Check generated SQL in migration files before applying. Query the shifts table with 84+ rows and verify response time.

**Phase relevance:** Database setup phase (Phase 1). Schema design decisions here cascade through every subsequent phase.

---

### Pitfall 8: Real-Time Cost Meter Becomes a Stale Snapshot

**What goes wrong:** The labor cost sidebar is supposed to update "LIVE" as shifts are dragged, but instead becomes a stale snapshot that only updates on page refresh. Or worse, it shows optimistic calculations that diverge from the actual database state after concurrent edits.

**Why it happens:** Two competing patterns: (1) calculate costs client-side from local state (fast but can diverge from DB), or (2) fetch costs from server after each change (accurate but laggy). Neither alone satisfies "real-time as you drag."

**Prevention:**
- Use a hybrid approach: client-side cost calculation for the drag preview (instant feedback), server-side recalculation after drop (source of truth).
- Keep a local shifts array in state. On drag, compute costs from local state. On drop, persist to server, then reconcile local state with server response.
- Use `useMemo` for cost derivation from the shifts array, not a separate API call during drag.
- After drop/save, re-fetch the authoritative cost calculation from the server to catch any discrepancies.
- For concurrent edit scenarios (two managers editing the same week): this is out of scope for the demo, but note it as a limitation.

**Detection:** Add 5 shifts by drag-and-drop without refreshing. Does the cost meter match what you would calculate manually? Now refresh. Does the number change? If yes, the client and server calculations have diverged.

**Phase relevance:** Schedule builder + labor cost meter phases. These must be built as a single integrated feature, not separately.

## Minor Pitfalls

### Pitfall 9: Compliance Dashboard Dates Are Relative and Stale in Demo

**What goes wrong:** The compliance dashboard warns when "schedule posted less than 14 days before shift." In a demo app, the "current date" is whenever someone views it. A schedule seeded as "this week" becomes "last month" within weeks, and all compliance warnings fire (or none fire) incorrectly.

**Prevention:**
- Seed demo data relative to the current date, not hardcoded dates. Use a seed script that calculates dates from `new Date()`.
- Alternatively, define a "demo date" constant that the compliance engine uses instead of `Date.now()`, so the demo scenario always appears current.
- Display the "as of" date prominently so viewers understand the temporal context.

**Detection:** View the demo 2 weeks after deployment. Do compliance warnings still make sense, or do they all show "overdue"?

**Phase relevance:** Seed data and compliance phases. The seed script must generate relative dates.

---

### Pitfall 10: Color-Coding Accessibility Failures

**What goes wrong:** Role colors (cashier = blue, stock = green, manager = orange) and status colors (overtime amber/red, available/unavailable) convey critical information solely through color. Color-blind users (8% of male users) cannot distinguish the schedule grid.

**Prevention:**
- Add text labels or icons alongside colors: role abbreviation in the cell ("CSH", "STK", "MGR"), not just a colored background.
- Use patterns or shapes in addition to color for overtime indicators (e.g., a warning triangle icon, not just an amber background).
- Test with a color blindness simulator (Chrome DevTools has one built in).
- Ensure sufficient contrast ratio (WCAG AA: 4.5:1) between text and colored backgrounds.

**Detection:** Open Chrome DevTools > Rendering > Emulate vision deficiency > Protanopia. Can you still distinguish roles and overtime status?

**Phase relevance:** UI design phase. Easy to fix early, tedious to retrofit.

---

### Pitfall 11: Next.js App Router Server/Client Component Boundary Confusion

**What goes wrong:** The schedule grid, drag-and-drop, and cost meter all require client-side interactivity ("use client"). Developers either mark too many components as client components (losing SSR benefits and increasing bundle size) or try to pass server-only features (database queries, auth checks) into client components, causing build errors.

**Prevention:**
- Follow the "client boundary" pattern: server components fetch data and pass it as props to a client component boundary. The schedule page server component fetches shifts and employees, then renders `<ScheduleGrid shifts={shifts} employees={employees} />` which is a client component.
- Keep `dnd-kit` context providers in a dedicated client component wrapper.
- Auth checks (`auth()`) happen in server components or middleware, not inside client components.
- Do NOT try to use React Context in server components -- it is unsupported.

**Detection:** Build the app (`next build`). Any "cannot pass function to Client Component" or hydration mismatch errors indicate this pitfall.

**Phase relevance:** Foundation/layout phase. Establishing the correct component boundaries early prevents restructuring later.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Auth & Database Setup | NextAuth v5 credentials + JWT session mismatch (#2) | Configure JWT strategy explicitly, test all 3 demo roles |
| Schema & Data Model | Date/time storage format (#3), Drizzle migration issues (#7) | Store UTC timestamps, use identity columns, add indexes |
| Schedule Grid UI | Drag-and-drop performance (#1), mobile layout (#4) | Use dnd-kit, memoize cells, design mobile view from start |
| Labor Cost Meter | Stale cost calculations (#8), overtime math errors (#3) | Client-side compute during drag, server reconciliation after drop |
| Employee Management | Availability granularity (#5) | Model time-window availability, not day booleans |
| Shift Swaps | Impossible state from unchecked swaps (#6) | Atomic validation of all constraints, preview before approve |
| Compliance Dashboard | Relative date staleness in demo (#9) | Seed data relative to current date |
| UI Polish | Color accessibility (#10), component boundaries (#11) | Add text labels to colors, establish server/client boundaries early |
| Seed Data | Demo becomes stale after deployment (#9) | Generate dates relative to now, or use a fixed "demo date" |

## Sources

- [dnd-kit GitHub - NextAuth compatibility issue](https://github.com/clauderic/dnd-kit/issues/801)
- [dnd-kit aria-describedby hydration mismatch](https://github.com/clauderic/dnd-kit/issues/926)
- [NextAuth v5 auth() returns null](https://github.com/nextauthjs/next-auth/issues/12894)
- [NextAuth v5 credentials + database session failure](https://github.com/nextauthjs/next-auth/issues/12858)
- [NextAuth v5 session inconsistency on login](https://github.com/nextauthjs/next-auth/issues/11034)
- [3 Biggest Mistakes with Drizzle ORM](https://medium.com/@lior_amsalem/3-biggest-mistakes-with-drizzle-orm-1327e2531aff)
- [Drizzle ORM PostgreSQL Best Practices Guide](https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717)
- [JavaScript Date timezone gotchas](https://dev.to/davo_man/the-javascript-date-time-zone-gotcha-that-trips-up-everyone-20lf)
- [DST date confusion in JavaScript](https://dev.to/urin/say-goodbye-to-javascripts-dst-date-confusion-24mj)
- [Mobile drag-and-drop scheduling UX](https://www.myshyft.com/blog/drag-and-drop-scheduling/)
- [Common scheduling mistakes](https://tcpsoftware.com/articles/employee-scheduling-mistakes/)
- [Predictive scheduling law compliance](https://www.rippling.com/blog/predictive-scheduling-laws)
- [Vercel common Next.js App Router mistakes](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)
