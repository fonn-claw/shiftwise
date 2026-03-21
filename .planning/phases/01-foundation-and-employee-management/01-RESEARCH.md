# Phase 1: Foundation and Employee Management - Research

**Researched:** 2026-03-21
**Domain:** Next.js 16 App Router + Drizzle ORM + NextAuth v5 + shadcn/ui foundation
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire application foundation: project scaffolding with Next.js 16, database schema with Drizzle ORM on Neon PostgreSQL, authentication with NextAuth v5 credentials provider (JWT strategy), the app shell with role-based navigation, employee CRUD with availability editing, and seed data for the Urban Threads demo store.

The most critical technical concern is the NextAuth v5 credentials provider JWT session setup -- this is well-documented but has known pitfalls around session strategy mismatch and role propagation. A second critical concern is that Next.js 16 has renamed `middleware.ts` to `proxy.ts` -- all route protection must use the new file convention. The database schema must be designed with future phases in mind (shifts, swaps, compliance) even though only employee and auth tables are actively used in Phase 1.

**Primary recommendation:** Set up auth with explicit JWT strategy and role in token/session callbacks, use proxy.ts (not middleware.ts) for route protection, design the full database schema upfront but only seed employees/store/availability/auth for Phase 1.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Centered card login page with ShiftWise Pro logo and indigo accent
- JWT strategy (not database sessions) -- required for NextAuth v5 credentials provider
- 30-day session duration, persists across browser refresh
- Generic error message "Invalid email or password" -- no account enumeration
- Role badge displayed in header (Manager/Supervisor/Employee) -- no runtime role switching
- Logout button accessible from any page via user menu in header
- Table layout with sortable columns (name, role(s), rate, max hours, status) for employee list
- Slide-over panel from right side for employee detail view and editing
- Multi-role employees shown with color-coded role badges (cashier=blue, stock=green, manager=orange, visual merch=purple)
- Hourly rate visible to Manager role only -- hidden from Supervisor and Employee views
- Manager can create, edit employees; Supervisor can view only; Employee sees own profile only
- Day-level availability granularity (available/unavailable per day of week -- Mon through Sun)
- Recurring weekly pattern (not per-specific-week)
- Toggle grid interface -- click day cells to toggle availability on/off
- Employee edits their own availability; Manager can override any employee's availability
- Left sidebar navigation with icons + labels, collapsible to icon-only
- Sidebar items: Dashboard, Schedule, Employees, Swap Requests, Compliance (role-filtered)
- Mobile: bottom tab bar for employee-facing views
- Role-appropriate landing: Manager -> team dashboard, Employee -> own schedule
- Indigo/purple (#6366F1) primary color, "ShiftWise Pro" branding in sidebar header
- Inter font via next/font with CSS variable --font-inter wired to --font-sans

### Claude's Discretion
- Exact sidebar width and collapse breakpoint
- Loading skeleton designs
- Form validation UX (inline vs toast)
- Error page designs (404, 500)
- Exact table pagination (if needed for 12 employees, likely not)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can log in with email and password (credentials provider) | NextAuth v5 credentials provider with JWT strategy, bcryptjs for password hashing |
| AUTH-02 | User session persists across browser refresh (JWT strategy) | JWT strategy with 30-day maxAge, AUTH_SECRET env var required |
| AUTH-03 | User can log out from any page | signOut() from next-auth/react, accessible via user menu in header |
| AUTH-04 | Role-based access control enforced (Manager, Supervisor, Employee) | Role stored in JWT token via jwt callback, exposed via session callback, checked in DAL and proxy.ts |
| AUTH-05 | Manager can access all features; Supervisor can view schedules and approve swaps; Employee can view own schedule and request swaps | DAL pattern for data-level authorization, proxy.ts for route-level protection |
| EMPL-01 | Manager can view list of all employees with roles, rates, and availability | Server Component with Drizzle query, sortable table with shadcn/ui Table component |
| EMPL-02 | Manager can create new employee profiles | Server Action with zod validation, slide-over panel with form |
| EMPL-03 | Manager can edit employee profiles | Server Action for update, same slide-over panel in edit mode |
| EMPL-04 | Employee can set their availability (available days/times) | Day-of-week toggle grid, Server Action to persist, recurring weekly pattern |
| EMPL-05 | Manager can view employee availability when scheduling | Availability data loaded with employee data, displayed in employee detail |
| EMPL-06 | Employees can have multiple roles | employee_roles junction table, multi-select in create/edit form |
| DEMO-01 | Seed data creates Urban Threads store | Seed script with store config (9AM-9PM, 7 days, $12K/week budget) |
| DEMO-02 | 12 employees seeded with roles, rates, max hours, and availability | Seed script matches BRIEF.md employee table exactly |
| DEMO-07 | Three demo accounts seeded (manager, supervisor, employee) | bcryptjs hashed passwords, specific email/password combos from BRIEF |
</phase_requirements>

## Standard Stack

### Core (Phase 1 specific)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.1 | Full-stack React framework with App Router | Latest stable, Turbopack default, proxy.ts for route protection |
| React | 19 | UI library | Ships with Next.js 16, required for latest shadcn/ui |
| TypeScript | 5.x | Type safety | Next.js 16 has stricter checks, essential for Drizzle type inference |
| drizzle-orm | 0.45.1 | Type-safe SQL ORM | Lightweight, SQL-like API, excellent PostgreSQL + Neon support |
| @neondatabase/serverless | 1.0.2 | Neon connection driver | WebSocket-based, required for Vercel serverless |
| drizzle-kit | 0.31.10 | Schema migrations | Generates SQL migrations from Drizzle schema files |
| next-auth | 5.0.0-beta.30 | Authentication | Standard auth for Next.js, credentials provider for demo |
| shadcn/ui | CLI v4 | Component library | Copies components into project, Tailwind v4 + React 19 compatible |
| Tailwind CSS | 4.2.2 | Utility-first CSS | v4 stable, CSS-first config with @theme directive |
| @tailwindcss/postcss | 4.2.2 | PostCSS plugin for Next.js | Required for Tailwind v4 integration |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 4.3.6 | Schema validation | Form validation, Server Action input validation |
| bcryptjs | 3.0.3 | Password hashing | Hashing demo account passwords, pure JS (works in Edge) |
| date-fns | 4.1.0 | Date manipulation | Seed data date calculations, availability display |
| lucide-react | 0.577.0 | Icons | Default icon library for shadcn/ui, sidebar navigation icons |
| tw-animate-css | latest | CSS animations | Replaces deprecated tailwindcss-animate, installed by shadcn init |

### Dev Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| drizzle-kit | 0.31.10 | DB migrations and schema push |
| @types/bcryptjs | latest | TypeScript types for bcryptjs |
| dotenv | latest | Env var loading for seed scripts |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Drizzle ORM | Prisma | Prisma is heavier (~300KB vs ~30KB), slower serverless cold starts, generates client binary. Drizzle prescribed by project. |
| bcryptjs | bcrypt (native) | bcrypt requires native bindings, fails in Edge runtime. bcryptjs is pure JS, works everywhere. |
| JWT sessions | Database sessions | Database sessions incompatible with credentials provider in NextAuth v5. JWT is required. |

**Installation:**
```bash
# Initialize Next.js 16 project
npx create-next-app@latest shiftwise --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# shadcn/ui init (adds Tailwind v4 config, cn utility, base components)
npx shadcn@latest init

# Database: Drizzle + Neon
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit dotenv

# Auth
npm install next-auth@beta

# Utilities
npm install zod bcryptjs date-fns
npm install -D @types/bcryptjs

# Core shadcn components needed for Phase 1
npx shadcn@latest add button card dialog dropdown-menu input label select table badge avatar separator sheet toast sonner
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    (auth)/
      login/page.tsx              # Login form (centered card)
    (dashboard)/
      layout.tsx                  # Authenticated shell (sidebar, nav, role context)
      page.tsx                    # Redirect based on role
      dashboard/page.tsx          # Manager team dashboard (placeholder for Phase 4)
      employees/page.tsx          # Employee list table
      schedule/page.tsx           # Placeholder for Phase 2
      swaps/page.tsx              # Placeholder for Phase 3
      compliance/page.tsx         # Placeholder for Phase 3
    api/
      auth/[...nextauth]/route.ts # NextAuth handler
  components/
    ui/                           # shadcn/ui components (auto-generated)
    layout/
      sidebar.tsx                 # Collapsible sidebar navigation
      header.tsx                  # Top header with role badge + user menu
      mobile-nav.tsx              # Bottom tab bar for mobile
    employees/
      employee-table.tsx          # Sortable employee list (client component)
      employee-panel.tsx          # Slide-over create/edit panel (client component)
      availability-grid.tsx       # Day toggle grid (client component)
  lib/
    auth.ts                       # NextAuth config (providers, callbacks, session)
    auth.config.ts                # Auth config for proxy.ts (edge-compatible)
    db/
      index.ts                    # Drizzle client + Neon connection
      schema.ts                   # All table definitions
      relations.ts                # Drizzle relations definitions
    dal/
      employees.ts                # Employee queries with auth checks
      auth.ts                     # Auth-related queries
    actions/
      employees.ts                # Employee Server Actions (create, update)
      auth.ts                     # signIn/signOut actions
    utils.ts                      # cn() utility (from shadcn init)
    constants.ts                  # Role colors, role names, store defaults
  proxy.ts                        # Route protection (was middleware.ts in Next.js 15)
  drizzle.config.ts               # Drizzle kit configuration
```

### Pattern 1: NextAuth v5 with Credentials + JWT + Role

**What:** Configure NextAuth v5 with credentials provider, JWT session strategy, and role propagated to session.
**When to use:** Phase 1 auth setup -- this is THE pattern for the entire app.
**Example:**
```typescript
// src/lib/auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials.email as string
        const password = credentials.password as string

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)

        if (!user) return null

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) return null

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
```

```typescript
// Type extensions (src/types/next-auth.d.ts)
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }
  interface User {
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    id: string
  }
}
```

### Pattern 2: proxy.ts for Route Protection (Next.js 16)

**What:** Use proxy.ts (renamed from middleware.ts in Next.js 16) to protect authenticated routes.
**When to use:** All routes under (dashboard) require authentication.
**Critical note:** Next.js 16 renamed middleware.ts to proxy.ts. The export must be named `proxy`, not `middleware`.
**Example:**
```typescript
// src/proxy.ts
export { auth as proxy } from "@/lib/auth"

export const config = {
  matcher: [
    // Match all routes except auth, static, and API auth routes
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}
```

For the auth config that runs in proxy (edge-compatible):
```typescript
// src/lib/auth.config.ts
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth // Redirect unauthenticated users to login
    },
  },
} satisfies NextAuthConfig
```

### Pattern 3: Data Access Layer (DAL) with Auth Checks

**What:** Centralized module wrapping all database queries with session/role verification.
**When to use:** Every server-side data access point.
**Example:**
```typescript
// src/lib/dal/employees.ts
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, employeeRoles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function getEmployees() {
  const session = await auth()
  if (!session?.user) throw new Error("Not authenticated")

  if (session.user.role === "employee") {
    // Employees see only their own profile
    return db.select().from(users).where(eq(users.id, parseInt(session.user.id)))
  }

  // Managers and supervisors see all
  return db.select().from(users)
}
```

### Pattern 4: Server Actions with Zod Validation

**What:** Type-safe mutations using Server Actions with zod schema validation.
**When to use:** All form submissions (employee create/edit, availability update).
**Example:**
```typescript
// src/lib/actions/employees.ts
"use server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"

const createEmployeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["manager", "supervisor", "employee"]),
  hourlyRate: z.number().positive(),
  maxHoursPerWeek: z.number().int().positive().max(60),
})

export async function createEmployee(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "manager") {
    return { error: "Unauthorized" }
  }

  const parsed = createEmployeeSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    // ... etc
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  await db.insert(users).values(parsed.data)
  revalidatePath("/employees")
  return { success: true }
}
```

### Anti-Patterns to Avoid

- **Using middleware.ts instead of proxy.ts:** Next.js 16 deprecated middleware.ts. The file MUST be named proxy.ts and the export MUST be named `proxy`.
- **Database sessions with credentials provider:** NextAuth v5 credentials provider ONLY works with JWT strategy. Using database sessions will cause `auth()` to return null.
- **Mixing auth checks across components:** All data access goes through DAL functions that verify session/role. Components receive pre-authorized data.
- **Circular CSS variable reference for font:** Must wire `--font-sans: var(--font-inter)` in globals.css, NOT `--font-sans: var(--font-sans)`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication | Custom JWT/session system | NextAuth v5 (next-auth@beta) | CSRF, token rotation, cookie security, session management all handled |
| Password hashing | Custom hashing | bcryptjs | Salt generation, timing-attack-safe comparison, configurable rounds |
| Form validation | Manual field checks | zod schemas | Type inference, composable schemas, error formatting |
| UI components | Custom buttons/tables/dialogs | shadcn/ui components | Accessible, keyboard-navigable, ARIA-compliant out of the box |
| Route protection | Custom auth checks per route | proxy.ts + auth() | Centralized, runs before route rendering, handles redirects |
| Database queries | Raw SQL strings | Drizzle ORM | Type-safe, SQL injection prevention, migration management |

**Key insight:** Phase 1 is foundation-setting. Every custom solution here becomes technical debt multiplied across all subsequent phases. Use established libraries for everything.

## Common Pitfalls

### Pitfall 1: NextAuth v5 Credentials + Session Strategy Mismatch
**What goes wrong:** Developer sets up database session strategy (common with Drizzle adapter) but uses credentials provider. `auth()` returns null despite valid cookies. Redirect loops on protected routes.
**Why it happens:** NextAuth v5 credentials provider deliberately does not create database sessions. Only JWT strategy works.
**How to avoid:** Explicitly set `session: { strategy: "jwt" }` in auth config. Do NOT install or configure a database adapter for session storage. Test all three demo accounts (manager, supervisor, employee) and verify role-gated UI works after fresh login.
**Warning signs:** Login appears to work but `auth()` returns null in Server Components. Session only appears after hard reload.

### Pitfall 2: middleware.ts vs proxy.ts in Next.js 16
**What goes wrong:** Developer creates middleware.ts (from Next.js 15 patterns). Next.js 16 ignores it or shows deprecation warnings. Route protection silently fails.
**Why it happens:** Next.js 16.0.0 renamed middleware.ts to proxy.ts. The exported function must also be named `proxy` (or default export), not `middleware`.
**How to avoid:** Create `src/proxy.ts` with `export { auth as proxy }`. Never create middleware.ts. Run the codemod if migrating: `npx @next/codemod@canary middleware-to-proxy .`
**Warning signs:** Routes that should require authentication are accessible without login.

### Pitfall 3: Font Variable Circular Reference
**What goes wrong:** CSS variable `--font-sans` references itself (`--font-sans: var(--font-sans)`) instead of the Inter font variable. Text renders in browser default font.
**Why it happens:** Copy-paste error or incorrect next/font setup. The AGENTS.md specifically warns about this.
**How to avoid:** In layout.tsx: `const inter = Inter({ variable: "--font-inter" })`. In globals.css: `--font-sans: var(--font-inter)`. Verify font loads correctly in browser DevTools.
**Warning signs:** Text renders in Times New Roman or system default instead of Inter.

### Pitfall 4: Drizzle Schema Migration Gotchas
**What goes wrong:** Using serial columns instead of identity columns, missing indexes, using `drizzle-kit push` which can silently drop data.
**Why it happens:** Drizzle has different migration semantics than Prisma. Push is convenient but unsafe.
**How to avoid:** Use `integer().primaryKey().generatedAlwaysAsIdentity()` for primary keys. Use `drizzle-kit generate` + `drizzle-kit migrate` even in development. Add indexes on foreign key columns explicitly.
**Warning signs:** Migration files contain `DROP` statements, or queries become slow as data grows.

### Pitfall 5: AUTH_SECRET Missing
**What goes wrong:** Sessions fail silently. Users can log in but session is not persisted.
**Why it happens:** AUTH_SECRET environment variable not set. NextAuth v5 requires this for JWT encryption.
**How to avoid:** Generate a secret: `npx auth secret`. Add to .env.local. Verify it's set in production environment.
**Warning signs:** Login works but session disappears on page refresh.

### Pitfall 6: Availability Model Too Simple for Future Phases
**What goes wrong:** Day-level availability (boolean per day) works for Phase 1 but Phase 2's schedule builder needs to validate shift times against availability windows.
**Why it happens:** CONTEXT.md specifies day-level granularity, but shifts have specific start/end times.
**How to avoid:** Store availability as day_of_week + is_available (matching the toggle grid UI), but design the schema so it could be extended to time windows later. For Phase 1, day-level is correct per user decision. Phase 2 can add time-window validation if needed.
**Warning signs:** In Phase 2, scheduling an employee for an evening shift on a day they marked "available" but they actually meant "morning only."

## Code Examples

### Drizzle Schema for Phase 1 Tables

```typescript
// src/lib/db/schema.ts
import {
  pgTable,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core"

export const userRoleEnum = pgEnum("user_role", ["manager", "supervisor", "employee"])
export const jobRoleEnum = pgEnum("job_role", ["cashier", "stock", "manager", "visual_merch"])

export const stores = pgTable("stores", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  openTime: varchar({ length: 5 }).notNull(), // "09:00"
  closeTime: varchar({ length: 5 }).notNull(), // "21:00"
  weeklyBudget: decimal({ precision: 10, scale: 2 }).notNull(),
  timezone: varchar({ length: 50 }).notNull().default("America/New_York"),
  createdAt: timestamp().notNull().defaultNow(),
})

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  passwordHash: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  role: userRoleEnum().notNull().default("employee"),
  hourlyRate: decimal({ precision: 6, scale: 2 }).notNull(),
  maxHoursPerWeek: integer().notNull().default(40),
  phone: varchar({ length: 20 }),
  storeId: integer().notNull().references(() => stores.id),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
})

export const employeeRoles = pgTable("employee_roles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => users.id, { onDelete: "cascade" }),
  roleName: jobRoleEnum().notNull(),
})

export const availability = pgTable("availability", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => users.id, { onDelete: "cascade" }),
  dayOfWeek: integer().notNull(), // 0 = Monday, 6 = Sunday
  isAvailable: boolean().notNull().default(true),
})
```

### Drizzle + Neon Connection

```typescript
// src/lib/db/index.ts
import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

### Seed Script Structure

```typescript
// src/lib/db/seed.ts
import { db } from "./index"
import { stores, users, employeeRoles, availability } from "./schema"
import bcrypt from "bcryptjs"

async function seed() {
  // 1. Create store
  const [store] = await db.insert(stores).values({
    name: "Urban Threads",
    openTime: "09:00",
    closeTime: "21:00",
    weeklyBudget: "12000.00",
  }).returning()

  // 2. Create employees with hashed passwords
  const passwordHash = await bcrypt.hash("demo1234", 10)
  // ... insert all 12 employees per BRIEF.md table

  // 3. Create employee roles (junction table)
  // ... insert role assignments

  // 4. Create availability
  // ... insert day-of-week availability per BRIEF.md

  console.log("Seed complete!")
}

seed().catch(console.error)
```

### Collapsible Sidebar Pattern

```typescript
// src/components/layout/sidebar.tsx
"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  LayoutDashboard, Calendar, Users, ArrowLeftRight,
  Shield, ChevronLeft, ChevronRight
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["manager", "supervisor"] },
  { label: "Schedule", href: "/schedule", icon: Calendar, roles: ["manager", "supervisor", "employee"] },
  { label: "Employees", href: "/employees", icon: Users, roles: ["manager", "supervisor"] },
  { label: "Swap Requests", href: "/swaps", icon: ArrowLeftRight, roles: ["manager", "supervisor", "employee"] },
  { label: "Compliance", href: "/compliance", icon: Shield, roles: ["manager"] },
]

// Filter items based on session.user.role
// Collapse state managed with useState
// Width: expanded ~240px, collapsed ~64px (icon-only)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| middleware.ts | proxy.ts | Next.js 16.0.0 (2026) | File MUST be named proxy.ts, export MUST be named proxy |
| tailwindcss-animate | tw-animate-css | shadcn/ui v4 (2025) | New animation package installed by shadcn init |
| serial columns in Drizzle | identity columns | Drizzle best practice | Use generatedAlwaysAsIdentity() not serial() |
| NextAuth v4 callbacks | NextAuth v5 callbacks | Auth.js v5 beta | Different callback signatures, no adapter needed for credentials |
| Tailwind config file (tailwind.config.ts) | CSS-first config (@theme in globals.css) | Tailwind v4 (2025) | No separate config file, use @theme directive in CSS |

**Deprecated/outdated:**
- `middleware.ts` -- renamed to `proxy.ts` in Next.js 16. Will show deprecation warnings.
- `tailwindcss-animate` -- replaced by `tw-animate-css` in shadcn/ui v4.
- `serial()` in Drizzle -- use `integer().generatedAlwaysAsIdentity()` instead.
- NextAuth v4 patterns (getServerSession, authOptions export) -- v5 uses `auth()` and `NextAuth()` config.

## Open Questions

1. **Neon connection method: neon-http vs neon-serverless WebSocket**
   - What we know: @neondatabase/serverless offers both HTTP (`neon()`) and WebSocket (`Pool()`) modes. HTTP is simpler for one-off queries, WebSocket is better for transactions.
   - What's unclear: Whether seed script needs WebSocket mode for transaction support.
   - Recommendation: Use HTTP mode (`neon()`) for app queries, WebSocket mode for seed script if transactions needed. Both are supported by drizzle-orm.

2. **shadcn/ui Sheet component for slide-over panel**
   - What we know: shadcn/ui has a Sheet component that slides from the side.
   - What's unclear: Whether it supports slide-from-right specifically.
   - Recommendation: shadcn Sheet component accepts `side="right"` prop. Use it directly.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (recommended for Next.js 16) |
| Config file | vitest.config.ts -- Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Login with email/password | integration | `npx vitest run src/__tests__/auth.test.ts -t "login"` | Wave 0 |
| AUTH-02 | Session persists (JWT) | integration | `npx vitest run src/__tests__/auth.test.ts -t "session"` | Wave 0 |
| AUTH-03 | Logout works | integration | `npx vitest run src/__tests__/auth.test.ts -t "logout"` | Wave 0 |
| AUTH-04 | Role-based access enforced | unit | `npx vitest run src/__tests__/dal.test.ts -t "role"` | Wave 0 |
| AUTH-05 | Role permissions correct | unit | `npx vitest run src/__tests__/dal.test.ts -t "permissions"` | Wave 0 |
| EMPL-01 | Employee list visible to manager | unit | `npx vitest run src/__tests__/employees.test.ts -t "list"` | Wave 0 |
| EMPL-02 | Create employee | unit | `npx vitest run src/__tests__/employees.test.ts -t "create"` | Wave 0 |
| EMPL-03 | Edit employee | unit | `npx vitest run src/__tests__/employees.test.ts -t "edit"` | Wave 0 |
| EMPL-04 | Set availability | unit | `npx vitest run src/__tests__/employees.test.ts -t "availability"` | Wave 0 |
| EMPL-05 | View availability | unit | `npx vitest run src/__tests__/employees.test.ts -t "availability"` | Wave 0 |
| EMPL-06 | Multiple roles | unit | `npx vitest run src/__tests__/employees.test.ts -t "roles"` | Wave 0 |
| DEMO-01 | Store seeded | smoke | `npx vitest run src/__tests__/seed.test.ts -t "store"` | Wave 0 |
| DEMO-02 | Employees seeded | smoke | `npx vitest run src/__tests__/seed.test.ts -t "employees"` | Wave 0 |
| DEMO-07 | Demo accounts seeded | smoke | `npx vitest run src/__tests__/seed.test.ts -t "accounts"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration
- [ ] `src/__tests__/auth.test.ts` -- Auth flow tests
- [ ] `src/__tests__/dal.test.ts` -- DAL authorization tests
- [ ] `src/__tests__/employees.test.ts` -- Employee CRUD tests
- [ ] `src/__tests__/seed.test.ts` -- Seed data verification tests
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react`

## Sources

### Primary (HIGH confidence)
- [Next.js 16 proxy.ts docs](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) -- proxy.ts file convention, matcher config, migration from middleware
- [Drizzle ORM PostgreSQL guide](https://orm.drizzle.team/docs/get-started/postgresql-new) -- schema definition, migrations, pgTable API
- [shadcn/ui Next.js installation](https://ui.shadcn.com/docs/installation/next) -- CLI init, component installation
- [shadcn/ui Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) -- tw-animate-css, @theme directive

### Secondary (MEDIUM confidence)
- [Auth.js Role-Based Access Control guide](https://authjs.dev/guides/role-based-access-control) -- JWT/session callback patterns for role
- [Auth.js installation guide](https://authjs.dev/getting-started/installation) -- NextAuth v5 setup with proxy.ts export
- [Auth.js route protection](https://authjs.dev/getting-started/session-management/protecting) -- authorized callback pattern
- [NextAuth v5 credentials + JWT guide](https://javascript.plainenglish.io/step-by-step-guide-integrate-nextauth-v5-beta-with-credentials-jwt-sessions-into-next-js-2a9182504c85) -- Credentials provider with JWT strategy walkthrough
- [Neon Drizzle migrations guide](https://neon.com/docs/guides/drizzle-migrations) -- Drizzle + Neon setup
- npm registry version verification (all versions confirmed 2026-03-21)

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified via npm registry, compatibility confirmed
- Architecture: HIGH -- patterns from official Next.js 16 docs and Auth.js docs
- Pitfalls: HIGH -- proxy.ts rename verified with official Next.js docs, NextAuth JWT pitfall documented in multiple GitHub issues
- Auth setup: HIGH -- verified proxy.ts pattern and JWT callbacks against official Auth.js docs

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (30 days -- stack is stable, NextAuth v5 beta may release new versions)
