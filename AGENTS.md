<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# TUR / Traytio — Agent Reference

## Stack

- **Framework**: Next.js 16 (beta, see above), Turbopack, App Router
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`), `tw-animate-css`, shadcn/ui `base-nova`
- **State**: Zustand + TanStack React Query
- **Auth**: Clerk (`src/proxy.ts` is the middleware — not `middleware.ts`)
- **DB**: PostgreSQL (Supabase) + Prisma 7, adapter `@prisma/adapter-pg` with manual `pg.Pool`
- **UI Primitives**: `@base-ui/react` (not Radix — buttons, dialogs, selects, tooltips, switches, progress, avatars, sidebar)
- **Animation**: Framer Motion, GSAP, Lenis (marketing scroll), Embla (carousels)
- **Design System**: `DESIGN.md` at root — the single source of truth for all UI decisions

## Architecture

| Area | Path | Notes |
|------|------|-------|
| App routes | `src/app/` | App Router |
| Prisma schema | `src/prisma/schema.prisma` | Not root `prisma/` |
| Prisma client | `src/generated/prisma` | Gitignored, run `prisma:generate` |
| Prisma config | `prisma.config.ts` | Custom config file |
| Middleware | `src/proxy.ts` | Clerk protection, NOT `middleware.ts` |
| Design tokens | `src/lib/design-tokens.ts` + CSS vars in `globals.css` |
| Component UI | `src/components/ui/` | shadcn components (base-nova style) |
| Features | `src/features/` | Domain modules (19: ai, analytics, invoices, etc.) |
| Permissions | `src/lib/permissions.ts` | Module + action → OrgRole RBAC |
| Email templates | `src/emails/` | React Email (`@react-email/components`) |
| Providers | `src/providers/` | `QueryProvider` wraps children |
| Dashboard | `src/app/dashboard/` | Layout uses `TopBar` + optional `SidebarProvider` |
| Marketing site | `src/components/site/` | Navbar, Hero, Features, Pricing, etc. |

## Commands

```bash
npm run dev                  # dev server (Turbopack)
npm run build                # production build (passes with 273 lint issues)
npm run lint                 # ESLint (core-web-vitals + typescript)
npm run prisma:generate      # Generate Prisma client → src/generated/prisma/
npm run prisma:migrate       # Run migrations (uses DIRECT_URL, not DATABASE_URL)
npm run test:e2e             # Playwright (config expected at tests/e2e/playwright.config.ts)
npm run test:e2e:ui          # Playwright UI mode
```

## Design Skills (from Leonxlnx/taste-skill)

13 skills in `skills/`, synced to `.opencode/skills/` and `.agents/skills/`.

**Primary**: `stitch-design-taste` — drives `DESIGN.md` generation. Load `SKILL.md` first before generating/editing design system docs.

## Quirks & Conventions

- **Currency**: MAD (Moroccan Dirham) — `fr-MA` locale, `formatCurrency` in `src/lib/utils.ts`
- **RBAC**: `OWNER` > `ADMIN` > `MEMBER` (see `src/lib/permissions.ts`)
- **shadcn style**: `base-nova` (not `new-york` or `default`)
- **Brand color**: Gold `#C9A96E` — primary accent, focus rings, CTAs, chart lines
- **Fonts**: headings `Cormorant Garamond` (serif), body `DM Sans` (sans-serif)
- **ESLint**: 273 issues documented in `tests/e2e/ESLINT-AUDIT.md` — build passes clean, TS zero errors. Prioritize fixes: `no-explicit-any` (130 errors) deferred, `no-unused-vars` (52 warnings) medium
- **Prisma**: Uses `@prisma/adapter-pg` with manual `pg.Pool` — not datasource URL in schema. Connection strings: DATABASE_URL via Supabase pooler (port 6543, `?pgbouncer=true`), DIRECT_URL for migrations (port 5432)
- **Clerk**: Middleware at `src/proxy.ts` protects `/dashboard(.*)` and `/api/((?!webhooks).*)`. Sign-in redirects handled via env vars
- **Resend**: Falls back to `onboarding@resend.dev` in dev if `RESEND_FROM_EMAIL` unset (logged as warning)
- **Generated code**: `/src/generated/prisma/` — after `prisma:generate`. Must exist for build to work
- **next.config.ts**: Uses `turbopack` — no webpack plugin workarounds needed unless explicitly required
- **Path alias**: `@/` → `./src/*`
- **CSS**: Tailwind v4 `@import` syntax with `@theme inline`, `@custom-variant`, `@layer` directives. No `tailwind.config.js`
- **shadcn registry**: `components.json` sets `"style": "base-nova"`, `"iconLibrary": "lucide"`

## When building UI

1. **Always read `DESIGN.md` first** — it is the single source of truth for this project
2. Load `skills/stitch-design-taste/SKILL.md` for design system generation rules
3. Use `globals.css` CSS vars (`--gold`, `--charcoal`, `--champagne` palette) and `design-tokens.ts`
4. Prefer `@/` path alias (maps to `src/`)
5. Check `src/features/` before creating new domain components — module boundaries exist
6. Use `@base-ui/react` primitives (not Raw Radix) for buttons, dialogs, selects, tooltips, etc.
7. Icons from `lucide-react` only — size standard: `size-4` (16px) for inline
8. Framer Motion for animation, not manual CSS keyframes (except loading shimmer)
9. Marketing pages use Lenis smooth scroll; dashboard uses native scroll
10. Gold focus ring (`ring-ring/50`) on all interactive elements — never browser default outline
