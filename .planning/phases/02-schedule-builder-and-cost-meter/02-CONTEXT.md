# Phase 2: Schedule Builder and Cost Meter - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the visual weekly schedule grid (THE HERO FEATURE) with drag-and-drop shift assignment, real-time labor cost meter sidebar, shift CRUD, week navigation, and copy-previous-week. This phase delivers the core scheduling experience — rows are employees, columns are days, cells are color-coded shifts. The cost meter updates instantly as shifts are added/moved/removed. Seed data includes a fully scheduled current week with realistic patterns (Jake near overtime, one open shift).

</domain>

<decisions>
## Implementation Decisions

### Schedule Grid Layout
- Weekly grid: rows = employees (12), columns = 7 days (Mon-Sun)
- 30-minute time increments for shift start/end
- Each shift cell shows time range (e.g., "9:00 AM - 3:00 PM") + role badge, colored by role using existing ROLE_COLORS from constants.ts
- Click empty cell opens create shift modal with pre-filled day and employee
- Click existing shift opens edit modal with current values + delete option
- Conflicts (employee unavailable) shown with red border/highlight on cell
- Today's column highlighted with subtle indigo/blue background
- Employee names in first column with role badges

### Drag-and-Drop Interaction
- Entire shift cells are draggable — drag to different employee row or different day column
- Visual feedback during drag: green outline if valid drop target, red if conflict (unavailable, overtime)
- Optimistic updates: grid updates immediately, saves in background, reverts on error
- Disable drag on mobile — use edit modal for reassignment instead
- Only Manager role can drag shifts (Supervisor and Employee view-only for the grid)

### Cost Meter Sidebar
- Right sidebar, always visible alongside grid on desktop (fixed position)
- Shows: total hours, total cost ($), % of revenue budget ($12K/week)
- Budget progress bar: green under 80%, amber 80-100%, red over 100%
- Daily cost breakdown row (Mon $X | Tue $Y | ...)
- Weekly total vs budget bar chart (simple horizontal bars)
- Per-employee hours: collapsible list showing each employee's weekly hours with amber (≥35h) and red (≥40h) indicators
- Updates in real-time as shifts are added/moved/removed (client-side calculation, no server round-trips)
- Mobile: collapsed to summary bar at top of schedule, expandable on tap

### Week Navigation & Copy
- Prev/Next arrows with current week date range displayed (e.g., "Mar 16 - Mar 22, 2026")
- "Copy from previous week" button that duplicates all shifts from prior week, with confirmation dialog
- Warning dialog if navigating away with unsaved changes
- Current week as default view on page load

### Shift CRUD
- Create: modal form with employee (pre-filled if clicked from grid), day, start time, end time, role dropdown, break duration
- Edit: same modal, pre-filled with current shift data
- Delete: confirmation dialog from edit modal
- Validation: shift must be within store hours (9 AM - 9 PM), end > start, employee must be available that day

### Seed Data (Schedule)
- Current week fully scheduled with realistic retail patterns
- Morning shift: 9 AM - 3 PM, Afternoon shift: 3 PM - 9 PM, Full day: 9 AM - 5 PM (managers)
- Weekend staffing heavier than weekdays
- Jake Kim near overtime threshold (38 hrs scheduled)
- One open shift: Thursday PM cashier (unassigned — seeded as shift without employee for Phase 3)

### Claude's Discretion
- Exact grid cell dimensions and spacing
- Shift modal form layout
- Loading states for schedule data
- Error toast design for failed saves
- Exact chart library usage for budget visualization (Recharts via shadcn chart recommended)
- Animation/transition effects for drag-and-drop

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `BRIEF.md` — Schedule builder spec (§1 Visual Schedule Builder, §2 Real-Time Labor Cost Meter), shift patterns, demo data
- `.planning/PROJECT.md` — Project context, core value (real-time cost visibility)
- `.planning/REQUIREMENTS.md` — SCHED-01 through SCHED-09, COST-01 through COST-08, DEMO-03, DEMO-04

### Prior phase
- `.planning/phases/01-foundation-and-employee-management/01-CONTEXT.md` — Auth decisions, app shell, role colors, DAL pattern
- `src/lib/constants.ts` — ROLE_COLORS, DAYS_OF_WEEK constants (reuse in grid)
- `src/lib/db/schema.ts` — Database tables (users, stores, employeeRoles, availability)

### Research
- `.planning/research/STACK.md` — @dnd-kit recommendations, Recharts for charts
- `.planning/research/PITFALLS.md` — DnD performance in grid, date math errors
- `.planning/research/ARCHITECTURE.md` — Client-side cost calculation pattern, schedule grid as custom component

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/constants.ts` — ROLE_COLORS (cashier=blue, stock=green, manager=orange, visual_merch=purple), DAYS_OF_WEEK array
- `src/lib/dal/employees.ts` — getEmployees() with auth-gated data access pattern
- `src/lib/auth.ts` — auth() session with role in JWT
- `src/components/ui/` — shadcn/ui components (Button, Dialog, Sheet, Input, Select, etc.)
- `src/components/layout/sidebar.tsx` — Collapsible sidebar pattern (right sidebar follows same pattern)
- `src/lib/db/schema.ts` — Existing tables to extend with shifts table

### Established Patterns
- DAL pattern for data access with auth checks
- Server actions for mutations (src/lib/actions/employees.ts pattern)
- Role-based UI filtering (sidebar shows/hides items by role)
- Sheet component for slide-over panels (reuse pattern for modals)

### Integration Points
- Dashboard layout (`src/app/(dashboard)/layout.tsx`) — schedule page lives under /schedule
- Sidebar navigation — schedule link already exists as placeholder
- Employee data — grid rows come from employees table
- Availability data — conflict detection reads from availability table
- Store config — budget comes from stores table ($12K/week)

</code_context>

<specifics>
## Specific Ideas

- The schedule grid is THE HERO FEATURE — it should be the most polished, impressive part of the app
- Labor cost meter should feel like a "real-time financial instrument" — immediate, precise, professional
- Overtime warnings should be visually urgent but not alarming (amber/red indicators, not flashing)
- Color-coded shifts by role must match the same colors used in employee role badges (ROLE_COLORS)
- Grid should feel like a modern workforce management tool, not a basic spreadsheet

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-schedule-builder-and-cost-meter*
*Context gathered: 2026-03-21*
