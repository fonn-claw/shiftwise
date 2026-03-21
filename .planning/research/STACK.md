# Technology Stack

**Project:** ShiftWise Pro -- Retail Staff Scheduling Platform
**Researched:** 2026-03-21

## Recommended Stack

The tech stack is prescribed by the project brief. Research below validates versions, identifies supporting libraries, and flags compatibility considerations.

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 16.2 | Full-stack React framework | Latest stable. App Router is mature, Turbopack is now default bundler. Server Actions for mutations, Server Components for data fetching. Deployed on Vercel natively. | HIGH |
| React | 19 | UI library | Ships with Next.js 16. Required for shadcn/ui latest components (forwardRef removed). | HIGH |
| TypeScript | 5.x | Type safety | Next.js 16.2 has stricter type checks. Essential for Drizzle schema type inference. | HIGH |

### Database & ORM

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Neon PostgreSQL | Managed | Serverless Postgres | Vercel-managed integration, auto-scaling, branching for dev. Zero cold-start connection pooling. | HIGH |
| Drizzle ORM | 0.45.x | Type-safe SQL ORM | Lightweight (90% smaller than Prisma), SQL-like API, excellent PostgreSQL support, built-in schema migrations via drizzle-kit. Type inference from schema to queries. | HIGH |
| @neondatabase/serverless | 1.0.x | Neon connection driver | GA driver for serverless/edge. Uses WebSockets instead of TCP -- required for Vercel Edge/Serverless Functions. | HIGH |
| drizzle-kit | latest | Schema migrations | Generates and runs SQL migrations from Drizzle schema files. Ships alongside drizzle-orm. | HIGH |

### Authentication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| next-auth (Auth.js v5) | 5.0.0-beta.x | Authentication | The standard auth solution for Next.js. v5 beta is stable enough for production, widely used with Next.js 16. Credentials provider for demo app simplicity. | MEDIUM |

**Note on Auth.js v5:** Still in beta as of March 2026. The API is stable and widely adopted, but version pinning is critical -- lock to a specific beta version and do not auto-update. The Credentials provider is straightforward for a demo app. For production, OAuth providers would be preferred, but credentials-only is correct for this showcase.

### UI & Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| shadcn/ui | CLI v4 | Component library | Not a dependency -- copies components into your project. All components updated for Tailwind v4 and React 19. Professional, accessible, customizable. | HIGH |
| Tailwind CSS | 4.x | Utility-first CSS | v4 is stable (released Jan 2025). New CSS-first config with @theme directive. 5x faster builds. shadcn/ui fully compatible. | HIGH |
| @tailwindcss/postcss | 4.x | PostCSS plugin | Required for Next.js integration with Tailwind v4. Replaces the old tailwindcss PostCSS plugin. | HIGH |

### Drag-and-Drop (Hero Feature)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @dnd-kit/react | 0.3.x | Drag-and-drop scheduling grid | Modern, lightweight, highly customizable DnD toolkit. The rewrite (@dnd-kit/react) is the current recommended package. Supports sortable lists, grid layouts, and custom drag overlays needed for the schedule builder. | MEDIUM |

**Note on @dnd-kit/react:** Version 0.3.x is pre-1.0 but actively maintained and recommended over the older @dnd-kit/core package. The API is new and may have breaking changes. If stability is a concern, fall back to @dnd-kit/core + @dnd-kit/sortable (mature, stable API). For a demo app, the newer package is fine.

**Alternative considered:** Custom HTML5 drag-and-drop. Rejected because accessibility, touch support, and smooth animations would need to be built from scratch. dnd-kit gives this for free.

### Charts & Data Visualization

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Recharts | 3.8.x | Labor cost charts, budget vs actual, trends | Most popular React chart library (3.6M+ weekly downloads). Declarative, composable, SVG-based. shadcn/ui has built-in chart components that wrap Recharts. | HIGH |

**Key insight:** shadcn/ui includes a Chart component that wraps Recharts with consistent theming. Use `npx shadcn@latest add chart` instead of configuring Recharts manually. This gives you themed bar charts, line charts, and area charts out of the box.

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| date-fns | 4.1.x | Date manipulation | Schedule calculations, week navigation, time formatting. Tree-shakeable, no moment.js bloat. v4 has first-class timezone support. | HIGH |
| zod | 4.3.x | Schema validation | Form validation, API input validation, Drizzle schema validators. Pairs with Server Actions for type-safe mutations. | HIGH |
| bcryptjs | 2.4.x | Password hashing | Hashing demo account passwords. Pure JS implementation (no native bindings) works in all environments including Edge. | HIGH |
| lucide-react | latest | Icons | Default icon library for shadcn/ui. Consistent, tree-shakeable SVG icons. | HIGH |
| clsx + tailwind-merge | latest | Class merging | Already included with shadcn/ui init (the `cn()` utility). | HIGH |
| nuqs | latest | URL state management | Managing week navigation, filters, and view state in URL params. Type-safe search params for Next.js App Router. | MEDIUM |

### Dev Dependencies

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| drizzle-kit | latest | DB migrations & schema push | HIGH |
| @types/bcryptjs | latest | TypeScript types for bcryptjs | HIGH |
| dotenv | latest | Environment variable loading for scripts | HIGH |

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| Prisma | Heavier than Drizzle, slower cold starts on serverless, generates a client that adds bundle size. Drizzle is prescribed and better suited. |
| react-beautiful-dnd | Deprecated/unmaintained. Use dnd-kit instead. |
| moment.js | Massive bundle, mutable API. date-fns is tree-shakeable and immutable. |
| dayjs | Acceptable but date-fns v4 has timezone support now, and date-fns is more idiomatic in the React ecosystem. |
| react-big-calendar | Too opinionated for this use case. The schedule grid is rows=employees, columns=days -- a custom grid, not a traditional calendar. Building custom with dnd-kit gives full control. |
| FullCalendar | Same issue as react-big-calendar. Wrong paradigm for employee x day grid. Also has licensing costs for premium features. |
| Zustand/Redux | Unnecessary. React Server Components + Server Actions + React state (useState/useReducer) handle all state needs. The real-time cost meter can use local state derived from shift data. |
| tRPC | Overkill for this app. Server Actions provide type-safe mutations. Route Handlers for any REST-like endpoints. |
| Socket.io/WebSockets | Not needed. "Real-time" labor cost updates are client-side calculations as shifts are dragged, not server-pushed data. Optimistic UI with Server Actions handles persistence. |
| Tailwind CSS v3 | v4 is stable and shadcn/ui CLI v4 initializes projects with Tailwind v4 by default. No reason to use v3. |

## Installation

```bash
# Initialize Next.js 16 project
npx create-next-app@latest shiftwise --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Database: Drizzle + Neon
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit dotenv

# Auth
npm install next-auth@beta

# Drag and Drop
npm install @dnd-kit/react

# Charts (via shadcn -- adds recharts automatically)
npx shadcn@latest add chart

# Utilities
npm install date-fns zod bcryptjs
npm install -D @types/bcryptjs

# shadcn/ui init (adds Tailwind v4 config, cn utility, base components)
npx shadcn@latest init

# Core shadcn components needed
npx shadcn@latest add button card dialog dropdown-menu input label select table tabs badge avatar separator sheet toast sonner
```

## Environment Variables

```env
# Neon PostgreSQL (from Vercel integration)
DATABASE_URL=postgresql://...@...neon.tech/shiftwise?sslmode=require

# NextAuth
AUTH_SECRET=generated-secret-here
AUTH_URL=https://shiftwise.demos.fonnit.com

# App
NEXT_PUBLIC_APP_URL=https://shiftwise.demos.fonnit.com
```

## Key Architecture Decisions

### Why Drizzle over Prisma for this project
1. **Bundle size:** Drizzle adds ~30KB vs Prisma's ~300KB+ generated client
2. **Serverless cold starts:** No binary engine to load (Prisma uses a Rust query engine)
3. **SQL familiarity:** Drizzle's API mirrors SQL, making complex schedule queries natural
4. **Neon integration:** First-class support via @neondatabase/serverless driver

### Why custom grid over calendar libraries
The schedule builder is an employee-by-day grid, not a traditional calendar. Calendar libraries (FullCalendar, react-big-calendar) assume time-slot views, event overlaps, and month/week/day toggling. The ShiftWise grid is fundamentally a table where rows are employees and cells are shift assignments. Building this with a grid layout + dnd-kit gives:
- Full control over the visual design (LinkedIn showcase quality)
- Simpler mental model (it is a table, not a calendar)
- Better integration with the real-time cost meter sidebar

### Why client-side cost calculation, not server-pushed
The "real-time labor cost meter" updates as shifts are dragged. This is purely client-side:
1. Load all employees with rates
2. As shifts are added/moved in the UI, recalculate total hours x rates
3. Display in sidebar
4. Persist to server via Server Actions on drop

No WebSockets needed. The "real-time" is a UI computation, not a server event stream.

## Compatibility Matrix

| Component | Compatible With | Verified |
|-----------|----------------|----------|
| Next.js 16.2 | React 19, Tailwind v4 | YES |
| shadcn/ui CLI v4 | Tailwind v4, React 19 | YES |
| Drizzle 0.45.x | @neondatabase/serverless 1.0.x | YES |
| next-auth v5 beta | Next.js 16 App Router | YES |
| @dnd-kit/react 0.3.x | React 19 | YES (designed for React 19) |
| Recharts 3.8.x | React 19 | YES |
| date-fns 4.1.x | - | YES (no React dependency) |
| zod 4.3.x | - | YES (no React dependency) |

## Sources

- [Next.js 16.2 blog post](https://nextjs.org/blog/next-16-1) -- HIGH confidence
- [Drizzle ORM npm](https://www.npmjs.com/package/drizzle-orm) -- HIGH confidence
- [Neon Drizzle guide](https://neon.com/docs/guides/drizzle) -- HIGH confidence
- [next-auth npm](https://www.npmjs.com/package/next-auth) -- MEDIUM confidence (beta)
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) -- HIGH confidence
- [shadcn/ui Next.js installation](https://ui.shadcn.com/docs/installation/next) -- HIGH confidence
- [dnd-kit npm](https://www.npmjs.com/package/@dnd-kit/react) -- MEDIUM confidence (pre-1.0)
- [Recharts npm](https://www.npmjs.com/package/recharts) -- HIGH confidence
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4) -- HIGH confidence
- [date-fns npm](https://www.npmjs.com/package/date-fns) -- HIGH confidence
- [zod npm](https://www.npmjs.com/package/zod) -- HIGH confidence
