# Phase 3: Shift Swaps and Compliance - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Employees can request shift swaps and pick up open shifts, with manager/supervisor approval workflow. Managers get a compliance dashboard with predictive scheduling warnings, premium pay calculations, and an audit trail of all schedule changes. Demo data includes the pending Ana ↔ Carlos swap and the open Thursday PM shift.

</domain>

<decisions>
## Implementation Decisions

### Swap Request Flow
- Employee initiates swap from their schedule view or /swaps page — select their shift, then select the other employee/shift to swap with
- Swap request card shows both shifts side-by-side: who, when, role, hours impact for both employees
- Manager/Supervisor sees pending swaps on /swaps page with one-click Approve/Reject buttons
- Auto-rejection: system checks if swap would push either employee over 40h/week or create a coverage gap (no one covering that slot); rejection shows specific reason
- Swap states: pending → approved/rejected (with timestamp and who acted)
- Employee can cancel their own pending swap request

### Open Shift Board
- Open shifts displayed as a section at top of /swaps page, above swap requests
- Each open shift card shows: date, time, role, with a "Pick Up" button for employees
- Pick-up requests require manager approval (same approval flow as swaps)
- When approved, shift.employeeId is set and status changes from "open" to "assigned"
- Only employees with matching role capability can pick up shifts

### Compliance Dashboard
- Dedicated /compliance page (placeholder already exists from Phase 1)
- Schedule posting status: banner showing if current/next week schedule is posted on time (notice period configurable, default 7 days)
- Warning when schedule changes are made within notice period
- Premium pay calculator: hardcoded rules — 2-hour premium for changes within 24h of shift, 4-hour premium for changes within 72h
- Premium pay shows affected shifts and calculated additional cost
- Predictive scheduling status card showing compliance summary

### Audit Log
- Chronological list on /compliance page (tab or section below compliance cards)
- Records: shift created, shift edited, shift deleted, shift moved (DnD), swap requested, swap approved, swap rejected, shift picked up, schedule copied
- Each entry: timestamp, who made the change, what changed (before/after), affected employee(s)
- Filterable by date range, employee, and action type
- Stored in a new audit_log table (action, userId, details JSON, timestamp)

### Database Schema Extensions
- New `swap_requests` table: id, requestorId (FK users), requestorShiftId (FK shifts), targetEmployeeId (FK users), targetShiftId (FK shifts), status (pending/approved/rejected), reviewedBy (FK users nullable), reviewedAt (timestamp nullable), reason (text nullable for rejection), createdAt, updatedAt
- New `shift_pickups` table: id, shiftId (FK shifts), employeeId (FK users), status (pending/approved/rejected), reviewedBy, reviewedAt, createdAt
- New `audit_log` table: id, action (varchar), userId (FK users), details (jsonb), entityType (varchar), entityId (integer nullable), createdAt
- Extend seed.ts: create pending Ana ↔ Carlos Friday swap, ensure open Thursday PM cashier shift exists

### Claude's Discretion
- Exact card layout for swap request display
- Loading states and empty states for /swaps and /compliance pages
- Notification badge on nav for pending swaps (nice-to-have)
- Exact styling for compliance status indicators
- Pagination vs infinite scroll for audit log

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `BRIEF.md` — §4 Shift Coverage & Swap Requests, §5 Compliance Dashboard, demo data requirements
- `.planning/PROJECT.md` — Project context, compliance and swap requirements
- `.planning/REQUIREMENTS.md` — SWAP-01 through SWAP-07, COMP-01 through COMP-04, DEMO-05, DEMO-06

### Prior phases
- `.planning/phases/02-schedule-builder-and-cost-meter/02-CONTEXT.md` — Schedule grid decisions, shift CRUD pattern, cost meter
- `src/lib/db/schema.ts` — Current schema (shifts table, users, stores)
- `src/lib/actions/shifts.ts` — Existing shift server actions pattern
- `src/lib/dal/shifts.ts` — Shift DAL pattern (getShiftsForWeek)
- `src/lib/utils/cost-calculator.ts` — calculateWeekCosts for overtime checking

### Research
- `.planning/research/ARCHITECTURE.md` — Server action patterns, DAL auth-gating

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/actions/shifts.ts` — Server action pattern with zod validation and auth checks (reuse for swap/pickup actions)
- `src/lib/dal/shifts.ts` — DAL pattern with auth-gating (reuse for swap/pickup/audit DAL)
- `src/lib/utils/cost-calculator.ts` — calculateWeekCosts for overtime validation in swap auto-rejection
- `src/lib/utils/schedule-helpers.ts` — getWeekRange, isEmployeeAvailable for coverage gap detection
- `src/components/schedule/shift-card.tsx` — Shift display component (reuse for swap visualization)
- `src/components/ui/` — shadcn Dialog, Badge, Card, Tabs, Button components
- `src/app/(dashboard)/swaps/page.tsx` — Placeholder page exists
- `src/app/(dashboard)/compliance/page.tsx` — Placeholder page exists

### Established Patterns
- DAL pattern: auth-gated data access functions
- Server actions: "use server", zod schemas, auth check, db operation, revalidatePath
- Optimistic UI updates in client components (schedule-builder.tsx pattern)
- Role-based access checks (manager only for mutations, supervisor for approvals)

### Integration Points
- Schedule page: existing shift cards could link to swap creation
- Sidebar nav: /swaps and /compliance already in navigation
- Shifts table: swap and pickup modify shift.employeeId and shift.status
- Users table: requestor, target, reviewer relationships
- Seed data: extend existing seed to add swap request and ensure open shift

</code_context>

<specifics>
## Specific Ideas

- Swap request details should clearly show the "trade" — both employees' shifts side by side so the reviewer understands the full picture
- Auto-rejection should be transparent — show the specific reason (e.g., "Carlos would have 44 hours if approved, exceeding 40h limit")
- Compliance dashboard should feel like a compliance officer's tool — clear status indicators, not cluttered
- Audit log should be thorough but scannable — key info in the row, details on expansion
- Demo data: Ana ↔ Carlos Friday swap (per BRIEF.md) should be seeded as pending

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-shift-swaps-and-compliance*
*Context gathered: 2026-03-21*
