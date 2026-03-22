---
phase: 02-schedule-builder-and-cost-meter
plan: 01
subsystem: database, api
tags: [drizzle, shifts, cost-calculator, schedule-helpers, server-actions, vitest]

requires:
  - phase: 01-foundation-and-employee-management
    provides: "Schema with stores, users, employeeRoles, availability tables; DAL pattern; Server Action pattern"
provides:
  - "shifts table with shiftStatusEnum in database schema"
  - "Pure cost calculation functions (calculateWeekCosts, calculateShiftHours, CostSummary)"
  - "Schedule helper utilities (getWeekRange, getWeekDays, formatWeekLabel, getTimeOptions, isEmployeeAvailable, formatTime)"
  - "Shift CRUD server actions (createShift, updateShift, deleteShift, moveShift, copyWeekSchedule)"
  - "Shifts DAL (getShiftsForWeek, getShiftById) with auth gating"
  - "Stores DAL (getStore) with auth gating"
  - "Seed data with 60+ shifts for current week, Jake Kim at 38h, one open Thursday PM cashier shift"
affects: [02-02, 02-03, 03-shift-coverage-and-compliance]

tech-stack:
  added: []
  patterns: [pure-functions-for-client-calculation, varchar-dates-for-timezone-safety]

key-files:
  created:
    - src/lib/utils/cost-calculator.ts
    - src/lib/utils/cost-calculator.test.ts
    - src/lib/utils/schedule-helpers.ts
    - src/lib/utils/schedule-helpers.test.ts
    - src/lib/dal/stores.ts
    - src/lib/dal/shifts.ts
    - src/lib/actions/shifts.ts
  modified:
    - src/lib/db/schema.ts
    - src/lib/db/seed.ts

key-decisions:
  - "varchar dates/times to avoid timezone issues across client/server boundary"
  - "Pure functions in cost-calculator.ts (no server imports) for client-side real-time cost updates"
  - "Jake Kim scheduled at exactly 38 hours via 6 shifts across Tue-Sun"

patterns-established:
  - "Pure utility functions exportable to both server and client components"
  - "Shift CRUD actions with zod validation and manager-only auth gates"
  - "Dynamic seed dates via date-fns relative to current Monday"

requirements-completed: [SCHED-02, SCHED-03, SCHED-04, SCHED-07, SCHED-08, COST-01, COST-02, COST-03, COST-04, COST-05, COST-06, DEMO-03, DEMO-04]

duration: 3min
completed: 2026-03-22
---

# Phase 2 Plan 01: Schedule Backend Foundation Summary

**Shifts schema, pure cost calculator with 37 passing tests, schedule helpers, shift CRUD server actions, and seed data with realistic weekly schedule**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T00:02:59Z
- **Completed:** 2026-03-22T00:06:34Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Shifts table added to schema with identity PK, nullable employeeId for open shifts, varchar dates/times
- Cost calculator with calculateShiftHours and calculateWeekCosts produces correct totals, daily breakdowns, and overtime alerts (amber at 35h, red at 40h)
- Schedule helpers handle week boundaries (Mon-Sun), time option generation, availability checks, and time formatting
- Full shift CRUD server actions with zod validation, manager-only auth, and copyWeekSchedule for week duplication
- Seed data creates 60+ shifts for current week with Jake Kim at exactly 38 hours and one open Thursday PM cashier shift

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests** - `febbbe5` (test)
2. **Task 1 (GREEN): Schema, utilities, stores DAL** - `74d183a` (feat)
3. **Task 2: Server actions, shifts DAL, seed data** - `25a1bf3` (feat)

## Files Created/Modified
- `src/lib/db/schema.ts` - Added shiftStatusEnum and shifts table
- `src/lib/utils/cost-calculator.ts` - Pure functions: calculateShiftHours, calculateWeekCosts, CostSummary interface
- `src/lib/utils/cost-calculator.test.ts` - 16 tests covering hours calculation, costs, overtime alerts, open shifts
- `src/lib/utils/schedule-helpers.ts` - Week navigation, time options, availability check, formatTime
- `src/lib/utils/schedule-helpers.test.ts` - 21 tests covering week ranges, days, labels, time options, availability
- `src/lib/dal/stores.ts` - Auth-gated getStore function
- `src/lib/dal/shifts.ts` - Auth-gated getShiftsForWeek, getShiftById
- `src/lib/actions/shifts.ts` - createShift, updateShift, deleteShift, moveShift, copyWeekSchedule
- `src/lib/db/seed.ts` - Extended with 60+ shifts for current week

## Decisions Made
- Used varchar for dates ("2026-03-16") and times ("09:00") to avoid timezone conversion issues
- Cost calculator kept as pure functions with no server imports so it can run client-side for real-time updates
- Jake Kim's 38-hour schedule uses 6 shifts across Tue-Sun with varying roles (stock + cashier)
- Seed dates computed dynamically relative to current Monday using date-fns

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All backend primitives ready for Plan 02 (schedule grid UI) and Plan 03 (cost meter sidebar)
- Cost calculator can be imported directly into client components via useMemo
- Shifts DAL and server actions ready for the schedule page Server Component

---
*Phase: 02-schedule-builder-and-cost-meter*
*Completed: 2026-03-22*
