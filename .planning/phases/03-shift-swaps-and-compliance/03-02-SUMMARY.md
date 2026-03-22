---
phase: 03-shift-swaps-and-compliance
plan: 02
subsystem: api, ui
tags: [drizzle, server-actions, swap-requests, shift-pickups, optimistic-updates]

requires:
  - phase: 03-shift-swaps-and-compliance-01
    provides: "Schema tables (swapRequests, shiftPickups, auditLog), swap-validation utils, audit logging"
  - phase: 02-schedule-builder
    provides: "Shift DAL, shift actions pattern, cost-calculator, schedule-helpers"
provides:
  - "DAL for open shifts, swap requests, and pickup requests with auth-gated queries"
  - "Server actions for full swap lifecycle (create/approve/reject/cancel)"
  - "Server actions for pickup lifecycle (create/approve/reject) with role matching"
  - "Complete /swaps page UI with open shift board and request management"
affects: [03-shift-swaps-and-compliance-03]

tech-stack:
  added: []
  patterns:
    - "Alias-based self-joins with drizzle-orm for multi-table swap queries"
    - "Optimistic locking via AND status='pending' in WHERE clause"
    - "Auto-rejection on approve when validation fails (overtime/hours)"

key-files:
  created:
    - src/lib/dal/swaps.ts
    - src/lib/actions/swaps.ts
    - src/lib/actions/pickups.ts
    - src/components/swaps/open-shift-card.tsx
    - src/components/swaps/swap-request-card.tsx
    - src/components/swaps/swaps-page-client.tsx
  modified:
    - src/app/(dashboard)/swaps/page.tsx

key-decisions:
  - "Alias-based joins for swap queries to get requestor+target employee and shift data in one query"
  - "Auto-reject on approve (not upfront) so managers see the reason when they attempt approval"
  - "Employee role filtering in DAL (employees only see their own requests)"

patterns-established:
  - "Swap/pickup approval pattern: optimistic lock on pending, validate, auto-reject or approve"
  - "SwapsPageClient as single client state owner with optimistic updates and useTransition"

requirements-completed: [SWAP-01, SWAP-02, SWAP-03, SWAP-04, SWAP-05, SWAP-07]

duration: 3min
completed: 2026-03-22
---

# Phase 03 Plan 02: Swap & Pickup Workflow Summary

**Full /swaps page with open shift board, swap request cards with side-by-side shift display, and pickup request management with role-matching and overtime auto-rejection**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T00:44:20Z
- **Completed:** 2026-03-22T00:47:40Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Auth-gated DAL queries for open shifts, swap requests, pickup requests, and employee week shifts
- Server actions for full swap lifecycle with validateSwapHours auto-rejection and audit logging
- Server actions for pickup lifecycle with employeeRoles role-matching and overtime checks
- Polished /swaps page with open shifts grid, pending/all tab filter, optimistic updates

## Task Commits

Each task was committed atomically:

1. **Task 1: DAL and server actions for swaps and pickups** - `cf5f6ab` (feat)
2. **Task 2: /swaps page UI with open shifts board and swap request list** - `2407325` (feat)

## Files Created/Modified
- `src/lib/dal/swaps.ts` - Data access for open shifts, swap requests, pickup requests, employee week shifts
- `src/lib/actions/swaps.ts` - Server actions: createSwapRequest, approveSwap, rejectSwap, cancelSwap
- `src/lib/actions/pickups.ts` - Server actions: createPickupRequest, approvePickup, rejectPickup
- `src/components/swaps/open-shift-card.tsx` - Open shift card with date, time, role badge, Pick Up button
- `src/components/swaps/swap-request-card.tsx` - Swap card with side-by-side shifts, hours impact, approve/reject/cancel
- `src/components/swaps/swaps-page-client.tsx` - Client component with optimistic updates and tab filtering
- `src/app/(dashboard)/swaps/page.tsx` - Server component replacing placeholder, fetches data via DAL

## Decisions Made
- Used alias-based joins in drizzle-orm for swap queries to get requestor+target employee and shift data in a single query
- Auto-rejection happens on approve action (not upfront) so managers see the validation reason when they attempt approval
- Employee role filtering applied in DAL so employees only see their own swap/pickup requests

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Swap and pickup workflows fully operational
- Ready for Phase 03 Plan 03 (compliance dashboard)
- Pre-existing compliance page TypeScript error (missing audit-log component) will be resolved in Plan 03

---
*Phase: 03-shift-swaps-and-compliance*
*Completed: 2026-03-22*
