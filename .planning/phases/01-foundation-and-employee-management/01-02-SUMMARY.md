---
phase: 01-foundation-and-employee-management
plan: 02
subsystem: ui
tags: [next.js, shadcn, sidebar, navigation, employee-table, role-badges, drizzle]

requires:
  - phase: 01-01
    provides: "Auth system, DB schema, seed data, constants, DAL auth helpers"
provides:
  - "App shell with collapsible sidebar, header, mobile nav"
  - "Role-filtered navigation (manager/supervisor/employee)"
  - "Employee list page with sortable table"
  - "Employee DAL (getEmployees, getEmployeeById)"
  - "SessionProvider wrapper"
  - "Placeholder pages for dashboard, schedule, swaps, compliance"
affects: [02-schedule-builder, 03-swaps-compliance, 04-dashboard]

tech-stack:
  added: []
  patterns: ["Dashboard layout with server-side auth redirect", "Client components receive session data via props", "DAL pattern with role-based data filtering", "base-ui dropdown with render prop"]

key-files:
  created:
    - src/components/providers.tsx
    - src/components/layout/sidebar.tsx
    - src/components/layout/header.tsx
    - src/components/layout/mobile-nav.tsx
    - src/app/(dashboard)/layout.tsx
    - src/app/(dashboard)/page.tsx
    - src/app/(dashboard)/employees/page.tsx
    - src/components/employees/employee-table.tsx
    - src/app/(dashboard)/dashboard/page.tsx
    - src/app/(dashboard)/schedule/page.tsx
    - src/app/(dashboard)/swaps/page.tsx
    - src/app/(dashboard)/compliance/page.tsx
  modified: []

key-decisions:
  - "base-ui dropdown uses render prop instead of asChild (shadcn v2 API)"
  - "Placeholder pages created for all nav routes to prevent dead links"
  - "Employee data serialized via JSON.parse(JSON.stringify) for server-to-client transfer"

patterns-established:
  - "Dashboard layout: server auth check -> redirect or render with session props"
  - "Navigation filtering: navItems array with roles field, filtered by session.user.role"
  - "Role badge colors: manager=orange, supervisor=blue, employee=green"
  - "Job role badge colors from ROLE_COLORS constant: cashier=blue, stock=green, manager=orange, visual_merch=purple"

requirements-completed: [EMPL-01, EMPL-05, EMPL-06]

duration: 3min
completed: 2026-03-21
---

# Phase 01 Plan 02: App Shell and Employee List Summary

**Collapsible sidebar with role-filtered navigation, header with role badges, and sortable employee table with multi-role color-coded badges and rate visibility control**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T23:34:11Z
- **Completed:** 2026-03-21T23:37:12Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- App shell with collapsible sidebar (w-64 to w-16), header with user/role badge, and mobile bottom nav
- Sidebar navigation filtered by user role (manager sees 5 items, employee sees 2)
- Employee list with sortable table showing all 12 employees with multi-role color-coded badges
- Hourly rate column visible only to manager role
- Placeholder pages for dashboard, schedule, swaps, compliance routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Build app shell layout** - `bad2168` (feat)
2. **Task 2: Build employee list page** - `030d38d` (feat)

## Files Created/Modified
- `src/components/providers.tsx` - SessionProvider wrapper for client components
- `src/components/layout/sidebar.tsx` - Collapsible sidebar with role-filtered nav items
- `src/components/layout/header.tsx` - Header with page title, role badge, logout dropdown
- `src/components/layout/mobile-nav.tsx` - Fixed bottom nav for mobile
- `src/app/(dashboard)/layout.tsx` - Auth-protected dashboard layout
- `src/app/(dashboard)/page.tsx` - Root redirect (manager->dashboard, employee->schedule)
- `src/app/(dashboard)/employees/page.tsx` - Server component calling getEmployees DAL
- `src/components/employees/employee-table.tsx` - Sortable table with role badges and rate visibility
- `src/app/(dashboard)/dashboard/page.tsx` - Dashboard placeholder
- `src/app/(dashboard)/schedule/page.tsx` - Schedule placeholder
- `src/app/(dashboard)/swaps/page.tsx` - Swaps placeholder
- `src/app/(dashboard)/compliance/page.tsx` - Compliance placeholder

## Decisions Made
- Used base-ui `render` prop instead of radix `asChild` for dropdown trigger (shadcn v2 uses base-ui)
- Created placeholder pages for all nav routes to prevent broken links during development
- Serialized employee data via JSON.parse(JSON.stringify) for server-to-client prop transfer (Dates/Decimals)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed DropdownMenuTrigger asChild to render prop**
- **Found during:** Task 1 (App shell layout)
- **Issue:** shadcn v2 uses base-ui which does not support asChild prop on DropdownMenuTrigger
- **Fix:** Changed to render prop pattern: `<DropdownMenuTrigger render={<Button />}>`
- **Files modified:** src/components/layout/header.tsx
- **Verification:** TypeScript compilation passes
- **Committed in:** bad2168

**2. [Rule 2 - Missing Critical] Added placeholder pages for nav routes**
- **Found during:** Task 1 (App shell layout)
- **Issue:** Sidebar links to /dashboard, /schedule, /swaps, /compliance would 404 without pages
- **Fix:** Created placeholder pages for all four routes
- **Files modified:** 4 new page.tsx files in (dashboard) route group
- **Verification:** Build passes with all routes registered
- **Committed in:** bad2168

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- App shell complete with all navigation routes
- Employee list displays all 12 seeded employees
- Ready for Plan 03 (employee detail slide-over panel and availability editing)
- DAL pattern established for future data access layers

---
*Phase: 01-foundation-and-employee-management*
*Completed: 2026-03-21*
