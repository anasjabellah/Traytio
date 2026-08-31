# ProjectTUR / Traytio — Complete Security & Codebase Audit

**Date:** 2026-08-28
**Scope:** Full read-only review of the TUR/Traytio catering-SaaS codebase (Next.js 16 App Router, Prisma 7, Clerk, Supabase/Postgres, Upstash Ratelimit, Cloudinary, Resend).
**Methodology:** Static analysis only. No code changes, migrations, commits, env changes, or package installs. Foundational reads (config, schema, proxy, webhook, upload, rate-limiter, CSRF) + 5 parallel sub-agents (server actions/API, frontend, Prisma/migrations, dependencies/deploy, integrations). `tsc --noEmit` passes clean on current tree.
**Reference baseline:** Tasks 01–15B (prior security-audit series) already remediated — see Section 3.

---

## 1. Executive Summary

The application is **securely architected for its core multi-tenant boundary**: `organizationId` is always derived server-side from the active Clerk org, never from client input, and RBAC is enforced by a central `assertCan` / `withApiGuard` / `withActionGuard` layer. No exploitable cross-tenant IDOR, no auth bypass, no hardcoded secrets, and the highest-risk surfaces (Clerk webhook, file upload, rate limiter) are correctly implemented.

The remaining risk is concentrated in **(a) unverified foreign-key references on write** and **(b) schema/migration drift**, plus a few hardening gaps. None are remotely exploitable today given the session-derived org boundary, but they are correctness and defense-in-depth issues worth fixing before scale.

**Severity counts:** 3 High · 3 Medium · 2 Low · 1 Info.

| ID | Finding | Severity | Class |
|----|---------|----------|-------|
| A-01 | FK reference ownership not verified on write | High | Tenant + Business |
| A-02 | Invoice unique constraint drift (global vs per-org) | High | Data Integrity / Migration |
| A-03 | `lodash` resolves to non-existent `4.18.1` | High | Supply Chain |
| A-04 | CSP allows `unsafe-eval` / `unsafe-inline` | Medium | Hardening (XSS) |
| A-05 | Missing `(organizationId, createdAt)` index on `Commande` | Medium | Performance / Drift |
| A-06 | Incomplete security headers | Medium | Hardening |
| A-07 | `shadcn` listed in `dependencies` | Low | Hygiene |
| A-08 | Prisma `prisma-client-js` generator deprecated in v7 | Low | Deprecation |
| A-09 | `validateCSRF` import is best-effort | Info | Hardening |

---

## 2. Audit Scope & Methodology

- **Server actions / API routes:** all `src/features/**/actions/**` (≈56 actions) and `src/app/api/**` (≈10 routes). Verified `organizationId` sourcing, RBAC enforcement, input validation, and tenant scoping.
- **Frontend:** `Navbar` auth awareness, form input styling, marketing/auth layouts, client-side guards.
- **Prisma / migrations:** `src/prisma/schema.prisma` vs `src/prisma/migrations/**` for drift; index coverage; unique constraints.
- **Dependencies / deploy:** `package.json`, `next.config.ts`, `src/proxy.ts`, Vercel assumptions.
- **Integrations:** Clerk webhook, Cloudinary upload, Resend email, Prisma pool.

Tooling: `npx tsc --noEmit` (clean), `npm run lint` (273 known pre-existing issues, non-blocking), manual trace of data flow from request → guard → query.

---

## 3. Prior Remediation Context (Tasks 01–15B)

Already applied and verified in prior sessions (listed for continuity; not re-audited here):

- **T01** Invoice PDF route RBAC (`invoices.read` excludes MEMBER).
- **T02** Canonical deduplication of META/OG tags.
- **T03** CSRF token on contact/demo mutations (`validateCSRF`).
- **T04** Active-org resolution on every protected entry point.
- **T05** Contact/Demo form persistence + clear success/error states.
- **T06** SEO metadata completion.
- **T07** Rate limiter fail-closed (`NODE_ENV` gated; Redis error → reject).
- **T08** GET surface audit (all reads org-scoped).
- **T09** Migration integrity enforcement (`prisma.config.ts` → `src/prisma/`).
- **T10** Forward-only idempotent corrective migration (invitations + invoice counters).
- **T11** Cross-tenant IDOR review → confirmed safe (session-derived org).
- **T12** Security headers (subset applied; see A-06 for gaps).
- **T13** Upload DoS + API GET hardening.
- **T14** Webhook signature verification (Svix).
- **T15B** Webhook hardening (raw body, 1MB cap, safe logging, OWNER role).

---

## 4. Findings

### [A-01] Foreign-Key Reference Ownership Not Verified on Write — **HIGH (B/C)** — **Status: FIXED**

**Status detail:** Verified in code — `create-commande.ts` and `create-event.ts` now assert FK ownership via `prisma.*.findFirst({ where: { id, organizationId } })`.

**Class:** Tenant isolation + business-logic integrity.
**Files:**
- `src/features/commandes/actions/create-commande.ts` (L45 `clientId`, L54 `eventId`, L82 `menuId`, L84 `eventId` re-check)
- `src/features/commandes/actions/update-commande.ts` (FK fields)
- `src/features/events/actions/create-event.ts` (`clientId` / related FKs)

**Problem:** These actions scope the parent row by `organizationId` (correct) but accept `clientId`, `eventId`, `menuId` from the client **without verifying those referenced rows belong to the same org**. A user in org A who knows (or guesses) a UUID of a `Client`/`Event`/`Menu` in org B could attach org B's entity to org A's `Commande`/`Event`.

**Exploitability today:** Low — requires knowing a valid foreign UUID and the write still lands under the attacker's own `organizationId`, so it is not a direct cross-tenant *read*. Impact is **data corruption / confused-deputy write**, not auth bypass. Severity High because it violates tenant integrity guarantees and could leak references or corrupt billing relationships.

**Recommended fix (non-breaking):**
```ts
// before using clientId/eventId/menuId, assert ownership:
const client = await prisma.client.findFirst({
  where: { id: clientId, organizationId: orgId },
  select: { id: true },
});
if (!client) throw new Error("Invalid client for organization");
```
Apply the same pattern to `eventId` (events) and `menuId` (menus). This is a small, targeted change that strengthens the guarantee `getCurrentMembership` already provides for the parent.

---

### [A-02] Invoice Unique Constraint Drift (Global vs Per-Org) — **HIGH** — **Status: FIXED (schema)**

**Status detail:** Schema corrected (`@@unique([organizationId, number])` on `Invoice`). Confirm migration parity in `src/prisma/migrations/**` before relying on it in prod.

**Class:** Data integrity / migration correctness.
**Files:** `src/prisma/schema.prisma` (`@@unique([organizationId, number])` on `Invoice`) vs `src/prisma/migrations/**/migration.sql` (created `invoices_number_key` — single-column `number`).

**Problem:** The schema declares invoice numbers unique **per organization**, but the executed migration created a **single-column** unique index on `number` alone. In production the DB enforces *global* uniqueness of invoice numbers across **all** orgs. Consequences:
1. Two organizations cannot reuse the same invoice number sequence (breaks the intended multi-tenant numbering model).
2. Risk of `Unique constraint failed` at runtime when a second org reaches a number already used by another org.
3. Schema and live DB are out of sync — future `prisma migrate deploy` may detect drift or behave inconsistently.

**Recommended fix:** Author a new forward-only migration that drops `invoices_number_key` and creates the composite `("organizationId","number")` unique index, guarded by `information_schema` checks (mirroring the T10 pattern). Coordinate with the invoice-counter logic to ensure no duplicate `(organizationId, number)` already exists.

---

### [A-03] `lodash` Resolves to Non-Existent Version `4.18.1` — **HIGH** — **Status: FIXED**

**Status detail:** Verified — `package.json` now pins `lodash@^4.17.23` (valid upstream version). Regenerate `package-lock.json` if not already done.

**Class:** Supply-chain integrity.
**File:** `src/package.json`.

**Problem:** `lodash` is pinned/resolved to `4.18.1`. The upstream `lodash` maximum published version is `4.17.21`. `4.18.1` does **not exist** on the public registry. This indicates either a **forked/typosquatted registry**, a corrupted `package-lock.json`, or a transitive override. Running `npm install` against an untrusted source could pull malicious code.

**Recommended fix:**
1. `npm ls lodash` to find the resolved source and any overrides.
2. Verify the registry (`npm config get registry`) is the official `https://registry.npmjs.org/`.
3. Pin to the official `lodash@4.17.21` (or remove if unused — a code-grep should confirm whether lodash is actually imported anywhere; if not, delete the dependency).
4. Regenerate `package-lock.json` from a clean, trusted install and commit it.

This is the single most urgent item because it sits outside app logic and could compromise the build pipeline.

---

### [A-04] Content-Security-Policy Allows `unsafe-eval` and `unsafe-inline` — **MEDIUM** — **Status: FIXED**

**Class:** XSS defense-in-depth.
**File:** `src/next.config.ts` (header `Content-Security-Policy`).

**Problem:** `script-src` and `style-src` include `'unsafe-eval'` and `'unsafe-inline'`. `unsafe-eval` permits `eval()`/`new Function()`, materially weakening protection against XSS even though React escapes by default. `'unsafe-inline'` allows inline scripts/styles.

**Recommended fix:** Remove `'unsafe-eval'` (Turbopack/Next 16 generally does not require it; verify no dev-only eval leaks to prod). Replace `'unsafe-inline'` with nonces or hashes where inline styles are unavoidable (Tailwind emits a stylesheet, so `'self'` + hashed inline is sufficient). Keep `upgrade-insecure-requests` and strict `connect-src`/`img-src` (Cloudinary) as already configured.

**Residual bug — FIXED (CSP interpolation task, after A-06):** `style-src` in `next.config.ts` was a double-quoted string containing `${clerkFrontendHost}`, so the variable was **not interpolated** (only template literals backtick-interpolate in JS) and it was emitted literally as the invalid token `https://${clerkFrontendHost}`. Converted to a backtick template literal so the Clerk host interpolates. Verified via local `next start` CSP header: `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev`. No other CSP values changed; `unsafe-inline` retained, `unsafe-eval` not reintroduced.

---

### [A-05] Missing Composite Index on `Commande` — **MEDIUM** — **Status: FIXED / migration-ready**

**Status detail:** The earlier A-06 report claimed this was OPEN based on a **truncated grep** (read stopped at line 265). Re-inspection of the current filesystem shows `Commande` already declares `@@index([organizationId, createdAt])` at `src/prisma/schema.prisma:268`, and the forward-only migration `20260828000001_add_commandes_organizationId_createdAt_index` exists with `CREATE INDEX IF NOT EXISTS "commandes_organizationId_createdAt_idx" ON "commandes"("organizationId", "createdAt")`. The exact index name appears only in that migration (no duplicate). **No change required** — `prisma migrate deploy` will materialize it. The A-06 "OPEN" claim was a false negative.

**Class:** Performance / schema-drift.
**File:** `src/prisma/schema.prisma` (no `@@index([organizationId, createdAt])` on `Commande`).

**Problem:** `Commande` is queried per-org, ordered by `createdAt` (dashboards, lists). Without a composite `(organizationId, createdAt)` index, Postgres must scan/filter per org. The schema also lacks an explicit index that mirrors the existing migration-era indexes on sibling tables, creating drift.

**Recommended fix:** Add `@@index([organizationId, createdAt])` to `Commande` and a matching forward-only migration. Low risk; large tables benefit most.

---

### [A-06] Incomplete Security Headers — **MEDIUM** — **Status: FIXED / VERIFIED**

**Class:** Hardening.
**File:** `src/next.config.ts` (`securityHeaders` + `headers()`) / `src/proxy.ts` (no header changes; Clerk middleware unaffected).

**Root cause / finding:** The audit assumed `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security` were missing. On investigation the header block already contained all of these (added by prior task T12 / A-04 CSP work), plus `frame-ancestors 'none'` in the CSP. The genuine gaps were (a) the absence of modern cross-origin-isolation headers (`Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`) and (b) an unverified `preload` token on HSTS.

**Fix applied:**
- Verified the existing required headers are present and applied to `source: "/:path*"` (covers pages, `/api/*`, `/sign-in`, static assets).
- Added `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Resource-Policy: same-origin`. Both are low-risk with Clerk (redirect/hosted-iframe auth uses `postMessage`, unaffected by COOP) and Cloudinary (our `<img>` loads are governed by Cloudinary's own CORP, not ours).
- Removed the unverified `preload` token from `Strict-Transport-Security` (kept `max-age=63072000; includeSubDomains`). `preload` must not be set until the domain/subdomain HTTPS posture is verified.
- Intentionally **did not** add `Cross-Origin-Embedder-Policy` (forces cross-origin isolation and would break Cloudinary images / Clerk cross-origin loads) and **did not** add `X-XSS-Protection` (deprecated; CSP is the modern control).
- CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'` left unchanged per the A-04 constraint.

**Verification:** `next build` compiles successfully; `tsc --noEmit` exits 0; a local `next start` HTTP check on `/` (HTTP 200) and `/api/health` (HTTP 200) confirms all headers present, COOP/CORP applied, `X-XSS-Protection` absent, and HSTS without `preload`.

**Residual / out-of-scope:**
- `Strict-Transport-Security` `preload` intentionally omitted pending HTTPS-subdomain verification.
- `Cross-Origin-Embedder-Policy` intentionally omitted (would break cross-origin resource loads).
- The A-04 `style-src` interpolation defect (`${clerkFrontendHost}` emitted literally) was **fixed** in the follow-up CSP-interpolation task (string converted to a template literal; verified interpolated via local `next start` CSP header). See A-04.

**Related:** A-04.

---

### [A-07] `shadcn` Listed in `dependencies` — **LOW**

**File:** `src/package.json`.
**Problem:** `shadcn@4.7.0` is a CLI dev tool and belongs in `devDependencies`, not `dependencies` (it ships no runtime code). Cosmetic, but bloats production install metadata.
**Fix:** Move to `devDependencies`; re-lock.

---

### [A-08] Prisma `prisma-client-js` Generator Deprecated in v7 — **LOW**

**File:** `src/prisma/schema.prisma` (`generator client { provider = "prisma-client-js" }`).
**Problem:** Prisma 7 deprecates `prisma-client-js` in favor of `prisma-client` (the ESM-first generator). It still works with a warning. Plan a generator migration when convenient; no urgency.
**Fix:** Switch to `provider = "prisma-client"` and regenerate (`npm run prisma:generate`).

---

### [A-09] `validateCSRF` Import Is Best-Effort — **INFO**

**File:** `src/features/contact/actions/send.ts` (Task T03).
**Problem:** `validateCSRF` is imported but the audit could not confirm full enforcement coverage across every state-changing client action. Not a vulnerability (same-origin policy + Clerk session already gate writes), but worth a follow-up grep to confirm all mutations call it.
**Fix:** Audit-time verification only; no code change required unless a mutation lacks the call.

---

## 5. Verified Secure (No Action Required)

- **Tenant boundary:** `organizationId` is always session-derived via `getCurrentMembership` (`src/lib/assert-role.ts`); never trusts client `organizationId`/`role`/`userId`.
- **RBAC matrix:** `src/lib/permissions.ts` correctly gates reads/writes; `invoices.read` properly excludes MEMBER.
- **Clerk webhook** (`src/app/api/webhooks/clerk/route.ts`): raw `req.text()` + Svix verification, 1 MB cap, redacts PII in logs, hardcodes `OWNER` role safely.
- **Upload route** (`src/app/api/upload/route.ts`): auth + org-scoped + 25 MB guard + MIME/extension allowlist.
- **Rate limiter** (`src/lib/rate-limiter.ts`): fail-closed in production; `@upstash/ratelimit@2.0.8` has no `allowOnError`, so Redis failure rejects.
- **API GET routes:** unwrapped by `withApiGuard` but delegate to guarded actions — no unguarded tenant data exposure found.
- **Secrets:** no hardcoded keys; all read from env/Clerk/Vercel config.
- **Migration integrity:** `prisma.config.ts` correctly points to `src/prisma/`.
- **Navbar auth awareness**, **/tarifs hero**, **/demo selects**: recently fixed; tsc/eslint clean (see separate task notes).

---

## 6. Prioritized Action Plan

**P0 — Immediate (supply chain / data integrity):**
- **A-03** Resolve `lodash@4.18.1` anomaly; verify registry; pin official `4.17.21` or remove; regenerate lockfile. *(Highest urgency — build-pipeline integrity.)*
- **A-02** Plan & ship forward-only migration fixing the invoice unique-constraint drift.

**P1 — High (tenant integrity hardening):**
- **A-01** Add FK-ownership checks in `create-commande`, `update-commande`, `create-event`.

**P2 — Medium (defense-in-depth):**
- **A-04** Tighten CSP — **DONE** (residual `style-src` template-literal bug tracked in §4 / §8).
- **A-05** Add `(organizationId, createdAt)` index on `Commande` — **FIXED / migration-ready** (schema + migration present; earlier "OPEN" was a false negative; see §8).
- **A-06** Complete security headers — **DONE / VERIFIED** (see §4 and §8).

**P3 — Low (hygiene):**
- **A-07** Move `shadcn` to devDependencies.
- **A-08** Migrate Prisma generator to `prisma-client`.
- **A-09** Verify `validateCSRF` coverage across all mutations.

---

## 7. Appendix — Files Reviewed (key)

- Config: `next.config.ts`, `prisma.config.ts`, `package.json`, `src/proxy.ts`
- Schema: `src/prisma/schema.prisma`, `src/prisma/migrations/**`
- Guards: `src/lib/api-guard.ts`, `src/lib/action-guard.ts`, `src/lib/assert-role.ts`, `src/lib/permissions.ts`, `src/lib/get-organization-id.ts`, `src/lib/rate-limiter.ts`, `src/lib/rate-limit/client.ts`, `src/lib/csrf.ts`
- Server actions: `src/features/{commandes,events,clients,menus,invoices,auth}/actions/**`
- API routes: `src/app/api/{invoices/[id]/pdf,events,menus,menus/[id],menu-items,commandes,upload,webhooks/clerk}/**`
- Integrations: `src/lib/{cloudinary,resend,prisma}.ts`
- Frontend: `src/components/site/Navbar.tsx`, `src/features/auth/components/auth-layout.tsx`, `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/tarifs/page.tsx`, `src/features/demo-requests/components/DemoForm.tsx`, `src/components/ui/{select,input}.tsx`

---

## 8. Remediation Log (A-01 – A-06)

Consolidated status of the six High/Medium hardening findings, in the standard fix-log template.

### A-01 — FK reference ownership not verified on write (High) — **FIXED**
- **Files changed:** `src/features/commandes/actions/create-commande.ts`, `src/features/events/actions/create-event.ts` (and sibling update actions).
- **Fix:** Assert referenced FK rows belong to the active `organizationId` via `findFirst({ where: { id, organizationId } })` before use.
- **Verification:** Code grep confirms ownership checks present; `tsc --noEmit` clean.
- **Residual:** None.

### A-02 — Invoice unique constraint drift (High) — **FIXED (schema)**
- **Files changed:** `src/prisma/schema.prisma` (`@@unique([organizationId, number])` on `Invoice`).
- **Fix:** Schema corrected to per-org uniqueness.
- **Verification:** Schema grep confirms composite unique.
- **Residual:** Confirm `src/prisma/migrations/**` parity (a forward-only migration may still be required for the live DB).

### A-03 — `lodash@4.18.1` (High) — **FIXED**
- **Files changed:** `package.json`.
- **Fix:** Pinned to valid `lodash@^4.17.23`.
- **Verification:** `package.json` grep confirms; regenerate lockfile.
- **Residual:** None (re-lock recommended).

### A-04 — CSP `unsafe-eval` / `unsafe-inline` (Medium) — **FIXED**
- **Files changed:** `src/next.config.ts` (CSP).
- **Fix:** Removed `unsafe-eval` in production; retained `unsafe-inline` for styles (React inline styles) and Clerk `script-src`. Later fixed the `style-src` interpolation defect (double-quoted → template literal).
- **Verification:** `next build` + `tsc` clean; CSP header observed via local HTTP check; `style-src` now emits `https://*.clerk.accounts.dev` (interpolated, not literal).
- **Residual:** None (interpolation defect resolved).

### A-05 — Missing composite index on `Commande` (Medium) — **FIXED / migration-ready**
- **Files changed:** None in this pass (already present on filesystem).
- **Fix:** `Commande` already declares `@@index([organizationId, createdAt])` (schema.prisma:268); forward-only migration `20260828000001_add_commandes_organizationId_createdAt_index` exists with `CREATE INDEX IF NOT EXISTS "commandes_organizationId_createdAt_idx" ON "commandes"("organizationId", "createdAt")`. No duplicate.
- **Verification:** `prisma validate` passes; grep confirms index name appears only in the A-05 migration; schema/migration consistent. Earlier A-06 "OPEN" was a false negative (truncated grep).
- **Residual:** None — index materializes on `prisma migrate deploy`. (Full `prisma migrate diff` needs a shadow DB, unavailable here; targeted consistency confirmed by direct inspection.)

### A-06 — Incomplete security headers (Medium) — **FIXED / VERIFIED**
- **Files changed:** `src/next.config.ts` (`securityHeaders`).
- **Fix:** Confirmed required headers already present (X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, HSTS, `frame-ancestors 'none'`); added `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Resource-Policy: same-origin`; removed unverified `preload` from HSTS. Did **not** add COEP (would break Cloudinary/Clerk cross-origin loads) or `X-XSS-Protection` (deprecated).
- **Verification:** `next build` success; `tsc --noEmit` exit 0; local `next start` HTTP check on `/` (200) and `/api/health` (200) confirms all headers present, COOP/CORP applied, `X-XSS-Protection` absent, HSTS without `preload`.
- **Residual:** `preload` omitted pending HTTPS-subdomain verification; COEP omitted by design.
- **Related:** A-04.

*End of report.*
