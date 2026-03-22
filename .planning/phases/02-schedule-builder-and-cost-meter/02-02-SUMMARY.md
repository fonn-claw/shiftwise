---
phase: 02-schedule-builder-and-cost-meter
plan: 02
subsystem: ui
tags: [react, schedule-grid, cost-meter, recharts, shadcn-chart, optimistic-updates, css-grid]

requires:
  - phase: 02-schedule-builder-and-cost-meter
    provides: "Shifts DAL, cost calculator, schedule helpers, server actions, constants"
  - phase: 01-foundation-and-employee-management
    provides: "Dashboard layout, shadcn components, employee DAL, auth"
provides:
  - "Interactive weekly schedule grid with employee rows and 7 day columns"
  - "Shift create/edit/delete dialog with validation"
  - "Cost meter sidebar with summary cards, budget progress bar, daily breakdown"
  - "Per-employee hours list with overtime indicators (amber 35h, red 40h)"
  - "Budget vs actual bar chart via Recharts/shadcn Chart"
  - "Optimistic shift mutations with rollback on server error"
  - "Mobile-responsive cost summary bar"
  - "Week navigation (prev/next) via searchParams"
affects: [02-03, 03-shift-coverage-and-compliance]

tech-stack:
  added: [recharts]
  patterns: [optimistic-updates-with-rollback, css-grid-schedule, client-island-state-owner, useMemo-derived-costs]

key-files:
  created:
    - src/components/schedule/schedule-builder.tsx
    - src/components/schedule/schedule-grid.tsx
    - src/components/schedule/shift-card.tsx
    - src/components/schedule/shift-dialog.tsx
    - src/components/schedule/cost-meter-sidebar.tsx
    - src/components/schedule/daily-breakdown.tsx
    - src/components/schedule/employee-hours-list.tsx
    - src/components/schedule/budget-chart.tsx
    - src/components/ui/chart.tsx
  modified:
    - src/app/(dashboard)/schedule/page.tsx
    - package.json

key-decisions:
  - "schedule-builder.tsx as single client state owner with all shifts in useState, costs derived via useMemo"
  - "Optimistic updates: temp shift added immediately, replaced with server response or rolled back on error"
  - "base-ui Select onValueChange wraps with null coalesce since it can pass null (unlike Radix)"
  - "Week navigation uses plain anchor tags instead of Button asChild (base-ui Button lacks asChild prop)"

patterns-established:
  - "Client island pattern: server component fetches data, single client component owns all interactive state"
  - "Optimistic mutation: update state immediately, call server action, rollback on failure with toast"
  - "CSS Grid schedule layout: grid-cols-[200px_repeat(7,1fr)] for employee-day grid"

requirements-completed: [SCHED-01, SCHED-02, SCHED-03, SCHED-04, SCHED-06, SCHED-07, COST-01, COST-02, COST-03, COST-04, COST-05, COST-06, COST-07, COST-08]

duration: 5min
completed: 2026-03-22
---

# Phase 02 Plan 02: Schedule Grid UI and Cost Meter Summary

**Weekly schedule grid with CSS Grid layout, color-coded shift cards, create/edit dialog, and real-time cost meter sidebar with Recharts budget chart**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-22T00:09:00Z
- **Completed:** 2026-03-22T00:14:00Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Schedule page replaced with server component that fetches employees, shifts, and store data in parallel
- Interactive weekly grid with 12 employee rows, 7 day columns, today highlight, and unavailable cell indicators
- Color-coded shift cards using ROLE_COLORS with open shift badges
- Full shift CRUD via dialog with time selects, role dropdown, break duration, and validation
- Cost meter sidebar with total hours/cost/budget% summary cards, progress bar (green/amber/red thresholds), daily breakdown, employee hours list with overtime alerts, and Recharts bar chart
- Optimistic updates: shifts state updated immediately, server action called in background, rollback on error
- Mobile-responsive: collapsible cost summary bar above grid on small screens

## Task Commits

Each task was committed atomically:

1. **Task 1+2: Schedule grid UI, shift dialog, and cost meter sidebar** - `b3fbf83` (feat)
   - Both tasks committed together because cost-meter components are imported by schedule-builder.tsx and needed for build

**Plan metadata:** (pending)

## Files Created/Modified
- `src/app/(dashboard)/schedule/page.tsx` - Server component fetching data for schedule builder
- `src/components/schedule/schedule-builder.tsx` - Client state owner with optimistic mutations
- `src/components/schedule/schedule-grid.tsx` - CSS Grid with employee rows and day columns
- `src/components/schedule/shift-card.tsx` - Role-colored shift display cards
- `src/components/schedule/shift-dialog.tsx` - Create/edit shift modal with validation
- `src/components/schedule/cost-meter-sidebar.tsx` - Right sidebar with all cost displays
- `src/components/schedule/daily-breakdown.tsx` - Per-day hours and cost display
- `src/components/schedule/employee-hours-list.tsx` - Collapsible list with overtime badges
- `src/components/schedule/budget-chart.tsx` - Recharts bar chart for budget vs actual
- `src/components/ui/chart.tsx` - shadcn chart wrapper component

## Decisions Made
- Combined both tasks into single commit since cost-meter components are imported by schedule-builder and needed for build to pass
- Used plain anchor tags for week navigation since base-ui Button component lacks asChild prop
- Wrapped Select onValueChange handlers with null coalesce since base-ui Select can pass null (unlike Radix Select)
- Used `as` type assertion for roleName in shift dialog save handler to satisfy strict enum type

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed base-ui Select onValueChange type mismatch**
- **Found during:** Task 1 (shift-dialog.tsx)
- **Issue:** base-ui Select's onValueChange passes `string | null` but React's setState expects `string`
- **Fix:** Wrapped all Select onValueChange handlers with `(v) => setter(v ?? "")`
- **Files modified:** src/components/schedule/shift-dialog.tsx
- **Verification:** Build passes
- **Committed in:** b3fbf83

**2. [Rule 1 - Bug] Fixed Button asChild prop not available in base-ui**
- **Found during:** Task 1 (schedule-builder.tsx)
- **Issue:** base-ui Button component does not support asChild prop (Radix-only feature)
- **Fix:** Replaced Button+asChild with plain anchor tags styled with Tailwind
- **Files modified:** src/components/schedule/schedule-builder.tsx
- **Verification:** Build passes
- **Committed in:** b3fbf83

**3. [Rule 1 - Bug] Fixed roleName type mismatch for server actions**
- **Found during:** Task 1 (schedule-builder.tsx)
- **Issue:** Handler data types used generic `string` for roleName but server action expects union type
- **Fix:** Changed handler type signatures to use the exact enum union type
- **Files modified:** src/components/schedule/schedule-builder.tsx, src/components/schedule/shift-dialog.tsx
- **Verification:** Build passes
- **Committed in:** b3fbf83

---

**Total deviations:** 3 auto-fixed (3 bugs)
**Impact on plan:** All auto-fixes necessary for type safety and build compliance. No scope creep.

## Issues Encountered
None beyond the type fixes documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schedule grid and cost meter fully functional, ready for drag-and-drop in Plan 02-03
- All shift CRUD operations working with optimistic updates
- Cost meter derives from shared shifts state, will automatically respond to drag-and-drop state changes

---
*Phase: 02-schedule-builder-and-cost-meter*
*Completed: 2026-03-22*
