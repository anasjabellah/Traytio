# ESLint Remediation Audit

**Date:** 2026-06-12
**Total issues:** 273 (201 errors, 72 warnings)
**Affected files:** 114 / 225 linted
**Build status:** `npm run build` passes cleanly
**TypeScript:** Zero compilation errors

---

## Category Breakdown

### 1. `@typescript-eslint/no-explicit-any` — 130 errors

| Metric | Value |
|---|---|
| Errors | 130 |
| Warnings | 0 |
| Severity | **Error** |
| Affected files | ~76 files |
| Hotspots | `create-menu-dialog.tsx` (7), `menus/page.tsx` (7), `edit-menu-dialog.tsx` (6), `menu-items/page.tsx` (5), server actions (25+ files) |

**Effort:** Large (130 sites across 76 files)
**Risk:** Very low — these are all type-pragmatic `any` annotations that work correctly at runtime. Changing types could break the build if the correct type is complex.
**Strategy:** Fix in bulk with `eslint --fix` rule suppression comments (`// eslint-disable-next-line @typescript-eslint/no-explicit-any`) — do NOT attempt to type them all correctly now. For high-value files (pages, dialogs), gradually replace with `unknown` + casts or proper Zod-inferred types.
**Priority:** Low (cosmetic, high count, zero runtime impact)

---

### 2. `@typescript-eslint/no-unused-vars` — 52 warnings

| Metric | Value |
|---|---|
| Errors | 0 |
| Warnings | 52 |
| Severity | **Warning** |
| Affected files | ~29 files |
| Hotspots | `menus/page.tsx` (8), `menu-items/page.tsx` (4), `menu-item-form.tsx` (3), `menus-detail-view.tsx` (3), `menu-form.tsx` (3), `EventsGrid.tsx` (3), `use-events-stats.ts` (3) |

**Effort:** Medium (52 sites, but most are trivial: unused imports, destructured params, or variables)
**Risk:** Low — removing unused vars has no behavioral effect. However, some may be intentionally destructured for future use or for pattern matching (e.g., `_` prefix convention).
**Strategy:** (a) Remove unused imports/vars in bulk. (b) For intentionally kept vars, prefix with `_` to signal intent. (c) Use `eslint --fix` for the automatic removals. High-value targets: `menus/page.tsx`, `menu-items/page.tsx`.
**Priority:** Medium (cleans up code, zero risk if done file-by-file)

---

### 3. `react/no-unescaped-entities` — 37 errors

| Metric | Value |
|---|---|
| Errors | 37 |
| Warnings | 0 |
| Severity | **Error** |
| Affected files | ~22 files |
| Hotspots | `nouvelle-commande-client.tsx` (4), `event-form.tsx` (3), `FinalCTA.tsx` (3), `DashboardSidebar.tsx` (2), `delete-event-dialog.tsx` (2), `Hero.tsx` (2), `Testimonials.tsx` (2) |

**Effort:** Trivial (37 sites, one-character fix each)
**Risk:** None — purely mechanical replacement of `'` → `&apos;` and `"` → `&quot;` or `&ldquo;`/`&rdquo;`
**Strategy:** Auto-fix with `eslint --rule 'react/no-unescaped-entities: ["error", { "forbid": [">", "}", "\"", "'", "}"] }]' --fix`. Manually review French text (apostrophes in `l'événement`, `d'`, etc.) to ensure correct entity usage. Bulk regex: replace `'([A-Za-z])` with `&apos;$1` in JSX text content.
**Priority:** Very high (37 errors fixed in minutes, zero behavioral change)

---

### 4. `react-hooks/exhaustive-deps` — 9 warnings

| Metric | Value |
|---|---|
| Errors | 0 |
| Warnings | 9 |
| Severity | **Warning** |
| Affected files | 9 files (one per file) |
| Hotspots | `menu-toolbar.tsx`, `menu-item-toolbar.tsx`, `use-magnetic.ts`, `menus-table.tsx`, `event-toolbar.tsx`, `clients-toolbar.tsx`, `client-form.tsx`, `nouvelle-commande-client.tsx`, `edit-client-sheet.tsx` |

**Effort:** Medium (9 sites, each requires understanding the intended dependency array)
**Risk:** Moderate — blindly adding deps can cause infinite loops or unnecessary re-renders. Missing deps can cause stale closures.
**Strategy:** Audit each site manually:
- **Toolbars** (`*toolbar.tsx`): Likely missing stable callback deps — add them, no infinite-loop risk since callbacks use `useCallback`.
- **`use-magnetic.ts`**: Animation hook — missing deps could break animation. Add deps carefully.
- **`client-form.tsx`**: Likely the `defaultValues` render-loop fix — may already be correct but lint disagrees.
- **`edit-client-sheet.tsx`**: Same pattern.
**Priority:** Medium (behaviorally correct today, risk only during future maintenance)

---

### 5. `@next/next/no-img-element` — 7 warnings

| Metric | Value |
|---|---|
| Errors | 0 |
| Warnings | 7 |
| Severity | **Warning** |
| Affected files | 7 files |
| Hotspots | `menu-item-form.tsx`, `menu-items-columns.tsx`, `menu-form.tsx`, `create-menu-item-dialog.tsx`, `menu-item-detail-view.tsx`, `menu-items/page.tsx`, `menus-detail-view.tsx` |

**Effort:** Low (7 sites, replace `<img>` with `<Image>` from `next/image`)
**Risk:** Low-moderate — requires verifying `next.config.ts` has `remotePatterns` for Cloudinary (already configured). Need to set explicit `width`/`height` or use `fill` prop with proper parent sizing.
**Strategy:** Replace each `<img>` with `<Image>` component. For dynamic Cloudinary URLs, use `fill` + `sizes` or extract dimensions from URL. Test visually after each replacement.
**Priority:** Low (warnings, performance improvement when done)

---

### 6. `react-hooks/set-state-in-effect` — 10 errors

| Metric | Value |
|---|---|
| Errors | 10 |
| Warnings | 0 |
| Severity | **Error** |
| Affected files | 9 files |
| Hotspots | `event-form.tsx` (2), `use-menu-items.ts` (1), `use-events.ts` (1), `use-mobile.ts` (1), `use-menus.ts` (1), `edit-client-dialog.tsx` (1), `custom-cursor.tsx` (1), `privacy-mode.tsx` (1), `use-clients.ts` (1) |

**Effort:** Medium (10 sites, each needs analysis of whether setState triggers re-render loops)
**Risk:** Moderate-High — this is the most dangerous category. Setting state inside `useEffect` without proper guards causes **render loops**. Files with `use-*-stats.ts` patterns may re-trigger on every stat change.
**Strategy:** Audit each:
- **`use-mobile.ts`**: Resize listener — safe pattern (event-driven, not dependency-triggered). Add cleanup.
- **`custom-cursor.tsx`**: Mouse-move listener — safe event-driven pattern.
- **`privacy-mode.tsx`**: Likely safe (toggle-driven).
- **`event-form.tsx`** (2 sites): Risk of loop — investigate whether `setValue` from react-hook-form is being called inside effect based on form state.
- **`edit-client-dialog.tsx`**: Related to the render-loop fix — the `fullClient` fetch → state update. Verify it doesn't loop.
- **`use-clients.ts` / `use-events.ts` / `use-menus.ts` / `use-menu-items.ts`**: Data-fetching hooks — setState inside effect after fetch is normal but needs `isMounted`/cancellation guard.
**Priority:** High (prevents runtime production bugs)

---

### 7. `react-hooks/static-components` — 9 errors

| Metric | Value |
|---|---|
| Errors | 9 |
| Warnings | 0 |
| Severity | **Error** |
| Affected files | 1 file |
| Hotspots | `client-form.tsx` (all 9) |

**Effort:** Medium (1 file, 9 violations)
**Risk:** Low-Medium — this rule flags components where the returned JSX doesn't use props/state and could be a static constant. In `client-form.tsx`, React Hook Form's `Controller`/`useController` may confuse the lint rule.
**Strategy:** The 9 offenses are likely form field `Controller` render-functions. If they're truly static, extract into separate pure components or memoize with `React.memo`. Verify each instance — some may be legitimate React Hook Form patterns that the lint rule misinterprets.
**Priority:** Medium

---

### 8. `@typescript-eslint/no-require-imports` — 5 errors

| Metric | Value |
|---|---|
| Errors | 5 |
| Warnings | 0 |
| Severity | **Error** |
| Affected files | 1 file (`test-db3.cjs`) |

**Effort:** Trivial (1 file, 5 sites)
**Risk:** None — this is a `.cjs` file where `require()` is the correct module system.
**Strategy:** Either (a) add `// eslint-disable-next-line @typescript-eslint/no-require-imports` to each line, (b) add `.cjs` extension override in ESLint config, or (c) convert to ESM syntax. The cleanest fix: add an override in `eslint.config.*` to disable this rule for `*.cjs` files.
**Priority:** High (5 errors, trivial fix, one-time config change)

---

### 9. `react-hooks/incompatible-library` — 4 warnings

| Metric | Value |
|---|---|
| Errors | 0 |
| Warnings | 4 |
| Severity | **Warning** |
| Affected files | 4 files (`*-table.tsx` — clients, events, menus, menu-items) |

**Effort:** Low (4 files, same fix pattern)
**Risk:** Low — these are the `@tanstack/react-table` columns definitions. The lint rule detects that `useMemo`/`useCallback` is called with deps that include non-reactive values from outside the component.
**Strategy:** Move column definitions outside the component (as module-level constants) or wrap in `useMemo` with correct deps. The `columns` array in each table component likely uses `useMemo(() => [...], [])` but the lint rule wants it static. Simplest fix: export static column arrays.
**Priority:** Low (warnings, no runtime impact)

---

### 10. Other — 12 errors + 0 warnings

#### `react-hooks/use-memo` — 4 errors
- **Files:** `menu-item-toolbar.tsx`, `menu-toolbar.tsx`, `clients-toolbar.tsx`, `event-toolbar.tsx`
- **Issue:** `useMemo` called with one or fewer deps — likely a `useMemo(() => ..., [])` that should be a module-level constant.
- **Risk:** Low — the memo is useless but harmless.
- **Fix:** Extract the constant outside the component or inline it.
- **Effort:** Trivial (4 files, 1 line each)

#### `react-hooks/refs` — 2 errors
- **File:** `use-magnetic.ts`
- **Issue:** `useCallback` returning a ref assignment — violates rules of refs.
- **Risk:** Moderate — could cause stale ref values in animation logic.
- **Fix:** Use callback ref pattern (`ref={(el) => { ... }}`) instead of `useCallback`.
- **Effort:** Low (1 file, 2 lines)

#### `react-hooks/purity` — 2 errors
- **File:** `use-clients-stats.ts`
- **Issue:** Custom hook calls other hooks conditionally or has side effects outside of hooks.
- **Risk:** Low-Medium — custom hook may trigger unexpected re-renders.
- **Fix:** Restructure to follow Rules of Hooks (no conditional hook calls).
- **Effort:** Low (1 file)

#### `react-hooks/preserve-manual-memoization` — 1 error
- **File:** `edit-client-dialog.tsx`
- **Issue:** `useMemo` result is computed differently from its deps array.
- **Risk:** Moderate — the `defaultValues` `useMemo` already works (was part of render-loop fix), but deps may be incorrect.
- **Fix:** Verify the deps match the computed value exactly.
- **Effort:** Trivial (1 file)

#### `react-hooks/immutability` — 1 error
- **File:** `event-form.tsx`
- **Issue:** Potential mutation of state or props.
- **Risk:** Low-Medium — form may mutate intermediate values.
- **Fix:** Review the offending line and ensure spread/immutable patterns.
- **Effort:** Low (1 file, 1 line)

---

## Remediation Roadmap

### Phase 1 — Quick Wins (zero risk, <30 min)
| # | Category | Fix | Issues fixed | Est. time |
|---|---|---|---|---|
| 1 | `no-unused-vars` | `eslint --fix` auto-remove | 52 warnings | 2 min |
| 2 | `no-unescaped-entities` | Replace `'` → `&apos;`, `"` → `&quot;` in JSX | 37 errors | 10 min |
| 3 | `no-require-imports` | Add ESLint override for `*.cjs` | 5 errors | 2 min |
| 4 | `no-img-element` | Replace `<img>` → `<Image>` in 7 files | 7 warnings | 15 min |
| **Subtotal** | | | **101 issues** | **~29 min** |

### Phase 2 — Safe Structural (low-moderate risk, ~1-2 hr)
| # | Category | Fix | Issues fixed | Est. time |
|---|---|---|---|---|
| 5 | `use-memo` (empty deps) | Extract constants to module level | 4 errors | 10 min |
| 6 | `static-components` | Audit `client-form.tsx` 9 violations | 9 errors | 30 min |
| 7 | `incompatible-library` | Move table columns to static exports | 4 warnings | 15 min |
| 8 | `preserve-manual-memoization` | Fix deps in `edit-client-dialog.tsx` | 1 error | 5 min |
| 9 | `immutability` | Fix mutation in `event-form.tsx` | 1 error | 5 min |
| **Subtotal** | | | **19 issues** | **~65 min** |

### Phase 3 — Needs Manual Audit (moderate-high risk, ~2-3 hr)
| # | Category | Fix | Issues fixed | Est. time |
|---|---|---|---|---|
| 10 | `set-state-in-effect` | Audit 10 sites, add guards/cleanup | 10 errors | 60 min |
| 11 | `refs` | Fix callback ref in `use-magnetic.ts` | 2 errors | 15 min |
| 12 | `purity` | Fix conditional hooks in `use-clients-stats.ts` | 2 errors | 15 min |
| 13 | `exhaustive-deps` | Audit 9 sites, add correct deps | 9 warnings | 45 min |
| **Subtotal** | | | **23 issues** | **~135 min** |

### Phase 4 — Bulk Suppression (low risk, ~15 min)
| # | Category | Fix | Issues fixed | Est. time |
|---|---|---|---|---|
| 14 | `no-explicit-any` | Add eslint-disable comments; optionally type high-value files | 130 errors | 15 min (suppression) or gradual typing |

### Phase 5 — Optional (zero risk, drive-by)
| # | Fix | Est. time |
|---|---|---|
| 15 | Clean up `test-db3.cjs` with proper ESLint ignore | 5 min |

---

## Risk Summary

| Risk level | Issues | % of total |
|---|---|---|
| 🔴 High (bugs possible) | 10 | 3.7% |
| 🟡 Medium (maintenance burden) | 26 | 9.5% |
| 🟢 Low (cosmetic) | 237 | 86.8% |

---

## Recommendations

1. **Do Phase 1 today** (101 issues, 29 min) — pure mechanical fixes with zero behavioral change.
2. **Do Phase 2 next** (19 issues, 65 min) — structural but safe once verified.
3. **Defer Phase 3** until after feature freeze — requires manual QA per fix.
4. **Suppress Phase 4** (`no-explicit-any`) via eslint-disable comments in a single pass — the real typing fix is a separate project.
5. **Target Phases 1+2 completion before next PR** to reduce error count from 201 → ~22 (89% reduction).
6. **Add CI gate**: After Phase 1, run `eslint --max-warnings 20` in CI to prevent regression.
