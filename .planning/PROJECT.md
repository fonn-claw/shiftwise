# ShiftWise Pro

## What This Is

A scheduling platform for retail and hospitality managers that shows labor costs in real-time as you build the schedule. Drag shifts onto a weekly calendar grid and instantly see budget impact, overtime alerts, and compliance warnings. Built for managers of 10-100 hourly employees who currently spend 5-10 hours/week building schedules in spreadsheets.

## Core Value

Managers can visually build a week's schedule via drag-and-drop and see labor costs update in real-time, with overtime alerts and compliance warnings preventing costly mistakes.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Visual schedule builder with weekly calendar grid (rows = employees, columns = days)
- [ ] Drag-and-drop shift assignment with color-coding by role
- [ ] Click to create/edit shift (start time, end time, role, break)
- [ ] Copy previous week's schedule as starting point
- [ ] Real-time labor cost meter sidebar (total hours, total cost, % of budget)
- [ ] Overtime indicators (amber at 35hrs, red at 40hrs per employee)
- [ ] Daily cost breakdown and weekly total vs budget chart
- [ ] Per-employee hours tracker
- [ ] Employee profiles (name, roles, hourly rate, max hours/week)
- [ ] Employee availability grid
- [ ] Schedule conflict highlighting (unavailable = red cell)
- [ ] Open shift board for unassigned shifts
- [ ] Shift swap requests between employees
- [ ] Manager approve/reject swap with one click
- [ ] Auto-reject if swap creates overtime or coverage gap
- [ ] Predictive scheduling compliance dashboard
- [ ] Warning for schedules posted less than required notice period
- [ ] Premium pay calculator for last-minute changes
- [ ] Audit log of schedule changes with timestamps
- [ ] Team dashboard: today's view, week overview, historical trends
- [ ] Role-based auth (Manager, Supervisor, Employee)
- [ ] Realistic demo data (Urban Threads clothing retail, 12 employees)

### Out of Scope

- POS integration — mock revenue forecast data instead
- SMS/push notifications — show notification UI but don't send real messages
- Geofenced clock-in/out — not building a time clock
- Payroll export — just show the data
- Multi-location support — single store for demo
- Actual predictive scheduling law database — hardcode a sample rule set

## Context

- Target audience: retail store managers, restaurant managers, franchise operators
- 32% of managers struggle with scheduling complexity
- Predictive scheduling laws (California, NYC, Seattle, Oregon) require 7-14 day advance notice + premium pay for changes
- Competitors: Deputy ($4.50/user), UKG ($300/location) — either too basic or too expensive
- This is a LinkedIn showcase demo app
- Demo store: Urban Threads (clothing retail), 1 location, 9 AM - 9 PM, 7 days/week
- Revenue budget: $12,000/week labor
- 12 demo employees with varied roles, rates, availability
- 3 demo accounts: manager, supervisor, employee

## Constraints

- **Tech stack**: Next.js (App Router), Neon PostgreSQL via Drizzle ORM, NextAuth v5 (Credentials), shadcn/ui + Tailwind CSS
- **Deploy**: Vercel with Neon PostgreSQL (Vercel-managed integration)
- **Domain**: shiftwise.demos.fonnit.com
- **Design**: Indigo/purple (#6366F1) primary, white backgrounds, subtle gray borders, mobile-responsive
- **Font**: Inter via next/font with correct CSS variable wiring (--font-inter → --font-sans)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Credentials-only auth | Demo app, simplicity over OAuth | — Pending |
| Single store | Demo scope, multi-location out of scope | — Pending |
| Hardcoded compliance rules | No real law database, sample rule set sufficient | — Pending |
| Drizzle ORM | Type-safe, lightweight, good DX with PostgreSQL | — Pending |
| shadcn/ui | Professional components, customizable, Tailwind-native | — Pending |

---
*Last updated: 2026-03-21 after initialization*
