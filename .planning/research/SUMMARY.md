# Project Research Summary

**Project:** ShiftWise Pro -- Retail Staff Scheduling Platform
**Domain:** Workforce management / employee scheduling with real-time labor cost visibility
**Researched:** 2026-03-21
**Confidence:** HIGH

## Executive Summary

ShiftWise Pro is a retail staff scheduling application whose core value proposition is a real-time labor cost meter that updates live as managers drag-and-drop shifts onto a weekly grid. This is a well-understood product category (Deputy, Homebase, When I Work are established competitors) with a clear differentiator: cost visibility during schedule construction rather than after the fact. The recommended approach is a Next.js 16 App Router application with a server-first data fetching pattern, client-side interactive "islands" for the schedule grid and cost meter, Drizzle ORM on Neon PostgreSQL, and NextAuth v5 for credentials-based demo authentication. The stack is modern but stable, with all major components verified compatible.

The architecture centers on a single hero page -- the schedule builder -- which is an employee-by-day grid (not a traditional calendar) with drag-and-drop via dnd-kit and a sticky cost meter sidebar. Cost calculations happen entirely client-side from a local shifts array, giving sub-millisecond feedback. Server Actions handle persistence with optimistic updates. A Data Access Layer (DAL) pattern centralizes authorization so role-based access (Manager/Supervisor/Employee) is enforced in one place. The database schema is normalized with proper foreign keys, avoiding the temptation to store schedules as JSON blobs.

The primary risks are: (1) drag-and-drop grid performance degradation with 50+ shifts if React re-renders are not carefully memoized, (2) NextAuth v5 credentials provider silently failing if database sessions are used instead of JWT strategy, (3) date/time calculation errors around midnight-crossing shifts and DST boundaries corrupting the labor cost meter, and (4) the mobile experience being unusable if the desktop grid is not complemented by a mobile-specific daily list view. All four are well-understood and preventable with the patterns documented in the architecture research.

## Key Findings

### Recommended Stack

The stack is prescribed by the project brief and validated by research. All components are compatible with each other (verified). The only pre-1.0 dependencies are NextAuth v5 (beta, but widely adopted) and @dnd-kit/react 0.3.x (newer rewrite, recommended over the stable @dnd-kit/core).

**Core technologies:**
- **Next.js 16.2 + React 19:** App Router with Server Components for data fetching, Server Actions for mutations. Turbopack default bundler.
- **Drizzle ORM + Neon PostgreSQL:** Lightweight ORM (30KB vs Prisma's 300KB+), SQL-like API, first-class Neon integration via @neondatabase/serverless driver. No binary engine = fast serverless cold starts.
- **NextAuth v5 (Auth.js):** Credentials provider with JWT session strategy. Must pin to specific beta version. Role stored in JWT token.
- **shadcn/ui + Tailwind CSS v4:** Component library copied into project (not a dependency). Tailwind v4 with CSS-first config. Includes Chart component wrapping Recharts.
- **@dnd-kit/react:** Drag-and-drop for the schedule grid. Accessible, 10KB, maintains 60fps. Designed for React 19.
- **date-fns v4:** All date arithmetic. Tree-shakeable, timezone-aware. Never use raw Date math.
- **Recharts 3.8.x:** Labor cost charts via shadcn/ui Chart wrapper. SVG-based, declarative.

### Expected Features

**Must have (table stakes):**
- Weekly calendar grid with drag-and-drop shift assignment
- Employee profiles with multi-role support and hourly rates
- Availability management with time-window granularity
- Conflict detection (availability + overtime)
- Color-coded shifts by role
- Copy previous week's schedule
- Shift swap requests with manager approval
- Open shift board for uncovered shifts
- Overtime tracking with amber (35hr) and red (40hr) alerts
- Role-based access control (Manager, Supervisor, Employee)
- Mobile-responsive schedule viewing for employees

**Should have (differentiators):**
- Real-time labor cost meter sidebar (THE hero feature)
- Weekly budget vs actual bar chart
- Per-employee hours tracker for proactive overtime prevention
- Predictive scheduling compliance dashboard with late-posting warnings
- Premium pay calculator for last-minute changes
- Audit log of all schedule changes
- Auto-reject swaps that create overtime or coverage gaps
- Team dashboard with "who's working now" live view
- Historical labor cost trends (4-week chart)

**Defer (post-demo):**
- AI/auto-scheduling (massive complexity, mediocre results)
- Time clock / clock-in-out (different product domain)
- POS/payroll integration (mock data sufficient)
- SMS/push notifications (show UI only)
- Multi-location support (single store for demo)
- Chat/team messaging (distraction from core story)

### Architecture Approach

Server-first architecture with client islands. Server Components fetch all data in parallel (employees, shifts, store config, availability) and pass it as props to the ScheduleBuilder client component tree. The ScheduleBuilder owns all interactive state: a shifts array that the grid modifies via drag-and-drop and that the CostMeter derives all calculations from via useMemo. Server Actions persist mutations with optimistic updates. A centralized DAL enforces role-based access on every query.

**Major components:**
1. **Auth Middleware + DAL** -- Route protection, session validation, role-gated data access
2. **App Layout Shell** -- Navigation, sidebar, role-based menu rendering
3. **Schedule Grid (Client Island)** -- Weekly grid with dnd-kit drag-and-drop, shift CRUD, optimistic updates
4. **Cost Meter Sidebar (Client)** -- Real-time labor cost calculations derived from shifts array, overtime alerts, budget comparison
5. **Employee Management** -- Employee CRUD, availability editing, role assignment
6. **Shift Swap System** -- Swap requests, approval workflow, atomic constraint validation
7. **Compliance Engine** -- Schedule posting deadline checks, premium pay calculator, audit log
8. **Team Dashboard** -- Today view, weekly overview, historical trends (read-only)

### Critical Pitfalls

1. **Drag-and-drop performance death spiral** -- Memoize grid cells with React.memo, separate drag state from shift data, use dnd-kit's overlay system, compute costs in useMemo keyed to shifts array only
2. **NextAuth v5 credentials session trap** -- Explicitly set `session: { strategy: "jwt" }`, store role in JWT via callbacks, set AUTH_SECRET, never use database session strategy with credentials provider
3. **Date/time calculation errors** -- Use date-fns for all arithmetic, store UTC timestamps, define clear week boundaries, handle midnight-crossing shifts for both overtime and daily cost splits
4. **Mobile grid unusable** -- Build two views: desktop weekly grid for managers, mobile daily list for employees. Do not attempt mobile drag-and-drop. Design from the start, not as a retrofit.
5. **Swap request impossible states** -- Validate all constraints atomically (overtime, availability, role qualification, coverage), show preview before approval, use database transactions

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Data Model
**Rationale:** Everything depends on auth, database schema, and seed data. Getting NextAuth v5 JWT strategy right and the schema correct prevents cascading issues in every subsequent phase.
**Delivers:** Working auth with 3 demo accounts, complete database schema with migrations, seed script with relative dates, app layout shell with role-based navigation
**Addresses:** Auth/RBAC (table stakes), employee profiles (table stakes)
**Avoids:** NextAuth credentials session trap (Pitfall 2), Drizzle migration issues (Pitfall 7), stale demo dates (Pitfall 9)

### Phase 2: Employee Management
**Rationale:** Employees must be manageable before shifts can reference them. Simpler pages validate the DAL pattern before the complex schedule grid.
**Delivers:** Employee list, employee detail with availability editing, DAL functions, role-based data filtering
**Addresses:** Employee profiles, availability management, conflict detection foundation
**Avoids:** Availability granularity trap (Pitfall 5) -- model time-window availability from the start

### Phase 3: Schedule Builder Core
**Rationale:** The hero feature needs a working grid layout and data flow before adding drag-and-drop complexity. Build the static grid, shift CRUD via modals, and week navigation first.
**Delivers:** Weekly schedule grid (static), shift creation/editing/deletion via dialog, week navigation, availability conflict highlighting, Server Actions for shift CRUD
**Addresses:** Weekly calendar grid (table stakes), shift details (table stakes), color-coding (table stakes), conflict detection (table stakes)
**Avoids:** Component boundary confusion (Pitfall 11) -- establish server/client boundary here

### Phase 4: Schedule Builder Interactive + Cost Meter
**Rationale:** Adding interactivity on top of a working grid is safer than building both simultaneously. The cost meter is pure derived state that plugs in once shifts work.
**Delivers:** Drag-and-drop via dnd-kit, optimistic updates, copy previous week, real-time CostMeter sidebar with all calculations, overtime alerts, budget comparison chart
**Addresses:** Drag-and-drop (table stakes), real-time labor cost meter (hero differentiator), overtime tracking (table stakes), budget chart (differentiator), copy week (table stakes)
**Avoids:** Performance death spiral (Pitfall 1), stale cost calculations (Pitfall 8), date math errors (Pitfall 3)

### Phase 5: Shift Swaps and Coverage
**Rationale:** Requires working shifts and employee data. Can be built in parallel with Phase 4 if resources allow. Self-contained feature with its own validation engine.
**Delivers:** Open shift board, swap request creation, approval workflow, auto-reject logic, pick-up open shift flow
**Addresses:** Shift swap requests (table stakes), open shift board (table stakes), auto-reject (differentiator)
**Avoids:** Impossible swap states (Pitfall 6) -- atomic validation of all constraints

### Phase 6: Compliance, Dashboards, and Analytics
**Rationale:** Read-heavy features that layer on top of existing data. Audit logging must be wired into Server Actions from Phases 3-5 retroactively.
**Delivers:** Team dashboard (today view + week overview), historical labor cost trends, compliance warnings, premium pay calculator, audit log viewer
**Addresses:** Compliance dashboard (differentiator), premium pay calculator (differentiator), audit log (differentiator), team dashboard (differentiator), historical trends (differentiator)
**Avoids:** Relative date staleness (Pitfall 9)

### Phase 7: Polish, Mobile, and Deploy
**Rationale:** Final pass for responsive design, loading states, error handling, and deployment. Mobile employee view is a critical path item.
**Delivers:** Mobile-responsive schedule viewing, loading states, error boundaries, Vercel deployment, domain configuration
**Addresses:** Mobile responsive (table stakes), visual polish (success criteria)
**Avoids:** Mobile grid unusable (Pitfall 4), color accessibility failures (Pitfall 10)

### Phase Ordering Rationale

- **Dependencies flow downward:** Auth and schema must exist before employees, employees before shifts, shifts before cost meter, shifts before swaps
- **Risk-first:** The hardest features (schedule grid, drag-and-drop, cost meter) are in Phases 3-4, giving maximum time to iterate
- **The hero feature spans two phases (3-4):** Splitting static grid from interactive grid reduces risk. If drag-and-drop proves difficult, the app still works with click-to-assign
- **Phases 4, 5, and 6 have parallelization potential:** They depend on Phase 3 but not on each other
- **Polish is last:** Responsive design, accessibility, and deployment happen when features are stable

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3-4 (Schedule Builder):** The dnd-kit/react 0.3.x API is pre-1.0 and may need investigation. Consider falling back to @dnd-kit/core if the newer API proves unstable. Grid cell memoization strategy needs careful design.
- **Phase 5 (Shift Swaps):** The atomic constraint validation (overtime + availability + role + coverage simultaneously) needs careful algorithm design. No off-the-shelf pattern exists.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Well-documented NextAuth v5 + Drizzle + Neon setup. Just follow the pitfall prevention checklist.
- **Phase 2 (Employee Management):** Standard CRUD with shadcn/ui table/form components. No novel patterns.
- **Phase 6 (Dashboards):** Read-only data display with Recharts via shadcn/ui Chart component. Well-documented.
- **Phase 7 (Polish):** Standard responsive design and Vercel deployment.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies prescribed by brief, versions verified compatible, official docs consulted |
| Features | HIGH | Feature landscape well-mapped against 8+ competitor products, clear table stakes vs differentiators |
| Architecture | HIGH | Server-first + client islands is the established Next.js App Router pattern, data flow well-documented |
| Pitfalls | HIGH | Pitfalls sourced from GitHub issues, real bug reports, and documented failure modes with specific prevention strategies |

**Overall confidence:** HIGH

### Gaps to Address

- **@dnd-kit/react 0.3.x stability:** Pre-1.0 API may have undocumented breaking changes. Mitigation: have @dnd-kit/core as a fallback plan. Test early in Phase 3.
- **NextAuth v5 beta version pinning:** Exact beta version to pin needs to be determined at install time. Mitigation: lock version in package.json, do not auto-update.
- **Midnight-crossing shifts:** The exact UX for displaying a shift that spans two calendar days in the grid needs design attention. Mitigation: decide during Phase 3 planning whether to split the visual or show on the start day only.
- **Concurrent editing:** Two managers editing the same week's schedule simultaneously is out of scope but should be noted as a known limitation. No mitigation needed for demo.

## Sources

### Primary (HIGH confidence)
- Next.js 16.2 blog post and official docs -- framework, App Router patterns, authentication guide
- Drizzle ORM official docs and PostgreSQL guide -- ORM setup, migration patterns
- Neon Drizzle integration guide -- serverless driver configuration
- shadcn/ui Tailwind v4 docs and installation guide -- component library setup
- dnd-kit official docs -- drag-and-drop API and patterns
- Recharts npm -- chart library compatibility
- Tailwind CSS v4 blog -- CSS-first configuration
- date-fns npm -- date manipulation library
- zod npm -- schema validation library

### Secondary (MEDIUM confidence)
- NextAuth v5 GitHub issues (#12894, #12858, #11034) -- credentials provider failure modes and workarounds
- dnd-kit GitHub issues (#801, #926) -- React 19 compatibility, hydration mismatch
- Next.js App Router community patterns (dev.to) -- architectural patterns
- Feature-Sliced Design for Next.js App Router -- component organization
- Competitor feature analysis via Connecteam, FinancesOnline, PeopleManagingPeople, TCP Software, Shiftlab, RoostedHR, Unrubble, Homebase, Agendrix

### Tertiary (LOW confidence)
- Drizzle ORM Medium article on common mistakes -- migration pitfalls (single source, needs validation)
- Mobile drag-and-drop scheduling UX article (myshyft.com) -- mobile interaction patterns

---
*Research completed: 2026-03-21*
*Ready for roadmap: yes*
