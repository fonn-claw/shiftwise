---
phase: 01-foundation-and-employee-management
plan: 01
subsystem: auth, database
tags: [nextauth, jwt, drizzle, neon, bcryptjs, shadcn, next16, credentials]

requires:
  - phase: none
    provides: greenfield project

provides:
  - Next.js 16 project scaffold with Tailwind v4 and shadcn/ui
  - Database schema (stores, users, employeeRoles, availability)
  - NextAuth v5 credentials auth with JWT strategy and role propagation
  - Login page with ShiftWise Pro branding
  - proxy.ts route protection for unauthenticated users
  - Seed script with 12 employees, 3 demo accounts, Urban Threads store
  - Vitest test framework configured
  - DAL helpers (requireAuth, requireRole)

affects: [01-02, 01-03, 02-schedule-builder, 03-swaps, 04-dashboards]

tech-stack:
  added: [next@16.2.1, react@19, drizzle-orm, @neondatabase/serverless, next-auth@beta, shadcn/ui, bcryptjs, zod, date-fns, vitest, tailwindcss@4]
  patterns: [proxy.ts route protection, JWT session with role propagation, DAL pattern, Drizzle identity columns]

key-files:
  created:
    - src/lib/db/schema.ts
    - src/lib/db/index.ts
    - src/lib/db/seed.ts
    - src/lib/auth.ts
    - src/lib/auth.config.ts
    - src/proxy.ts
    - src/types/next-auth.d.ts
    - src/lib/constants.ts
    - src/lib/dal/auth.ts
    - src/app/(auth)/login/page.tsx
    - src/app/api/auth/[...nextauth]/route.ts
    - drizzle.config.ts
    - vitest.config.ts
    - .env.example
  modified:
    - package.json
    - src/app/layout.tsx
    - src/app/globals.css

key-decisions:
  - "Used Inter font with --font-inter CSS variable wired to --font-sans (avoiding circular reference bug)"
  - "Indigo primary color (#6366F1 in oklch) for brand identity"
  - "proxy.ts with auth-as-proxy pattern for Next.js 16 route protection"
  - "Identity columns (generatedAlwaysAsIdentity) instead of serial for all PKs"
  - "All employees share same hashed password for demo simplicity"

patterns-established:
  - "proxy.ts: export { auth as proxy } for route protection"
  - "DAL pattern: requireAuth/requireRole for server-side auth checks"
  - "Drizzle schema with pgEnum for user_role and job_role enums"
  - "shadcn/ui components in src/components/ui/"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, DEMO-01, DEMO-02, DEMO-07]

duration: 6min
completed: 2026-03-21
---

# Phase 1 Plan 1: Project Scaffold and Auth Summary

**Next.js 16 scaffold with NextAuth v5 credentials/JWT auth, Drizzle ORM schema (4 tables), login page, and 12-employee seed data for Urban Threads store**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-21T23:24:54Z
- **Completed:** 2026-03-21T23:31:00Z
- **Tasks:** 2
- **Files modified:** 23

## Accomplishments
- Scaffolded Next.js 16 project with Tailwind v4, shadcn/ui (14 components), and Inter font correctly wired
- Created Drizzle ORM database schema with stores, users, employeeRoles, and availability tables using identity columns
- Configured NextAuth v5 with credentials provider, JWT strategy (30-day sessions), and role propagation to session
- Built polished login page with ShiftWise Pro branding, indigo accent, and generic error messages
- Created seed script with all 12 employees from BRIEF.md, 3 demo accounts, and Urban Threads store config
- Set up proxy.ts route protection and DAL auth helpers

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold project, deps, schema, tooling** - `13a08cf` (feat)
2. **Task 2: Auth, login, proxy, seed data** - `5d4955d` (feat)

## Files Created/Modified
- `src/lib/db/schema.ts` - Database schema: stores, users, employeeRoles, availability tables
- `src/lib/db/index.ts` - Drizzle ORM + Neon connection
- `src/lib/db/seed.ts` - Seed script with 12 employees, 3 demo accounts, Urban Threads store
- `src/lib/auth.ts` - NextAuth v5 config with credentials provider and JWT callbacks
- `src/lib/auth.config.ts` - Edge-compatible auth config for proxy
- `src/proxy.ts` - Route protection via Next.js 16 proxy pattern
- `src/types/next-auth.d.ts` - NextAuth type extensions for role and id
- `src/lib/constants.ts` - Role colors, user role labels, days of week
- `src/lib/dal/auth.ts` - requireAuth and requireRole helpers
- `src/app/(auth)/login/page.tsx` - Login page with ShiftWise Pro branding
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth route handler
- `src/app/layout.tsx` - Root layout with Inter font variable
- `src/app/globals.css` - Tailwind theme with indigo primary colors
- `drizzle.config.ts` - Drizzle Kit config for Neon PostgreSQL
- `vitest.config.ts` - Vitest test framework config
- `.env.example` - Environment variable template

## Decisions Made
- Used Inter font with --font-inter CSS variable wired to --font-sans (per AGENTS.md known bug fix)
- Set indigo/purple (#6366F1) as primary color in oklch format for the shadcn theme
- Used proxy.ts (not middleware.ts) per Next.js 16 convention
- Used identity columns instead of serial for all primary keys per Drizzle best practices
- Created separate db connection in seed.ts with dotenv for CLI execution

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] shadcn components failed to install in batch**
- **Found during:** Task 1 (shadcn init)
- **Issue:** `npx shadcn@latest add` with many components only installed button, silently skipping others
- **Fix:** Installed remaining components in separate batches
- **Files modified:** src/components/ui/*.tsx
- **Verification:** All 14 components present in src/components/ui/
- **Committed in:** 5d4955d (Task 2 commit)

**2. [Rule 1 - Bug] auth.config.ts type error with satisfies NextAuthConfig**
- **Found during:** Task 2 (auth setup)
- **Issue:** NextAuthConfig requires providers property, but auth.config.ts is meant to be a partial config
- **Fix:** Changed to Partial<NextAuthConfig> type annotation
- **Files modified:** src/lib/auth.config.ts
- **Verification:** TypeScript compiles clean
- **Committed in:** 5d4955d (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for build to pass. No scope creep.

## Issues Encountered
- create-next-app refused to scaffold in directory with existing files; scaffolded in /tmp then copied files over
- .gitignore pattern `.env*` blocked .env.example; added `!.env.example` exception

## User Setup Required
None - database push and seed require DATABASE_URL in .env.local (handled during deployment).

## Next Phase Readiness
- Auth foundation complete: login, JWT sessions, role propagation, route protection
- Database schema ready for employee CRUD (Plan 01-02 and 01-03)
- All shadcn/ui components installed for building app shell and employee management UI
- Seed script ready to run once DATABASE_URL is configured

---
*Phase: 01-foundation-and-employee-management*
*Completed: 2026-03-21*
