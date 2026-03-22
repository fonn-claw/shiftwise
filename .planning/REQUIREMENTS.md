# Requirements: ShiftWise Pro

**Defined:** 2026-03-21
**Core Value:** Managers can visually build a week's schedule via drag-and-drop and see labor costs update in real-time, with overtime alerts and compliance warnings preventing costly mistakes.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Authorization

- [x] **AUTH-01**: User can log in with email and password (credentials provider)
- [x] **AUTH-02**: User session persists across browser refresh (JWT strategy)
- [x] **AUTH-03**: User can log out from any page
- [x] **AUTH-04**: Role-based access control enforced (Manager, Supervisor, Employee)
- [x] **AUTH-05**: Manager can access all features; Supervisor can view schedules and approve swaps; Employee can view own schedule and request swaps

### Employee Management

- [x] **EMPL-01**: Manager can view list of all employees with roles, rates, and availability
- [x] **EMPL-02**: Manager can create new employee profiles (name, email, roles, hourly rate, max hours/week, contact info)
- [x] **EMPL-03**: Manager can edit employee profiles
- [x] **EMPL-04**: Employee can set their availability (available days/times)
- [x] **EMPL-05**: Manager can view employee availability when scheduling
- [x] **EMPL-06**: Employees can have multiple roles (e.g., Cashier + Stock)

### Schedule Builder

- [x] **SCHED-01**: Manager can view weekly calendar grid (rows = employees, columns = days)
- [x] **SCHED-02**: Manager can click to create a shift (start time, end time, role, break duration)
- [x] **SCHED-03**: Manager can edit an existing shift
- [x] **SCHED-04**: Manager can delete a shift
- [x] **SCHED-05**: Manager can drag-and-drop shifts to reassign to different employees or days
- [x] **SCHED-06**: Shifts are color-coded by role (cashier = blue, stock = green, manager = orange, visual merch = purple)
- [x] **SCHED-07**: Schedule conflicts highlighted when employee is unavailable (red cell)
- [x] **SCHED-08**: Manager can navigate between weeks
- [x] **SCHED-09**: Manager can copy previous week's schedule as starting point

### Labor Cost Meter

- [x] **COST-01**: Sidebar widget displays total scheduled hours for the week
- [x] **COST-02**: Sidebar displays total labor cost ($) for the week
- [x] **COST-03**: Sidebar displays labor cost as percentage of revenue budget
- [x] **COST-04**: Cost meter updates in real-time as shifts are added, moved, or removed
- [x] **COST-05**: Overtime indicator turns amber at 35hrs/employee, red at 40hrs
- [x] **COST-06**: Daily cost breakdown displayed (Monday $X, Tuesday $Y, etc.)
- [x] **COST-07**: Weekly total vs budget bar chart
- [x] **COST-08**: Per-employee hours tracker visible during scheduling

### Shift Coverage & Swaps

- [ ] **SWAP-01**: Manager can mark shifts as "open" (needing coverage)
- [ ] **SWAP-02**: Open shift board displays all unassigned shifts
- [ ] **SWAP-03**: Employee can request to pick up an open shift
- [ ] **SWAP-04**: Employee can request a shift swap with another employee
- [ ] **SWAP-05**: Manager/Supervisor can approve or reject swap requests with one click
- [x] **SWAP-06**: System auto-rejects swap if it would create overtime or coverage gap
- [ ] **SWAP-07**: Swap request shows details (who, what shifts, impact on hours)

### Compliance

- [x] **COMP-01**: Dashboard shows predictive scheduling compliance status
- [x] **COMP-02**: Warning displayed when schedule is posted less than required notice period (7/14 days configurable)
- [x] **COMP-03**: Premium pay calculator shows cost of last-minute schedule changes
- [x] **COMP-04**: Audit log records all schedule changes with timestamps and who made them

### Team Dashboard

- [ ] **DASH-01**: Today's view shows who's working now, who's coming in next, who called out
- [ ] **DASH-02**: Week overview shows total hours per employee with overtime risk flags
- [ ] **DASH-03**: Historical labor cost trends chart (last 4 weeks)

### Demo Data

- [x] **DEMO-01**: Seed data creates Urban Threads store (9 AM - 9 PM, 7 days, $12K/week budget)
- [x] **DEMO-02**: 12 employees seeded with roles, rates, max hours, and availability per BRIEF spec
- [x] **DEMO-03**: Current week fully scheduled with realistic shift patterns
- [x] **DEMO-04**: One employee (Jake) near overtime threshold (38 hrs)
- [x] **DEMO-05**: One open shift needing coverage (Thursday PM cashier)
- [x] **DEMO-06**: One pending swap request (Ana <-> Carlos, Friday)
- [x] **DEMO-07**: Three demo accounts seeded (manager, supervisor, employee)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Notifications

- **NOTF-01**: In-app notification for swap request updates
- **NOTF-02**: In-app notification for schedule changes
- **NOTF-03**: Notification preferences per user

### Advanced Scheduling

- **ADVS-01**: Auto-schedule suggestions based on availability and roles
- **ADVS-02**: Template schedules (save and apply patterns)
- **ADVS-03**: Multi-location support

## Out of Scope

| Feature | Reason |
|---------|--------|
| POS integration | Mock revenue forecast data instead |
| SMS/push notifications | Show notification UI but don't send real messages |
| Geofenced clock-in/out | Not building a time clock |
| Payroll export | Just show the data |
| Multi-location support | Single store for demo |
| Real predictive scheduling law database | Hardcode a sample rule set |
| AI/auto-scheduling | Massive engineering effort, manual scheduling with copy-week is more impressive for demo |
| Real-time collaboration (WebSockets) | Single-manager demo, not needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| EMPL-01 | Phase 1 | Complete |
| EMPL-02 | Phase 1 | Complete |
| EMPL-03 | Phase 1 | Complete |
| EMPL-04 | Phase 1 | Complete |
| EMPL-05 | Phase 1 | Complete |
| EMPL-06 | Phase 1 | Complete |
| SCHED-01 | Phase 2 | Complete |
| SCHED-02 | Phase 2 | Complete |
| SCHED-03 | Phase 2 | Complete |
| SCHED-04 | Phase 2 | Complete |
| SCHED-05 | Phase 2 | Complete |
| SCHED-06 | Phase 2 | Complete |
| SCHED-07 | Phase 2 | Complete |
| SCHED-08 | Phase 2 | Complete |
| SCHED-09 | Phase 2 | Complete |
| COST-01 | Phase 2 | Complete |
| COST-02 | Phase 2 | Complete |
| COST-03 | Phase 2 | Complete |
| COST-04 | Phase 2 | Complete |
| COST-05 | Phase 2 | Complete |
| COST-06 | Phase 2 | Complete |
| COST-07 | Phase 2 | Complete |
| COST-08 | Phase 2 | Complete |
| SWAP-01 | Phase 3 | Pending |
| SWAP-02 | Phase 3 | Pending |
| SWAP-03 | Phase 3 | Pending |
| SWAP-04 | Phase 3 | Pending |
| SWAP-05 | Phase 3 | Pending |
| SWAP-06 | Phase 3 | Complete |
| SWAP-07 | Phase 3 | Pending |
| COMP-01 | Phase 3 | Complete |
| COMP-02 | Phase 3 | Complete |
| COMP-03 | Phase 3 | Complete |
| COMP-04 | Phase 3 | Complete |
| DASH-01 | Phase 4 | Pending |
| DASH-02 | Phase 4 | Pending |
| DASH-03 | Phase 4 | Pending |
| DEMO-01 | Phase 1 | Complete |
| DEMO-02 | Phase 1 | Complete |
| DEMO-03 | Phase 2 | Complete |
| DEMO-04 | Phase 2 | Complete |
| DEMO-05 | Phase 3 | Complete |
| DEMO-06 | Phase 3 | Complete |
| DEMO-07 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after roadmap creation*
