# Roadmap: ShiftWise Pro

## Overview

ShiftWise Pro delivers a retail staff scheduling platform in four phases. Phase 1 lays the foundation: auth, database schema, employee management, and seed data. Phase 2 builds the hero feature: the weekly schedule grid with drag-and-drop and the real-time labor cost meter. Phase 3 adds operational depth with shift swaps, open shift coverage, and compliance tools. Phase 4 completes the picture with team dashboards, historical analytics, and deployment polish.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation and Employee Management** - Auth, database schema, employee CRUD, availability, and demo seed data
- [x] **Phase 2: Schedule Builder and Cost Meter** - Weekly grid with drag-and-drop, shift CRUD, real-time labor cost sidebar with overtime alerts
- [ ] **Phase 3: Shift Swaps and Compliance** - Open shift board, swap requests, approval workflow, compliance dashboard, audit log
- [ ] **Phase 4: Dashboards and Polish** - Team dashboard, historical trends, mobile responsive, deployment

## Phase Details

### Phase 1: Foundation and Employee Management
**Goal**: Users can log in with role-based access and managers can manage employee profiles and availability
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, EMPL-01, EMPL-02, EMPL-03, EMPL-04, EMPL-05, EMPL-06, DEMO-01, DEMO-02, DEMO-07
**Success Criteria** (what must be TRUE):
  1. User can log in with demo credentials (manager, supervisor, employee) and sees role-appropriate navigation
  2. Manager can view a list of all employees showing their roles, hourly rates, and availability
  3. Manager can create and edit employee profiles with name, roles, rate, max hours, and contact info
  4. Employee can set their own availability (available days and time windows)
  5. User can log out from any page and session persists across browser refresh
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold, database schema, auth (NextAuth v5 + JWT), login page, seed data (12 employees + 3 demo accounts)
- [x] 01-02-PLAN.md — App shell (sidebar, header, mobile nav) and employee list page with sortable table and role badges
- [x] 01-03-PLAN.md — Employee CRUD (slide-over panel), availability toggle grid, placeholder pages

### Phase 2: Schedule Builder and Cost Meter
**Goal**: Managers can visually build a weekly schedule with drag-and-drop and see labor costs update in real-time
**Depends on**: Phase 1
**Requirements**: SCHED-01, SCHED-02, SCHED-03, SCHED-04, SCHED-05, SCHED-06, SCHED-07, SCHED-08, SCHED-09, COST-01, COST-02, COST-03, COST-04, COST-05, COST-06, COST-07, COST-08, DEMO-03, DEMO-04
**Success Criteria** (what must be TRUE):
  1. Manager can view a weekly calendar grid with employees as rows and days as columns, with shifts color-coded by role
  2. Manager can create, edit, and delete shifts via click, and drag-and-drop shifts to reassign employees or days
  3. Sidebar cost meter displays total hours, total cost, budget percentage, and daily breakdown -- all updating instantly as shifts change
  4. Overtime indicators turn amber at 35 hours and red at 40 hours per employee, with per-employee hours visible
  5. Manager can navigate between weeks and copy a previous week's schedule as a starting point
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Shifts schema, cost calculator + schedule helpers with tests, DAL, server actions, seed data with full schedule
- [x] 02-02-PLAN.md — Schedule grid UI (employee rows x day columns), shift cards, shift create/edit/delete dialog, cost meter sidebar with budget chart
- [x] 02-03-PLAN.md — Drag-and-drop with @dnd-kit/react, week navigation (prev/next), copy previous week

### Phase 3: Shift Swaps and Compliance
**Goal**: Employees can request shift swaps and pick up open shifts, while managers get compliance warnings and an audit trail
**Depends on**: Phase 2
**Requirements**: SWAP-01, SWAP-02, SWAP-03, SWAP-04, SWAP-05, SWAP-06, SWAP-07, COMP-01, COMP-02, COMP-03, COMP-04, DEMO-05, DEMO-06
**Success Criteria** (what must be TRUE):
  1. Manager can mark shifts as open and employees can view the open shift board and request to pick up shifts
  2. Employee can request a shift swap with another employee, and the request shows full details (who, what shifts, hours impact)
  3. Manager or supervisor can approve/reject swap requests with one click, and swaps that would create overtime or coverage gaps are auto-rejected
  4. Compliance dashboard shows schedule posting warnings (late notice) and premium pay calculations for last-minute changes
  5. Audit log records all schedule changes with timestamps and who made them
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Schema extensions (swap_requests, shift_pickups, audit_log), compliance rules + swap validation with tests, audit helper, seed data extension
- [ ] 03-02-PLAN.md — Swap/pickup DAL + server actions with auto-rejection, /swaps page UI with open shift board and swap request cards
- [ ] 03-03-PLAN.md — Compliance DAL, /compliance page with status cards, premium pay calculator, and filterable audit log

### Phase 4: Dashboards and Polish
**Goal**: Managers have operational visibility through dashboards and the app is polished, mobile-responsive, and deployed
**Depends on**: Phase 3
**Requirements**: DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):
  1. Today's view shows who is working now, who is coming in next, and who called out
  2. Week overview shows total hours per employee with overtime risk flags
  3. Historical labor cost trends chart displays the last 4 weeks of data
  4. App is mobile-responsive -- employees can view their schedule and request swaps on a phone
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Employee Management | 3/3 | Complete | 2026-03-21 |
| 2. Schedule Builder and Cost Meter | 3/3 | Complete | 2026-03-21 |
| 3. Shift Swaps and Compliance | 2/3 | In Progress|  |
| 4. Dashboards and Polish | 0/2 | Not started | - |
