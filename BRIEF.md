# ShiftWise Pro — Retail Staff Scheduling with Real-Time Labor Cost Visibility

## What Is This?
A scheduling platform for retail and hospitality managers that shows labor costs in real-time as you build the schedule. Drag shifts onto a calendar and instantly see budget impact, overtime alerts, and compliance warnings.

## Who Is It For?
Retail store managers, restaurant managers, franchise operators managing 10-100 hourly employees. People who currently spend 5-10 hours/week building schedules in spreadsheets and get surprised by overtime costs at payroll.

## Why It Matters
- 32% of managers struggle with scheduling complexity (Software Advice, 2026)
- Predictive scheduling laws (California, NYC, Seattle, Oregon) require 7-14 day advance notice + premium pay for changes
- Overstaffing on slow days, understaffing on peak hours — discovered too late
- Existing tools (Deputy $4.50/user, UKG $300/location) either too basic or too expensive

## Core Features

### 1. Visual Schedule Builder (THE HERO FEATURE)
- Weekly calendar grid: rows = employees, columns = days, cells = shifts
- Drag-and-drop shift assignment
- Color-coded by role (cashier = blue, stock = green, manager = orange)
- Click to create/edit shift (start time, end time, role, break)
- Copy previous week's schedule as starting point

### 2. Real-Time Labor Cost Meter
- Sidebar widget that updates LIVE as you drag shifts
- Shows: total hours, total cost ($), % of revenue budget
- Overtime indicator: turns amber at 35hrs/employee, red at 40hrs
- Daily breakdown: "Monday $480 | Tuesday $520 | ..."
- Weekly total vs budget bar chart
- Per-employee hours tracker (to prevent accidental overtime)

### 3. Employee Management
- Employee profiles: name, roles (can work multiple), hourly rate, max hours/week
- Availability grid: each employee sets their available days/times
- Schedule conflicts highlighted (employee unavailable = red cell)
- Contact info for quick reach-out

### 4. Shift Coverage & Swap Requests
- Open shift board: unassigned shifts that need coverage
- Employees can request to pick up open shifts (pending manager approval)
- Shift swap requests: "Ana wants to trade Friday PM for Saturday AM with Carlos"
- Manager approves/rejects with one click
- Auto-reject if swap creates overtime or coverage gap

### 5. Compliance Dashboard
- Predictive scheduling law tracker (configurable per location)
- Warning when schedule posted less than required notice period (7/14 days)
- Premium pay calculator for last-minute changes
- Audit log of all schedule changes with timestamps

### 6. Team Dashboard
- Today's view: who's working now, who's coming in next, who called out
- Week overview: total hours per employee, overtime risk flags
- Historical labor cost trends (last 4 weeks chart)

## Auth & Roles
- **Manager/Admin**: Full access — create schedules, manage employees, view costs, approve swaps
- **Supervisor**: View schedules, approve swap requests, cannot edit labor rates
- **Employee**: View own schedule, request swaps, set availability, pick up open shifts

## Demo Data
Create a realistic retail store scenario:

**Store: Urban Threads (clothing retail)**
- 1 location, open 7 days/week (9 AM - 9 PM)
- Revenue budget: $12,000/week labor

**Employees (12):**
| Name | Role(s) | Rate | Max Hrs | Availability |
|------|---------|------|---------|-------------|
| Sarah Chen | Manager | $28/hr | 40 | Mon-Fri |
| Mike Torres | Manager, Cashier | $26/hr | 40 | Any day |
| Emma Wilson | Cashier | $17/hr | 32 | Mon-Sat |
| Jake Kim | Cashier, Stock | $16/hr | 25 | Tue-Sun |
| Ana Morales | Cashier | $16/hr | 30 | Mon-Fri |
| Carlos Ruiz | Stock | $15/hr | 40 | Any day |
| Priya Patel | Stock, Cashier | $16/hr | 35 | Wed-Sun |
| Tom Liu | Cashier | $15/hr | 20 | Sat-Sun, Wed |
| Maya Johnson | Visual Merch | $18/hr | 30 | Mon-Fri |
| David Park | Stock | $15/hr | 40 | Any day |
| Lisa Chen | Cashier | $16/hr | 25 | Thu-Sun |
| Ryan O'Brien | Stock, Visual Merch | $17/hr | 35 | Mon-Sat |

**Pre-built schedule:** Current week should be fully scheduled with realistic patterns:
- Morning shift: 9 AM - 3 PM
- Afternoon shift: 3 PM - 9 PM
- Full day: 9 AM - 5 PM (managers)
- Weekend staffing heavier than weekdays
- One employee (Jake) near overtime threshold (38 hrs scheduled)
- One open shift needing coverage (Thursday PM cashier)
- One pending swap request (Ana ↔ Carlos, Friday)

**Demo accounts:**
- manager@shiftwise.app / demo1234 (Sarah Chen - Manager)
- supervisor@shiftwise.app / demo1234 (Mike Torres - Supervisor view)
- employee@shiftwise.app / demo1234 (Emma Wilson - Employee view)

## Tech Stack
- Next.js (App Router)
- Neon PostgreSQL via Drizzle ORM
- NextAuth v5 (Credentials provider)
- shadcn/ui + Tailwind CSS
- Deploy to Vercel

## Design Direction
- Clean, professional — think "modern workforce management"
- Primary color: Indigo/purple (#6366F1 range) — distinct from CleanSlate's blue
- White backgrounds, subtle gray borders
- The schedule grid is the centerpiece — make it beautiful
- Labor cost meter should feel like a real-time financial instrument
- Overtime warnings should be visually urgent but not alarming
- Mobile responsive (employees check schedules on phones)

## What's OUT of Scope
- POS integration (mock the revenue forecast data)
- SMS/push notifications (show notification UI but don't send real messages)
- Geofenced clock-in/out (not building a time clock)
- Payroll export (just show the data)
- Multi-location support (single store for demo)
- Actual predictive scheduling law database (hardcode a sample rule set)

## Success Criteria
- Manager can drag-and-drop to build a week's schedule
- Labor cost updates in real-time as shifts are added/moved
- Overtime alerts fire correctly
- Employee can view schedule and request a swap
- Compliance warnings show for late schedule changes
- Demo data tells a compelling story
- Looks polished enough for a LinkedIn showcase
