# Phase 3: Shift Swaps and Compliance - Research

**Researched:** 2026-03-22
**Domain:** Shift swap workflows, compliance dashboard, audit logging (Next.js App Router + Drizzle ORM)
**Confidence:** HIGH

## Summary

Phase 3 adds three functional areas to the existing ShiftWise scheduling app: (1) shift swap and open-shift pickup workflows with approval chains, (2) a compliance dashboard with predictive scheduling warnings and premium pay calculations, and (3) an audit log tracking all schedule changes. All three extend the existing Drizzle schema, server action patterns, and DAL auth-gating already established in Phases 1-2.

The implementation is straightforward because the existing codebase provides clear patterns for every layer: schema tables with identity PKs, server actions with zod validation + auth checks, DAL functions with auth-gating, and client components with optimistic updates. No new libraries are needed -- the existing stack (Drizzle ORM, zod, date-fns, lucide-react, shadcn/ui, recharts) covers all requirements.

**Primary recommendation:** Follow the established server action + DAL pattern exactly. Add three new schema tables (swap_requests, shift_pickups, audit_log), create matching DAL/action files, and build the /swaps and /compliance pages using existing shadcn components (Card, Badge, Tabs, Dialog, Button).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Swap request flow: Employee initiates from schedule view or /swaps page, selects their shift then target employee/shift
- Swap request card shows both shifts side-by-side with hours impact
- Manager/Supervisor sees pending swaps on /swaps with one-click Approve/Reject
- Auto-rejection checks: overtime (>40h/week) and coverage gaps; rejection shows specific reason
- Swap states: pending -> approved/rejected (with timestamp and reviewer)
- Employee can cancel own pending swap request
- Open shifts displayed as section at top of /swaps page, above swap requests
- Pick-up requests require manager approval (same flow as swaps)
- Only employees with matching role capability can pick up shifts
- Compliance dashboard on /compliance page (placeholder exists)
- Schedule posting status banner with configurable notice period (default 7 days)
- Warning when changes made within notice period
- Premium pay: hardcoded rules -- 2-hour premium for changes within 24h, 4-hour premium within 72h
- Audit log on /compliance page (tab or section below compliance cards)
- Audit log records: shift created/edited/deleted/moved, swap requested/approved/rejected, shift picked up, schedule copied
- Each entry: timestamp, who, what changed (before/after), affected employee(s)
- Filterable by date range, employee, action type
- New `swap_requests` table: id, requestorId, requestorShiftId, targetEmployeeId, targetShiftId, status, reviewedBy, reviewedAt, reason, createdAt, updatedAt
- New `shift_pickups` table: id, shiftId, employeeId, status, reviewedBy, reviewedAt, createdAt
- New `audit_log` table: id, action, userId, details (jsonb), entityType, entityId, createdAt
- Extend seed.ts: pending Ana <-> Carlos Friday swap, ensure open Thursday PM cashier shift

### Claude's Discretion
- Exact card layout for swap request display
- Loading states and empty states for /swaps and /compliance pages
- Notification badge on nav for pending swaps (nice-to-have)
- Exact styling for compliance status indicators
- Pagination vs infinite scroll for audit log

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SWAP-01 | Manager can mark shifts as "open" (needing coverage) | Existing shift.status enum already has "open" value; updateShift action sets status based on employeeId |
| SWAP-02 | Open shift board displays all unassigned shifts | New DAL query filtering shifts.status = "open"; display in /swaps page top section |
| SWAP-03 | Employee can request to pick up an open shift | New shift_pickups table + createPickupRequest server action with role-matching validation |
| SWAP-04 | Employee can request a shift swap with another employee | New swap_requests table + createSwapRequest server action |
| SWAP-05 | Manager/Supervisor can approve or reject swap requests with one click | approveSwap/rejectSwap server actions with role check (manager or supervisor) |
| SWAP-06 | System auto-rejects swap if it would create overtime or coverage gap | Reuse calculateWeekCosts + calculateShiftHours for overtime check; coverage gap = check remaining shifts for slot |
| SWAP-07 | Swap request shows details (who, what shifts, impact on hours) | Join swap_requests with shifts and users in DAL query; calculate projected hours client-side |
| COMP-01 | Dashboard shows predictive scheduling compliance status | Hardcoded rule set displayed on /compliance page with status cards |
| COMP-02 | Warning when schedule posted less than required notice period | Compare schedule posting date vs shift dates; configurable notice period (7/14 days) |
| COMP-03 | Premium pay calculator for last-minute schedule changes | Query audit_log for recent changes within 24h/72h of shift start; calculate premium based on hourly rate |
| COMP-04 | Audit log records all schedule changes with timestamps | New audit_log table + logAuditEvent utility called from all shift/swap server actions |
| DEMO-05 | One open shift needing coverage (Thursday PM cashier) | Already seeded in current seed.ts (line 542-552); verify it persists |
| DEMO-06 | One pending swap request (Ana <-> Carlos, Friday) | Extend seed.ts to insert swap_requests row after new table is created |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.45.x | ORM for new tables (swap_requests, shift_pickups, audit_log) | Already used for all data access |
| zod | 4.3.x | Input validation for swap/pickup server actions | Already used in all server actions |
| date-fns | 4.1.x | Date math for compliance calculations (notice periods, premium pay) | Already used throughout |
| lucide-react | 0.577.x | Icons for status indicators, action buttons | Already used for all icons |
| shadcn/ui components | 4.1.x | Card, Badge, Tabs, Button, Dialog, Select for UI | Already used throughout |
| recharts | 2.15.x | Charts for compliance trends (if needed) | Already installed from Phase 2 |

### No New Libraries Needed
This phase requires zero new npm installs. All functionality is achievable with the existing stack.

## Architecture Patterns

### Recommended File Structure
```
src/
├── lib/
│   ├── db/
│   │   ├── schema.ts              # ADD: swapRequests, shiftPickups, auditLog tables + enums
│   │   └── seed.ts                # EXTEND: add pending swap request for Ana <-> Carlos
│   ├── dal/
│   │   ├── swaps.ts               # NEW: getSwapRequests, getOpenShifts, getPickupRequests
│   │   ├── compliance.ts          # NEW: getComplianceStatus, getAuditLog, getPremiumPayChanges
│   │   └── shifts.ts              # EXISTING (no changes needed)
│   ├── actions/
│   │   ├── swaps.ts               # NEW: createSwapRequest, approveSwap, rejectSwap, cancelSwap
│   │   ├── pickups.ts             # NEW: createPickupRequest, approvePickup, rejectPickup
│   │   ├── audit.ts               # NEW: logAuditEvent helper (called from other actions)
│   │   └── shifts.ts              # MODIFY: add audit logging to existing shift mutations
│   └── utils/
│       ├── cost-calculator.ts     # EXISTING (reuse for overtime validation)
│       ├── schedule-helpers.ts    # EXISTING (reuse for availability checks)
│       └── compliance-rules.ts    # NEW: hardcoded predictive scheduling rules, premium pay calc
├── app/(dashboard)/
│   ├── swaps/
│   │   └── page.tsx               # REPLACE placeholder with full swap/pickup UI
│   └── compliance/
│       └── page.tsx               # REPLACE placeholder with compliance dashboard + audit log
└── components/
    ├── swaps/
    │   ├── swap-request-card.tsx   # Swap request display with approve/reject buttons
    │   ├── open-shift-card.tsx     # Open shift with "Pick Up" button
    │   ├── swap-request-form.tsx   # Form for creating swap request
    │   └── swaps-list.tsx         # Client component managing swap/pickup state
    └── compliance/
        ├── compliance-status.tsx   # Status cards for scheduling compliance
        ├── premium-pay-card.tsx    # Premium pay calculation display
        └── audit-log.tsx          # Filterable audit log table
```

### Pattern 1: Server Action with Audit Logging
**What:** Every mutation that changes shift/swap data also logs to audit_log
**When to use:** All shift CRUD, swap approve/reject, pickup approve/reject
**Example:**
```typescript
// src/lib/actions/audit.ts
import { db } from "@/lib/db"
import { auditLog } from "@/lib/db/schema"

export async function logAuditEvent(params: {
  action: string
  userId: number
  entityType: string
  entityId: number | null
  details: Record<string, unknown>
}) {
  await db.insert(auditLog).values({
    action: params.action,
    userId: params.userId,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details,
  })
}
```

### Pattern 2: Swap Auto-Rejection Validation
**What:** Before approving a swap, validate neither employee exceeds 40h/week and no coverage gap exists
**When to use:** approveSwap and approvePickup server actions
**Example:**
```typescript
// Inside approveSwap server action
async function validateSwap(swapRequest: SwapRequest): Promise<{ valid: boolean; reason?: string }> {
  // 1. Get all shifts for the week for both employees
  const weekShifts = await getShiftsForWeek(/* week of swap */)

  // 2. Simulate the swap: remove each employee's swapped shift, add the other's
  const requestorShifts = weekShifts.filter(s => s.employeeId === swapRequest.requestorId)
  const targetShifts = weekShifts.filter(s => s.employeeId === swapRequest.targetEmployeeId)

  // 3. Calculate projected hours using existing calculateShiftHours
  // 4. Check if either exceeds 40h
  // 5. Check coverage gap: ensure the role/time slot still has someone

  return { valid: true }
}
```

### Pattern 3: Role-Gated Actions (Employee + Manager/Supervisor)
**What:** Swap creation is employee-accessible; approval is manager/supervisor-only
**When to use:** Different auth requirements for different operations
**Example:**
```typescript
// Employee can create swap requests
export async function createSwapRequest(data: SwapInput) {
  const session = await auth()
  if (!session?.user) return { success: false, message: "Unauthorized" }
  // Any authenticated user can request a swap
  // ...
}

// Only manager/supervisor can approve
export async function approveSwap(swapId: number) {
  const session = await auth()
  if (!session?.user || !["manager", "supervisor"].includes(session.user.role)) {
    return { success: false, message: "Unauthorized" }
  }
  // ...
}
```

### Anti-Patterns to Avoid
- **Calculating overtime on the client only:** The auto-rejection MUST happen server-side in the approve action, not just as a UI warning. Client-side checks are for UX hints only.
- **Separate audit log calls at the component level:** Audit logging must be inside server actions, not called separately from the client. This ensures atomicity and prevents missed logging.
- **Fetching all shifts for all weeks in compliance queries:** Scope queries to the relevant week(s) only. Use date range filters in SQL.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date/time arithmetic | Manual date string parsing | date-fns (differenceInHours, isWithinInterval, addDays) | Timezone edge cases, DST, week boundaries |
| JSON column in Drizzle | String serialization/deserialization | Drizzle jsonb column type | Type safety, proper SQL casting |
| Status enum management | String literals everywhere | Drizzle pgEnum (swapStatusEnum) | DB-level constraint, TypeScript inference |
| Overtime calculation | Rewrite hours calculation | Existing calculateShiftHours + calculateWeekCosts | Already tested, handles break minutes |

## Common Pitfalls

### Pitfall 1: Stale Data During Swap Approval
**What goes wrong:** Two managers approve conflicting swaps simultaneously, creating overtime or double-booking
**Why it happens:** No optimistic locking on swap status
**How to avoid:** In the approve action, re-check swap status is still "pending" before updating. Use a WHERE clause: `WHERE id = ? AND status = 'pending'`. If no rows updated, return "already processed."
**Warning signs:** Swap approval returns success but state is inconsistent

### Pitfall 2: Audit Log Flooding
**What goes wrong:** Audit log grows extremely fast if every tiny action is logged
**Why it happens:** Logging drag-and-drop intermediate positions instead of final placement
**How to avoid:** Only log the final mutation (after server action completes successfully). Don't log failed attempts.
**Warning signs:** Thousands of audit entries for a single scheduling session

### Pitfall 3: Circular Revalidation on /swaps Page
**What goes wrong:** Approving a swap revalidates /swaps, but the page refetches and the UI flickers
**Why it happens:** revalidatePath triggers full server component re-render
**How to avoid:** Use optimistic updates on the client (same pattern as schedule-builder.tsx). Update local state immediately, call server action, rollback on failure.
**Warning signs:** Full page flash on every approve/reject click

### Pitfall 4: Open Shift Already in Seed Data
**What goes wrong:** Developer creates duplicate open shift because they don't realize seed.ts already has Thursday PM cashier open shift
**Why it happens:** Not reading existing seed.ts carefully
**How to avoid:** The open shift (DEMO-05) is already seeded at line 542-552. Only need to ADD the swap_requests seed data for DEMO-06.
**Warning signs:** Two open Thursday PM cashier shifts in demo

### Pitfall 5: Forgot to Check Role Matching for Pickups
**What goes wrong:** Employee picks up a shift for a role they can't perform
**Why it happens:** Only checking authentication, not checking employeeRoles table
**How to avoid:** In createPickupRequest, join with employeeRoles to verify the employee has the required roleName. Return specific error: "You don't have the [role] qualification."
**Warning signs:** Stock-only employee working a cashier shift

### Pitfall 6: Premium Pay Calculation Timezone Issues
**What goes wrong:** Premium pay threshold comparison (24h/72h before shift) gives wrong results
**Why it happens:** Comparing timestamps across different reference frames
**How to avoid:** Since shifts use varchar dates and times ("2026-03-22", "15:00"), construct the shift start datetime as a string comparison. The audit_log.createdAt is a timestamp. Convert shift date+startTime to a Date object, then use differenceInHours from date-fns.
**Warning signs:** Premium pay triggered for changes made well in advance

## Code Examples

### Schema Extensions
```typescript
// Add to src/lib/db/schema.ts

export const swapStatusEnum = pgEnum("swap_status", ["pending", "approved", "rejected"])

export const swapRequests = pgTable("swap_requests", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  requestorId: integer("requestor_id")
    .notNull()
    .references(() => users.id),
  requestorShiftId: integer("requestor_shift_id")
    .notNull()
    .references(() => shifts.id),
  targetEmployeeId: integer("target_employee_id")
    .notNull()
    .references(() => users.id),
  targetShiftId: integer("target_shift_id")
    .notNull()
    .references(() => shifts.id),
  status: swapStatusEnum().notNull().default("pending"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reason: varchar({ length: 500 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const shiftPickups = pgTable("shift_pickups", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  shiftId: integer("shift_id")
    .notNull()
    .references(() => shifts.id),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => users.id),
  status: swapStatusEnum().notNull().default("pending"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const auditLog = pgTable("audit_log", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  action: varchar({ length: 100 }).notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  details: jsonb().notNull().default({}),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: integer("entity_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
```

**Note:** Must import `jsonb` from `drizzle-orm/pg-core` (add to the existing import line).

### DAL Query for Swap Requests with Joins
```typescript
// src/lib/dal/swaps.ts
import { db } from "@/lib/db"
import { swapRequests, shifts, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function getSwapRequests() {
  const session = await auth()
  if (!session?.user) throw new Error("Not authenticated")

  const rows = await db
    .select({
      id: swapRequests.id,
      status: swapRequests.status,
      reason: swapRequests.reason,
      createdAt: swapRequests.createdAt,
      reviewedAt: swapRequests.reviewedAt,
      requestorId: swapRequests.requestorId,
      targetEmployeeId: swapRequests.targetEmployeeId,
      requestorShiftId: swapRequests.requestorShiftId,
      targetShiftId: swapRequests.targetShiftId,
    })
    .from(swapRequests)
    // Additional joins needed for shift and user details

  return rows
}
```

### Compliance Rules (Hardcoded)
```typescript
// src/lib/utils/compliance-rules.ts
export interface ComplianceRule {
  id: string
  name: string
  description: string
  noticePeriodDays: number
  premiumPayRules: PremiumPayRule[]
}

export interface PremiumPayRule {
  withinHours: number
  premiumHours: number
  description: string
}

export const DEFAULT_COMPLIANCE_RULES: ComplianceRule = {
  id: "predictive-scheduling-default",
  name: "Predictive Scheduling (Sample)",
  description: "Based on Oregon/NYC-style predictive scheduling laws",
  noticePeriodDays: 7,
  premiumPayRules: [
    {
      withinHours: 24,
      premiumHours: 2,
      description: "Changes within 24 hours of shift: 2-hour premium pay",
    },
    {
      withinHours: 72,
      premiumHours: 4,
      description: "Changes within 72 hours of shift: 4-hour premium pay",
    },
  ],
}

export function calculatePremiumPay(
  hoursBeforeShift: number,
  employeeHourlyRate: number,
  rules: ComplianceRule = DEFAULT_COMPLIANCE_RULES
): { premiumHours: number; premiumCost: number; rule: string } | null {
  // Find the most specific matching rule (shortest window)
  const matchingRule = rules.premiumPayRules
    .filter((r) => hoursBeforeShift <= r.withinHours)
    .sort((a, b) => a.withinHours - b.withinHours)[0]

  if (!matchingRule) return null

  return {
    premiumHours: matchingRule.premiumHours,
    premiumCost: matchingRule.premiumHours * employeeHourlyRate,
    rule: matchingRule.description,
  }
}
```

### Seed Extension for DEMO-06
```typescript
// Add to seed.ts after shift insertion, using new swap_requests table
// Ana's Friday shift ID and Carlos's Friday shift ID must be looked up
const anaFridayShift = /* query for Ana's Friday shift */
const carlosFridayShift = /* query for Carlos's Friday shift */

// Note: Ana has no Friday shift in current seed (Mon-Thu only)
// Need to either: add a Friday shift for Ana, or adjust swap to match existing data
// BRIEF says "Ana <-> Carlos, Friday" -- may need to add Ana's Friday shift
await db.insert(swapRequests).values({
  requestorId: anaId,
  requestorShiftId: anaFridayShift.id,
  targetEmployeeId: carlosId,
  targetShiftId: carlosFridayShift.id,
  status: "pending",
})
```

**Important seed data note:** Ana Morales is currently seeded with Mon-Thu shifts only (available Mon-Fri). To create the Ana <-> Carlos Friday swap per BRIEF requirements, seed.ts needs a Friday shift for Ana added first. Carlos already has a Friday 15:00-21:00 stock shift. Add Ana working Friday 09:00-15:00 cashier, then create the swap request between those two Friday shifts.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Drizzle jsonb required manual type casting | Drizzle 0.45+ has native jsonb() column builder | Late 2025 | Import jsonb from drizzle-orm/pg-core directly |
| Separate API routes for mutations | Server actions with "use server" | Next.js 14+ (stable) | All mutations as server actions, no API routes |
| Client-side form validation only | Zod safeParse in server actions | Current best practice | Validate both client and server side |

## Open Questions

1. **Ana's Friday Shift for Demo Swap**
   - What we know: Ana is available Mon-Fri but only has Mon-Thu shifts seeded. Carlos has Friday PM stock shift.
   - What's unclear: Should Ana get a new Friday shift added to seed, or should the swap demo use different days?
   - Recommendation: Add a Friday 09:00-15:00 cashier shift for Ana in the seed. This makes the swap demo realistic (she wants to trade her Friday AM for Carlos's Friday PM, or vice versa). This keeps Ana under her 30h max (24h current + 6h Friday = 30h).

2. **Audit Log Retroactive Entries**
   - What we know: Phase 3 adds audit logging. Phases 1-2 mutations don't log.
   - What's unclear: Should existing shift actions (create/update/delete/move/copy) be retrofitted with audit logging?
   - Recommendation: Yes, modify existing shift actions in shifts.ts to call logAuditEvent. This is required by COMP-04 which says "all schedule changes." The modification is minimal -- add one function call at the end of each action.

3. **Supervisor Access to Compliance Page**
   - What we know: Current placeholder restricts compliance to manager only. BRIEF says Supervisor can "approve swap requests" but doesn't mention compliance access.
   - What's unclear: Should supervisors see the compliance dashboard?
   - Recommendation: Keep compliance as manager-only per current implementation. Supervisors only need access to /swaps for approvals.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.x |
| Config file | vitest.config.ts (exists) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SWAP-06 | Auto-reject swap creating overtime | unit | `npx vitest run src/lib/utils/swap-validation.test.ts -x` | No -- Wave 0 |
| COMP-03 | Premium pay calculation | unit | `npx vitest run src/lib/utils/compliance-rules.test.ts -x` | No -- Wave 0 |
| COMP-02 | Notice period warning | unit | `npx vitest run src/lib/utils/compliance-rules.test.ts -x` | No -- Wave 0 |
| SWAP-01 | Mark shift as open | manual-only | N/A -- requires DB + auth session | N/A |
| SWAP-02 | Open shift board display | manual-only | N/A -- UI rendering | N/A |
| SWAP-03 | Employee pickup request | manual-only | N/A -- requires DB + auth session | N/A |
| SWAP-04 | Employee swap request | manual-only | N/A -- requires DB + auth session | N/A |
| SWAP-05 | Manager approve/reject | manual-only | N/A -- requires DB + auth session | N/A |
| SWAP-07 | Swap request details display | manual-only | N/A -- UI rendering | N/A |
| COMP-01 | Compliance status dashboard | manual-only | N/A -- UI rendering | N/A |
| COMP-04 | Audit log records changes | manual-only | N/A -- requires DB + auth session | N/A |
| DEMO-05 | Open Thursday PM shift seeded | manual-only | N/A -- seed verification | N/A |
| DEMO-06 | Pending Ana/Carlos swap seeded | manual-only | N/A -- seed verification | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/utils/swap-validation.ts` + `swap-validation.test.ts` -- pure function for overtime/coverage validation
- [ ] `src/lib/utils/compliance-rules.ts` + `compliance-rules.test.ts` -- premium pay + notice period calculations

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/lib/db/schema.ts`, `src/lib/actions/shifts.ts`, `src/lib/dal/shifts.ts` -- established patterns
- Project codebase: `src/lib/utils/cost-calculator.ts` -- overtime calculation pattern to reuse
- Project codebase: `src/lib/db/seed.ts` -- existing seed data including open shift

### Secondary (MEDIUM confidence)
- Drizzle ORM jsonb column support -- verified available in drizzle-orm/pg-core
- BRIEF.md compliance rules -- hardcoded sample rules per project scope

### Tertiary (LOW confidence)
- None -- all findings verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing
- Architecture: HIGH -- follows established Phase 1-2 patterns exactly
- Pitfalls: HIGH -- based on actual codebase analysis (seed data, auth patterns, state management)

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- no external dependencies changing)
