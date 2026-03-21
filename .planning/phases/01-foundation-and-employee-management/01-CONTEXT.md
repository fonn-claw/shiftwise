# Phase 1: Foundation and Employee Management - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the full application foundation: Next.js project scaffold, database schema with Drizzle ORM, NextAuth v5 credentials authentication with role-based access, employee CRUD management, availability editing, and seed data for the Urban Threads demo store. This phase delivers a working app shell with auth and employee management — the schedule builder comes in Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Authentication & Session
- Centered card login page with ShiftWise Pro logo and indigo accent
- JWT strategy (not database sessions) — required for NextAuth v5 credentials provider
- 30-day session duration, persists across browser refresh
- Generic error message "Invalid email or password" — no account enumeration
- Role badge displayed in header (Manager/Supervisor/Employee) — no runtime role switching
- Logout button accessible from any page via user menu in header

### Employee List & Profiles
- Table layout with sortable columns (name, role(s), rate, max hours, status)
- Slide-over panel from right side for employee detail view and editing
- Multi-role employees shown with color-coded role badges (cashier=blue, stock=green, manager=orange, visual merch=purple)
- Hourly rate visible to Manager role only — hidden from Supervisor and Employee views
- Manager can create, edit employees; Supervisor can view only; Employee sees own profile only

### Availability Grid
- Day-level granularity (available/unavailable per day of week — Mon through Sun)
- Recurring weekly pattern (not per-specific-week)
- Toggle grid interface — click day cells to toggle availability on/off
- Employee edits their own availability; Manager can override any employee's availability

### App Shell & Navigation
- Left sidebar navigation with icons + labels, collapsible to icon-only
- Sidebar items: Dashboard, Schedule, Employees, Swap Requests, Compliance (role-filtered)
- Mobile: bottom tab bar for employee-facing views
- Role-appropriate landing: Manager → team dashboard, Employee → own schedule
- Indigo/purple (#6366F1) primary color throughout, "ShiftWise Pro" branding in sidebar header
- Inter font via next/font with CSS variable --font-inter wired to --font-sans (per AGENTS.md bug note)

### Claude's Discretion
- Exact sidebar width and collapse breakpoint
- Loading skeleton designs
- Form validation UX (inline vs toast)
- Error page designs (404, 500)
- Exact table pagination (if needed for 12 employees, likely not)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `BRIEF.md` — Full product spec including employee data table, demo accounts, store config, design direction
- `.planning/PROJECT.md` — Project context, constraints, key decisions
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-05, EMPL-01 through EMPL-06, DEMO-01, DEMO-02, DEMO-07
- `AGENTS.md` — Build instructions including font variable bug fix requirement

### Research
- `.planning/research/STACK.md` — Technology stack recommendations with versions
- `.planning/research/PITFALLS.md` — NextAuth JWT pitfall, Drizzle ORM gotchas
- `.planning/research/ARCHITECTURE.md` — Component boundaries, DAL pattern, schema design

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, Phase 1 establishes all foundations

### Established Patterns
- None yet — this phase sets the patterns for all subsequent phases

### Integration Points
- Database schema created here will be used by all subsequent phases
- Auth session/role system used by all route protection and UI filtering
- Employee data model is the foundation for schedule builder (Phase 2)
- Seed data establishes demo scenario used throughout all phases

</code_context>

<specifics>
## Specific Ideas

- Design should feel like "modern workforce management" — clean, professional, not playful
- Color scheme: Indigo/purple (#6366F1) primary, white backgrounds, subtle gray borders
- Employee table should feel like a proper HR management interface
- Role badges should use the same colors that will appear in the schedule grid (consistency)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-and-employee-management*
*Context gathered: 2026-03-21*
