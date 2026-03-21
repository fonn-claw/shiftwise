# Feature Landscape

**Domain:** Retail staff scheduling with real-time labor cost visibility
**Researched:** 2026-03-21

## Table Stakes

Features users expect from any scheduling product. Missing = product feels incomplete or amateurish.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Weekly calendar grid view | Every competitor has this (Deputy, When I Work, Homebase). It is THE interface for scheduling. | High | Rows = employees, columns = days. Must be performant with 10-100 employees. |
| Drag-and-drop shift creation/editing | Standard interaction pattern across Deputy, Homebase, Connecteam, Sling. Managers expect to click/drag, not fill forms. | High | Requires careful state management and optimistic UI updates. |
| Shift details (start/end time, role, break) | Basic shift data model. Every tool has this. | Low | Modal or inline editing when clicking a shift cell. |
| Color-coding by role | Universal visual pattern. Homebase, Deputy, 7shifts all do this. Managers scan by color to assess coverage. | Low | Cashier = blue, Stock = green, Manager = orange, Visual Merch = purple per BRIEF. |
| Employee profiles | Name, roles, hourly rate, contact info. Foundational data every platform stores. | Low | Multi-role support (employee can work cashier AND stock) is important. |
| Employee availability management | All competitors let employees set when they can/cannot work. Without this, scheduling is guesswork. | Medium | Grid-based availability per day/time block. Employee self-service. |
| Conflict detection/highlighting | Homebase, Deputy, When I Work all flag when you schedule someone during unavailable times. | Medium | Red cell or warning indicator when shift conflicts with availability or max hours. |
| Mobile-responsive schedule viewing | Table stakes since 2020. Employees check schedules on phones. Every competitor has a mobile app or responsive web. | Medium | Read-only schedule view must work perfectly on mobile. Manager editing can be desktop-focused. |
| Role-based access control | Manager/Supervisor/Employee tiers are standard across Deputy, Homebase, When I Work. | Medium | Three tiers per BRIEF. Controls what each user can see and do. |
| Copy previous week's schedule | Template/copy functionality exists in Homebase, Connecteam, and most competitors. Saves hours of repeat scheduling. | Low | One-click clone of last week with date adjustment. |
| Shift swap requests | Standard self-service feature across When I Work, Homebase, Deputy. Employees expect to swap without calling the manager. | Medium | Employee initiates, manager approves/denies. Must validate no conflicts. |
| Open shift board | Deputy, When I Work, and Homebase all offer this. Unassigned shifts posted for employees to claim. | Medium | List of uncovered shifts employees can volunteer for, pending manager approval. |
| Overtime tracking/alerts | Every scheduling tool tracks weekly hours and warns about overtime. Legal liability if missed. | Medium | Amber at 35hrs, red at 40hrs per BRIEF. Per-employee running total. |
| Schedule publishing/notification | Managers finalize and "publish" a schedule. Employees get notified. Standard workflow. | Low | Published vs draft state. Show notification UI (actual push out of scope per BRIEF). |

## Differentiators

Features that set ShiftWise Pro apart from the pack. Not universally expected, but high value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Real-time labor cost meter (sidebar) | This is THE hero differentiator. Most tools show cost reports after the fact. ShiftWise shows cost updating LIVE as you drag shifts. Deputy has cost estimates but not a persistent real-time sidebar widget. | High | Must recalculate on every shift add/move/delete instantly. Show total hours, total $, % of budget, daily breakdown. Confidence: MEDIUM -- Deputy does have cost visibility, but the "live meter" UX is distinctive. |
| Weekly budget vs actual bar chart | Visual budget tracking as a first-class widget, not buried in reports. Makes overspending viscerally obvious. | Medium | Bar chart comparing planned labor cost vs weekly budget ($12K). Updates in real-time alongside the cost meter. |
| Per-employee hours tracker (overtime prevention) | Proactive overtime prevention rather than reactive alerts. Shows running hour totals per employee as schedule is built. | Medium | Integrated into the schedule view or cost sidebar. More granular than just "alert at 40hrs." |
| Predictive scheduling compliance dashboard | Growing regulatory need (California, NYC, Seattle, Oregon). Many small tools ignore this. Deputy has some compliance but it is positioned as enterprise. ShiftWise makes it accessible. | Medium | Warning for late schedule posting (<7/14 days notice), premium pay calculator for last-minute changes. Hardcoded rule set per BRIEF. |
| Audit log of schedule changes | Required for compliance in predictive scheduling jurisdictions. Most small-biz tools lack this. | Low | Timestamped log of who changed what and when. Critical for legal protection. |
| Auto-reject swaps that create problems | Smart swap validation. Most tools just let managers manually review. Auto-rejecting swaps that cause overtime or coverage gaps saves time and prevents mistakes. | Medium | Validate against: overtime threshold, availability conflicts, minimum coverage requirements. |
| Premium pay calculator | Unique to compliance-focused tools. Calculates the cost penalty of last-minute schedule changes under predictive scheduling laws. | Low | Formula-based calculation. Shows managers the financial consequence of late changes. |
| Today's live view (team dashboard) | "Who's working now, who's coming next, who called out" -- a real-time operational view. Common in enterprise tools (UKG) but rare in SMB scheduling. | Medium | Real-time clock showing current shift status. Useful for on-the-floor management. |
| Historical labor cost trends | 4-week trend chart showing labor cost patterns. Helps managers optimize over time. Most SMB tools lack historical analytics. | Medium | Line chart with 4-week history. Surfaces patterns like "we always overspend on weekends." |

## Anti-Features

Features to explicitly NOT build. These add complexity without value for the demo scope, or are better served by integrations.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| AI/auto-scheduling | Massive complexity (constraint solving, optimization algorithms). Deputy and When I Work have this but it took years to build well. For a demo, manual scheduling with great UX is more impressive than mediocre auto-scheduling. | Focus on making manual drag-and-drop scheduling fast and delightful. Copy-last-week covers 80% of the "save me time" need. |
| Time clock / clock-in/clock-out | Entirely different product domain (hardware, geofencing, GPS). Out of scope per BRIEF. Adds complexity without showcasing the core scheduling + cost value prop. | Show scheduled vs actual as mock data if needed, but do not build clock-in functionality. |
| POS / sales integration | Requires third-party API work, real data pipelines. Out of scope per BRIEF. | Mock revenue forecast data. Show the budget number as a configurable setting. |
| Payroll export | Integration-heavy, format-dependent (ADP, Gusto, QuickBooks all different). Out of scope per BRIEF. | Show labor cost data in the UI. The data is there; export is a future feature. |
| SMS/push notifications | Requires Twilio or similar, cost per message, deliverability concerns. Out of scope per BRIEF. | Show notification UI (bell icon, in-app notification list) but do not send real messages. |
| Multi-location support | Adds database complexity (location scoping on every query), UI complexity (location switcher), and is out of scope per BRIEF. | Single store (Urban Threads). The data model can be location-aware for future extensibility but UI is single-location. |
| Demand forecasting | Requires historical sales data, ML models, or at minimum statistical analysis. Huge scope for marginal demo value. | Show static budget numbers. The cost meter is the forecasting equivalent for this demo. |
| Chat / team messaging | Sling and Homebase have this, but it is a distraction from the core scheduling + cost story. Building a chat system is a project unto itself. | Not needed. Swap requests and schedule publishing cover the communication needs. |
| Complex break rule management | State-by-state break laws, meal period tracking, attestation forms. Enterprise feature that adds legal complexity. | Simple break field on shift (duration in minutes). No automated break compliance. |

## Feature Dependencies

```
Employee Profiles --> Availability Grid (need employees before setting availability)
Employee Profiles --> Schedule Builder (need employees to assign shifts to)
Availability Grid --> Conflict Detection (need availability data to detect conflicts)
Schedule Builder --> Labor Cost Meter (need shifts to calculate costs)
Schedule Builder --> Overtime Tracking (need shifts to calculate hours)
Schedule Builder --> Open Shift Board (open shifts are unassigned cells in the schedule)
Schedule Builder --> Shift Swap Requests (need existing shifts to swap)
Overtime Tracking --> Auto-Reject Swaps (need OT calculation to validate swaps)
Conflict Detection --> Auto-Reject Swaps (need conflict logic to validate swaps)
Schedule Builder --> Compliance Dashboard (need schedule data + publish dates)
Schedule Builder --> Audit Log (need schedule changes to log)
Schedule Builder --> Team Dashboard (need schedule data to show who's working)
Labor Cost Meter --> Budget Chart (need cost data for budget comparison)
Labor Cost Meter --> Historical Trends (need cost data over time)
Auth/Roles --> All Features (role determines what user can access)
```

## MVP Recommendation

**Phase 1 -- Foundation:**
1. Auth with role-based access (Manager, Supervisor, Employee)
2. Employee profiles with multi-role support and hourly rates
3. Availability grid (employee self-service)

**Phase 2 -- The Hero (Schedule Builder + Cost Meter):**
4. Weekly calendar grid with drag-and-drop shift assignment
5. Real-time labor cost meter sidebar (the differentiator)
6. Overtime tracking and alerts
7. Copy previous week functionality

**Phase 3 -- Employee Self-Service:**
8. Employee schedule view (mobile-responsive)
9. Open shift board with claim/approval workflow
10. Shift swap requests with auto-reject logic

**Phase 4 -- Compliance and Dashboards:**
11. Compliance dashboard with late-posting warnings
12. Premium pay calculator
13. Audit log
14. Team dashboard (today's view + week overview)
15. Historical labor cost trends

**Phase 5 -- Demo Data and Polish:**
16. Seed realistic demo data (12 employees, pre-built schedule, pending swap)
17. Visual polish, responsive design, edge case handling

**Defer to post-demo:**
- AI/auto-scheduling: massive scope, not needed for demo impact
- Multi-location: out of scope, but data model should be extensible
- Real notifications: show UI only
- Payroll export: show data, no export functionality

## Sources

- [Connecteam: 6 Best Employee Scheduling Apps 2026](https://connecteam.com/online-employee-scheduling-apps/)
- [FinancesOnline: Deputy vs When I Work vs Homebase](https://financesonline.com/top-3-employee-scheduling-software/)
- [People Managing People: 30 Best Employee Shift Scheduling Software 2026](https://peoplemanagingpeople.com/tools/best-employee-shift-scheduling-software/)
- [TCP Software: 6 Best Employee Scheduling Solutions 2026](https://tcpsoftware.com/articles/what-is-employee-scheduling-software/)
- [Shiftlab: Employee Scheduling Software](https://www.shiftlab.io/scheduling)
- [RoostedHR: 5 Essential Features of Scheduling Tools](https://www.roostedhr.com/blog/5-essential-features-of-employee-scheduling-software)
- [Unrubble: Employee Scheduler Must-Have Features 2025](https://unrubble.com/blog/employee-scheduler)
- [Homebase: Deputy Alternatives](https://www.joinhomebase.com/blog/deputy-alternatives)
- [Agendrix: Best Shift Scheduling Apps 2026](https://www.agendrix.com/blog/best-shift-scheduling-apps)
- [Shiftbase: Predictive Scheduling Guide](https://www.shiftbase.com/glossary/predictive-scheduling)
