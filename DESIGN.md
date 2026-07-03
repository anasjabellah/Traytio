# Design System: Traytio

**Skill:** stitch-design-taste

---

## Configuration — Set Your Style
Adjust these dials before using this design system. They control how creative, dense, and animated the output should be. Pick the level that fits your project.

| Dial | Level | Description |
|------|-------|-------------|
| **Creativity** | `7` | `1` = Ultra-minimal, Swiss, silent, monochrome. `5` = Balanced, clean but with personality. `10` = Expressive, editorial, bold typography experiments, inline images in headlines, strong asymmetry. Default: `8` |
| **Density** | `5` | `1` = Gallery-airy, massive whitespace. `5` = Balanced sections (marketing airy, dashboard denser). `10` = Cockpit-dense, data-heavy. Default: `4` |
| **Variance** | `7` | `1` = Predictable, symmetric grids. `5` = Subtle offsets. `10` = Artsy chaotic, no two sections alike. Default: `8` |
| **Motion Intent** | `6` | `1` = Static, no animation noted. `5` = Subtle hover/entrance cues. `10` = Cinematic orchestration noted in every component. Default: `6` |

> **How to use:** Change the numbers above to match your project's vibe. At **Creativity 1–3**, the system produces clean, quiet, Notion-like interfaces. At **Creativity 7–10**, expect typographic display contrast, warm-pigment gold surfaces, glass-morphism components, directional lighting in gradients, and asymmetric editorial marketing sections. The rest of the rules below adapt to your chosen levels. These dials are defaults for the Traytio luxury hospitality SaaS — marketing pages lean expressive, the dashboard is clinically organized but never cold.

---

## 1. Visual Theme & Atmosphere

### Brand Identity
Traytio is a premium SaaS operating system for professional caterers ("traiteurs"). The brand lives at the intersection of Michelin-starred craftsmanship and Silicon Valley product precision. Every visual decision communicates trust, warmth, and bespoke service — never generic, never corporate-cold. The target audience is hospitality professionals who value their craft: event caterers, palace kitchens, private chef services, and luxury hospitality groups. The tone is French-Moroccan by market (MAD currency, `fr-MA` locale) but global-luxury in aesthetic.

Key brand attributes: **warmth, precision, craft, exclusivity, editorial quality.**

### Design Philosophy
Traytio follows four principles:

1. **Warm Minimalism** — Every element earns its place. Whitespace is a premium material, not an afterthought. The palette runs warm (gold, champagne, cream, charcoal) — no cold grays or clinical blue-whites. Surfaces feel like fine paper, not sterile glass.

2. **Directional Light** — Gradients simulate a light source hitting the interface from the upper-left. Gold radiance pools at the top of sections (`bg-radiance`), mesh gradients suggest dappled light through a window (`bg-gradient-mesh`). Depth is atmospheric, not mechanical (no hard drop shadows).

3. **Craft over Chrome** — Decoration serves function. Gold is the single accent — it appears on CTAs, focus rings, chart sparklines, status indicators, and section highlights. It never decorates for its own sake. Transitions are tactile (spring physics, not linear). Cards have quiet borders and diffused shadows — no neon, no glow, no glass gradients.

4. **Dual-Voice Typography** — The brand speaks in two voices: an editorial serif (`Cormorant Garamond`) for headlines, display text, and metric numbers (craft, tradition, authority), and a clean geometric sans (`DM Sans`) for body copy, navigation, and dashboard UI (clarity, precision, modernity). This split mirrors the audience's dual identity — culinary artist and business operator.

### Taste Spectrum Placement
- **Density**: Level 5 — Balanced. Marketing pages are gallery-airy (`pt-36 pb-24` hero spacing). The dashboard is information-dense but structured with generous padding (`px-6 lg:px-10`), never cramped. Section gaps breathe.
- **Variance**: Level 7 — Offset Asymmetric. Marketing uses split-screen hero (text left / dashboard mockup right). Feature sections alternate between 2-column zig-zag, bento grids, and horizontal scroll. Dashboard navigation dynamically overflows to a "More" dropdown via ResizeObserver. No two sections feel templated.
- **Motion**: Level 6 — Fluid CSS. Staggered reveals, hover-lift transitions, spring-based micro-interactions. Not theatrical — the motion reinforces hierarchy without distraction.

---

## 2. Color Palette & Roles

### Primary Palette

| Token | Hex / OKLCH | CSS Variable | Role |
|-------|-------------|--------------|------|
| **Cream Canvas** | `#FFFFFF` | `--background` | Primary background surface. Warm white — never clinical blue-white |
| **Warm Champagne** | `#F5F5F5` | `--secondary` | Secondary sections, surface differentiation, soft container fills |
| **Surface Soft** | oklch(0.985 0.004 80) | `--surface-soft` | Dashboard background, toolbar strips, subtle section differentiation |
| **Surface Elevated** | oklch(0.99 0.003 80) | `--surface-elevated` | Dashboard panel fills, table rows, elevated containers. Nearly-white with whisper warmth |
| **Charcoal Ink** | `#1A1A1A` | `--foreground` | Primary text, navigation fills, high-contrast dark surfaces. Near-black — never pure black (`#000000`) |
| **Charcoal Gradient** | oklch(22% .012 70) → oklch(12% .01 70) | `--gradient-charcoal` | Dark surfaces (dashboard KPI charts, navbar "T" icon, stat tiles) |
| **Steel Muted** | `#888888` | `--muted-foreground` | Secondary text, metadata, timestamps, form placeholders, footer links, disabled text |
| **Surface Muted** | `#F0F0F0` | `--muted` | Interactive hover states, table header backgrounds, secondary button hover |
| **Ivory** | `#FFFFFF` | `--ivory` | Card and popover surface fills |
| **Beige** | `#F0F0F0` | `--beige` | Tertiary surface, utility backgrounds |

### Accent — Signal Gold (Single Accent, max 1)

| Token | Hex / OKLCH | CSS Variable | Saturation | Role |
|-------|-------------|--------------|------------|------|
| **Signal Gold** | `#C9A96E` | `--gold`, `--primary`, `--ring` | ~45% | Primary brand accent — CTAs, focus rings, active states, chart lines, decorative elements |
| **Gold Deep** | oklch(0.70 0.13 78) | `--gold-deep` | ~13% | Status dots, icon fills, active indicators, darker gold for visual weight |
| **Gold Soft** | oklch(0.94 0.05 88) | `--gold-soft` | ~5% | Pale gold surface for icon backgrounds, chip fills, subtle highlighting |
| **Gold Foreground** | oklch(0.20 0.012 70) | `--gold-foreground` | ~1.2% | Dark text on gold surfaces — ensures accessible contrast on gold fills |
| **Gold Gradient** | `linear-gradient(135deg, #f3d28b 0%, #d4a24c 50%, #b8842f 100%)` | `--gradient-gold` | — | Decorative gold gradients for hero text accents, icon backgrounds, chart sparklines, decorative glows |

### Semantic Colors

| Token | Hex | CSS Variable | Role |
|-------|-----|--------------|------|
| **Destructive Red** | `#CC3333` | `--destructive` | Error text, destructive actions, validation states, delete confirmations |
| **Destructive Foreground** | `#FFFFFF` | `--destructive-foreground` | Text on destructive backgrounds |
| **Emergent Green** | `rgb(16 185 129)` | — | Positive trends (sparkline up, growth indicators, success badges) |
| **Rose Down** | `rgb(244 63 94)` | — | Negative trends (sparkline down, decline indicators) |

### Chart Colors

| Token | Hex | Role |
|-------|-----|------|
| Chart-1 | `#C9A96E` | Primary chart series (gold) |
| Chart-2 | `#4A4A4A` | Secondary chart series (charcoal) |
| Chart-3 | `#888888` | Tertiary chart series (muted) |
| Chart-4 | `#D4B896` | Quaternary chart series (warm beige) |
| Chart-5 | `#1A1A1A` | Quinary chart series (dark) |

### Border & Ring

| Token | Hex / Value | CSS Variable | Role |
|-------|-------------|--------------|------|
| **Whisper Border** | `#E2E2E2` | `--border` | Card borders, structural 1px lines, table row dividers, input borders |
| **Input Border** | `#E2E2E2` | `--input` | Form input borders |
| **Focus Ring** | `#C9A96E` | `--ring` | Keyboard focus indicator — Signal Gold, 2px width with 50% opacity ring |
| **Destructive Ring** | `#CC3333` | — | Validation error ring |

### Surfaces & Gradients

| Gradient | Definition | Usage |
|----------|-----------|-------|
| **Gradient Charcoal** | `linear-gradient(180deg, oklch(22% .012 70), oklch(12% .01 70))` | Dark UI panels, dashboard header card, navbar "T" logo badge |
| **Gradient Gold** | `linear-gradient(135deg, #f3d28b 0%, #d4a24c 50%, #b8842f 100%)` | Hero text accent, icon badge backgrounds, decorative gold circles, progress bars |
| **Gradient Radiance** | `radial-gradient(circle at top, rgba(212, 162, 76, 0.15), transparent 70%)` | Section top highlight — directional light effect, dashboard background glow |
| **Gradient Mesh** | `radial-gradient(circle at top left, rgba(212,162,76,0.12), transparent 40%), radial-gradient(circle at bottom right, rgba(212,162,76,0.08), transparent 40%)` | Atmospheric background texture — marketing hero and dashboard backdrop. Simulates dappled light |
| **Glass** | `rgba(255,255,255,0.72)` + `backdrop-filter: blur(20px)` | Translucent navigation bar, floating cards, secondary marketing CTAs |
| **Glass Dark** | `color-mix(in oklab, oklch(0.18 0.012 70) 80%, transparent)` + `backdrop-filter: blur(20px)` | Dark translucent panels |

### Selection
- Background: `rgba(212, 162, 76, 0.25)` (gold-tinted)
- Text color: `#1A1A1A`

### Banned Colors
- Purple/Violet neon — the "AI Purple" aesthetic is strictly forbidden
- Pure Black (`#000000`) — always Charcoal Ink (`#1A1A1A`)
- Oversaturated accents above 80% saturation
- Mixed warm/cool gray systems — stick to the warm champagne palette consistently
- Clinical blue-whites — use Cream Canvas (`#FFFFFF`) with warm undertones

---

## 3. Typography Rules

### Font Architecture

| Role | Font Family | Fallback | Usage |
|------|-------------|----------|-------|
| **Display / Heading** | `Cormorant Garamond` | Georgia, serif | All h1–h6, hero headlines, section titles, display metric numbers, dashboard value displays. CSS variable: `--font-heading`. Utility class: `.font-display` |
| **Body / UI** | `DM Sans` | system-ui, sans-serif | Body copy, navigation, dashboard UI, forms, tables, all reading text, buttons, badges, tooltips. CSS variable: `--font-sans` |
| **Mono** | `Geist Mono` (via `--font-geist-mono`) | system monospace | Code elements, technical metadata |

### Type Scale

| Token | Size | CSS Value | Usage |
|-------|------|-----------|-------|
| **Hero Display** | `clamp(3rem, 6.5vw, 5.75rem)` | — | Homepage headline. Weight 400, `font-display`, tracking `-0.03em`, leading `0.95` |
| **Dashboard Title** | `5xl` / `6xl` (`3rem` / `3.75rem`) | `text-5xl lg:text-6xl` | Dashboard page title "Dashboard". Weight 400, `font-display`, leading `1.05` |
| **Section Heading** | `clamp(1.75rem, 3vw, 2.5rem)` | — | Marketing section titles |
| **3xl** | `1.875rem` (30px) | `text-3xl` | Card headings, modal titles |
| **2xl** | `1.5rem` (24px) | `text-2xl` | Feature card titles, metric displays |
| **xl** | `1.25rem` (20px) | `text-xl` | Sub-headings |
| **lg** | `1.125rem` (18px) | `text-lg` | Hero subtext, large body |
| **Base** | `1rem` (16px) | `text-base` | Default body copy, form labels, table cells |
| **sm** | `0.875rem` (14px) | `text-sm` | Buttons, nav links, form input text, table headers, descriptions |
| **xs** | `0.75rem` (12px) | `text-xs` | Captions, metadata, timestamps, status indicators, footnotes, footer links |
| **Caption** | `0.75rem` (12px) | — | Dashboard chart labels, sidebar labels, notification text |

### Typography Rules

- **Display/Headlines (Cormorant Garamond):** Track-tight (`-0.03em` via `.font-display`), compressed leading (`0.95` for hero, `1.05` for dashboard). Weight-driven hierarchy (400 for large display, 500–600 for section heads, `font-medium` for card titles). The italic variant is a signature accent voice — used specifically for the gold gradient hero phrase (`italic text-gradient-gold`)
- **Body/UI (DM Sans):** Relaxed leading (`1.5`), Steel Muted (`#888888`) for secondary and metadata. Neutral, precise, never decorative. Max line width: `max-w-xl` (approx 576px) for readable text blocks
- **Mono:** Reserved for code and technical metadata only
- **Dashboard Constraint:** All headings use `font-display` (Cormorant Garamond) — including dashboard metric values (`text-gradient-charcoal`). Body text uses `font-sans` (DM Sans) exclusively
- **Density Override:** When density exceeds Level 7, all numbers must use Monospace — not currently applicable at Level 5
- **Tabular Numbers:** Dashboard values use `tabular-nums` for stable alignment when values change

### Typography Anti-Patterns (Banned Fonts)
- `Inter` — BANNED everywhere. Use `DM Sans` for body, `Cormorant Garamond` for display
- Generic old-style serifs (`Times New Roman`, `Georgia`, `Garamond`, `Palatino`) — BANNED. `Cormorant Garamond` is a distinctive modern serif and is the one allowed exception for the editorial brand voice
- `Arial` — BANNED as body font
- No default browser serif stacks — always specify `'Cormorant Garamond'` explicitly for `--font-heading`
- For purely functional dashboard data views, the heading stack falls back to `DM Sans` weight 600 if serif feels too editorial for the context

---

## 4. Component Stylings

### Buttons

**Base style (from `src/components/ui/button.tsx`):** Flat fill surface. No outer glow. No neon. No custom cursors. Rounded corners: `rounded-lg` (8px). Focus-visible: Signal Gold ring (`2px` opacity 50%).

| Variant | Background | Text | Border | Hover | Active |
|---------|-----------|------|--------|-------|--------|
| `default` | `--primary` (`#C9A96E`) | `--primary-foreground` (`#FFFFFF`) | transparent | `bg-primary/80` | `translate-y-px` |
| `outline` | `--background` | `--foreground` | `--border` | `bg-muted` | — |
| `secondary` | `--secondary` (`#F5F5F5`) | `--secondary-foreground` | transparent | `bg-secondary/80` | — |
| `ghost` | transparent | `--foreground` | transparent | `bg-muted` | — |
| `destructive` | `--destructive/10` | `--destructive` | transparent | `bg-destructive/20` | — |
| `link` | transparent | `--primary` | underline | underline-offset 4 | — |

| Size | Height | Padding | Font Size | Usage |
|------|--------|---------|-----------|-------|
| `default` | 32px (h-8) | 10px horizontal (px-2.5) | 14px (text-sm) | Standard |
| `xs` | 24px (h-6) | 8px horizontal (px-2) | 12px (text-xs) | Table actions |
| `sm` | 28px (h-7) | 10px horizontal (px-2.5) | 13px (`text-[0.8rem]`) | Compact |
| `lg` | 36px (h-9) | 10px horizontal (px-2.5) | 14px | Dense layouts |
| `icon` | 32px (size-8) | — | — | Icon-only |
| `icon-sm` | 28px (size-7) | — | — | Compact icon |
| `icon-lg` | 36px (size-9) | — | — | Large icon |

**Marketing buttons (site-specific)** — the Hero and Navbar use custom Charcoal-filled pill buttons: `rounded-full bg-foreground text-primary-foreground px-6 py-3.5 text-sm font-medium shadow-lift hover:shadow-gold transition-all`. This is the only place pill shapes appear — for marketing calls to action.

### Forms

**Form layout** (`src/components/ui/form.tsx`): Standard `react-hook-form` + `@radix-ui/react-label` integration.

| Element | Style |
|---------|-------|
| **Label** | `text-sm font-medium leading-none`. Error state: `text-destructive` |
| **Input** | `h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm`. Focus: `border-ring ring-3 ring-ring/50`. Placeholder: `text-muted-foreground`. Disabled: `opacity-50 cursor-not-allowed bg-input/50` |
| **Textarea** | Same as Input but multi-line |
| **Select** | Same as Input trigger. Dropdown: `rounded-lg bg-popover shadow-md ring-1 ring-foreground/10`. Items: `rounded-md py-1 pr-8 pl-1.5 text-sm focus:bg-accent` |
| **Error Message** | `text-sm font-medium text-destructive` |
| **Helper Text** | `text-sm text-muted-foreground` |
| **Gap** | `space-y-2` between label-input-error stack |
| **Switch** | Track: `h-[18.4px] w-[32px] rounded-full`. Checked: `bg-primary`. Thumb: `size-4 rounded-full bg-background` |
| **Checkbox / Radio** | Not customized yet — uses Base UI defaults with border-border, accent focus ring |

**Principles:**
- Label positioned above input — no floating labels
- Error text appears below input in Destructive Red (`#CC3333`)
- Helper text below input in Steel Muted
- Focus ring in Signal Gold with 2px width
- Inputs use `rounded-lg` (8px), not pill shapes

### Cards

**Standard card** (`src/components/ui/card.tsx`): `rounded-xl bg-card ring-1 ring-foreground/10`. Two sizes: `default` (gap-4, py-4) and `sm` (gap-3, py-3).

| Part | Style |
|------|-------|
| **Card** | `rounded-xl bg-card ring-1 ring-foreground/10 py-4 px-0` |
| **Header** | `px-4`, flex row with optional action column |
| **Title** | `font-heading text-base leading-snug font-medium` — Cormorant Garamond, 16px |
| **Description** | `text-sm text-muted-foreground` — DM Sans, 14px, steel muted |
| **Content** | `px-4` |
| **Footer** | `rounded-b-xl border-t bg-muted/50 p-4` |

**KPI Cards** (`src/shared/components/kpi-card.tsx`): `rounded-2xl border bg-card p-5 shadow-soft hover:shadow-lift transition-all`. Can accent with `border-gold` and gold radial glow. Features: icon in `size-10 rounded-xl bg-gradient-gold` (accent) or `bg-foreground/[0.04]` (standard), `font-display text-lg sm:text-xl lg:text-2xl` for value, `text-xs uppercase tracking-wider text-muted-foreground` for label, delta badge, sparkline, optional progress bar.

**Marketing Cards:** Glass-morphism variants (`glass shadow-glass rounded-3xl` with `backdrop-filter: blur(20px)`) for hero dashboard mockup container. Regular cards for pricing and features use border + subtle shadow.

**Dashboard Widget Cards:** `rounded-2xl border border-border bg-card` pattern. Used throughout dashboard sections. Soft shadow, no heavy drop shadow.

**Principles:**
- Cards used ONLY when elevation communicates hierarchy
- High-density dashboard rows replace cards with `border-bottom` dividers
- Tint shadows to background hue — `shadow-soft` uses `rgba(0,0,0,0.04, 0.06)`, not hard gray shadows
- Gold accent card: `border-gold` (rgba(212,162,76,0.35)) with `ring-gold` for focus

### Tables

**Table** (`src/components/ui/table.tsx`): Wrapped in `rounded-lg border border-border/30 bg-card/30 overflow-x-auto`.

| Element | Style |
|---------|-------|
| **Table wrapper** | `w-full overflow-x-auto rounded-lg border border-border/30 bg-card/30` |
| **Table** | `w-full caption-bottom text-sm` |
| **Header** (`thead`) | `bg-card/40 text-foreground` |
| **Header cell** (`th`) | `px-4 py-2 text-left font-medium text-muted-foreground`. First cell: `rounded-tl-lg`, last: `rounded-tr-lg` |
| **Body row** (`tr`) | `border-b border-border/20`. Hover: `bg-card/20`. Selected: `data-[state=selected]:bg-primary/10` |
| **Data cell** (`td`) | `px-4 py-2 text-foreground`. First cell: `font-medium` |

**Principles:**
- Minimal borders — only horizontal `border-b` on rows
- Sticky header not implemented by default
- Row hover: subtle `bg-card/20` lift
- Pagination below table: `border-t border-border/10` separator
- Empty tables show composed empty state, not blank space

### Charts

Traytio uses `recharts` for data visualizations. Charts follow the chart color palette (Chart-1 through Chart-5). The KPI card includes an inline SVG sparkline (`Sparkline` component in `kpi-card.tsx`):

- Dimensions: 96w × 32h, pad 2
- Stroke: `rgb(16 185 129)` (emerald, up) or `rgb(244 63 94)` (rose, down)
- Area fill: linear gradient from stroke at 25% opacity to transparent
- Stroke width: 1.5px, rounded linecap/linejoin
- Gradient-defined area fill using unique per-card IDs
- No axis labels, no grid, no tooltip (inline decorative sparkline)

**Revenue Chart** (dashbaord): Uses recharts line/area with the same chart color palette. Gold (#C9A96E) for primary revenue line.

### Dashboard Widgets

Dashboard widgets follow consistent patterns:

| Widget | Pattern | Key Classes |
|--------|---------|-------------|
| **KPI Card** | Asymmetric metric display + sparkline + delta badge | `group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft hover:shadow-lift` |
| **Revenue Chart** | Full-width dark card with gold sparkline chart | `col-span-4 rounded-xl bg-gradient-charcoal p-5 text-primary-foreground` |
| **Stat Tile** | Compact metric + icon | `rounded-xl border border-border/60 bg-surface-elevated p-3` |
| **Orders List** | Simple bordered list with status dots | `rounded-xl border border-border/60 bg-surface-elevated` with row `border-b` |
| **Mini Calendar** | Calendar grid | FullCalendar integration (`@fullcalendar/react`) |
| **Upcoming Events** | List with event chips | Standard card layout with badge-based event items |
| **Business Health** | Progress bars with labels | Application of `Progress` component with gold indicator |
| **Quick Actions** | Icon + label action buttons | Ghost-style button grid |
| **Notification Panel** | Grouped list with icon per type | `rounded-xl border border-border/50 bg-card shadow-xl` with grouped notification items |

**Dashboard layout:** 12-column CSS Grid. Main content spans `col-span-12 xl:col-span-9`, sidebar `col-span-12 xl:col-span-3`. Max width: `max-w-[1480px]`. Padding: `px-6 lg:px-10`.

### Navigation

**Marketing Navbar:** Fixed top, glass effect, rounded-full container. `fixed top-4 left-1/2 -translate-x-1/2 w-[min(1180px,calc(100%-2rem))]`. Gold-accented "T" logo icon, `font-display text-2xl` brand name. Links: `px-4 py-2 rounded-full hover:text-foreground hover:bg-secondary/80`. CTA: Charcoal-filled `rounded-full` pill.

**Dashboard Top Bar:** Sticky top (`sticky top-0 z-30 bg-background border-b border-border/50`). Logo left, dynamic nav links (overflow detection via ResizeObserver → "More" dropdown), search (`⌘K`), notification bell with red unread badge, user avatar (charcoal circle with first initial, gold ring on hover), mobile hamburger → Sheet drawer (`SheetContent side="left"`).

**Dashboard Sidebar:** `SidebarProvider` with `collapsible="offcanvas"` or `"icon"`. Width: `16rem` expanded, `3rem` icon. Mobile: sheet drawer. Variants: `sidebar` (border-right), `floating` (rounded with shadow), `inset` (contained within main). Uses Base UI composable pattern.

**Principles:**
- Desktop: full horizontal links with active state (`bg-foreground/[0.07] text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]`)
- Tablet: same nav with overlap handling
- Mobile: sheet/slide-in drawer
- No tiny hamburger icons without labels — "Ouvrir le menu" aria-label always present
- Keyboard shortcut: `⌘K` for search, `⌘B` for sidebar toggle

### Dialogs

**Dialog** (`src/components/ui/dialog.tsx`): Uses `@base-ui/react/dialog`. Backdrop: `fixed inset-0 isolate z-50 bg-black/10 backdrop-blur-xs`. Content: `fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 sm:max-w-sm`. Animate: fade-in + zoom-in 95%.

| Part | Style |
|------|-------|
| **Title** | `font-heading text-base leading-none font-medium` |
| **Description** | `text-sm text-muted-foreground` |
| **Header** | `flex flex-col gap-2` |
| **Footer** | `-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end` |
| **Close Button** | Ghost icon button, absolute top-2 right-2 |

**Alert Dialog** (`src/components/ui/alert-dialog.tsx`): Same dialog pattern with destructive-confirm styling.

**Sheet** (`src/components/ui/sheet.tsx`): Uses same Base UI dialog primitives. Side options: top, right, bottom, left. `z-50`, `bg-popover`, `shadow-lg`. Transition: slide + fade. `data-[side=left]:w-3/4 sm:max-w-sm`. Close button: ghost icon.

### Empty States

Empty states are never "No data found" text alone. They follow a composed pattern:
- Centered icon in `text-muted-foreground/30` with `strokeWidth={1.2}` (deliberately faint)
- Descriptive text in `text-xs text-muted-foreground/50 font-medium`
- Optional guidance text
- Example: Notification empty state: Bell icon (`size-8`) + "Aucune notification" text

Dashboard widgets should compose empty states with illustration or icon + guidance.

### Loading States

**Skeleton** (`src/components/ui/skeleton.tsx`): `animate-pulse rounded-md bg-muted`. The `bg-muted` (#F0F0F0) gives a subtle warm pulse.

**Pattern skeletons** (`src/components/ui/skeletons.tsx`):
- `TableSkeleton`: Rows + cols with `rounded-2xl border border-border bg-card shadow-soft` container
- `GridSkeleton`: Card grid with `rounded-2xl border border-border bg-card` placeholders
- `StatsSkeleton`: KPI-style skeleton grid
- `DetailSkeleton`: Full-page skeleton matching `surface-soft` background + card placeholders
- `FormSkeleton`: Form skeleton with `rounded-2xl border border-border bg-card` container
- `InvoicesTableSkeleton`: Rich invoice table skeleton with icon placeholders
- `SettingsTeamSkeleton`: Settings page skeleton with avatar circles

**Dashboard loading:** `DashboardSkeleton` renders a 12-column grid with card-shaped pulsing rectangles matching the exact dashboard layout. No circular spinners.

**Principles:**
- Skeletons match exact layout dimensions and border radii
- Never use circular spinners — skeletal shimmer only
- Background shimmer: `linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)`, 200% width, 2s infinite

### Iconography

Traytio uses `lucide-react` as its icon library (configured in `components.json`). 

- **Size standard:** `size-4` (16px) for inline icons, `size-3.5` for compact, `size-5` for feature icons, `size-3` for badges
- **Stroke width:** Default (1.5px to 2px), thicker for status indicators
- **Color:** Inherits from text color usually (`text-muted-foreground` default, `text-foreground` for active)
- **Icon backgrounds:** Gold gradient badge for accent icons (`rounded-xl bg-gradient-gold text-gold-foreground`), subtle gray for standard (`bg-foreground/[0.04]`)
- **No custom SVG icon set** — lucide provides all icons
- **Proportions:** Icons sit in containers sized `size-8`, `size-9`, `size-10` depending on context
- **SVG avatars** as fallback for user images → initials generated from Clerk user data

---

## 5. Hero Section

The Hero is the first impression — editorial, warm, and distinctly premium. Traytio uses a left-aligned / right-visual split composition.

**Structure:**
- **Asymmetric Layout:** Left text column (1.05fr) paired with a dashboard mockup column (1fr) via CSS Grid: `grid lg:grid-cols-[1.05fr_1fr] gap-14`. Variance Level 7 demands non-centered composition
- **Atmospheric Background:** Three-layer depth: `bg-gradient-mesh` base → `grid-bg` overlay → gold `radiance` radial gradient at top center. All `pointer-events-none`, sitting behind content. Clean spatial separation — text never overlaps images or background decorative layers
- **Headline:** `font-display text-[clamp(3rem,6.5vw,5.75rem)] leading-[0.95] tracking-tight`. The signature creative technique: the italic gold gradient phrase (`traiteurs modernes.`) acts as typographic punctuation
- **Subtext:** `max-w-xl text-lg text-muted-foreground leading-relaxed` — restrained, explanatory, never hyperbolic
- **CTA Restraint:** Two CTAs — one primary (Charcoal pill with arrow, `shadow-lift hover:shadow-gold`), one secondary (glass pill with gold play icon). No "Learn more" links. Maximum two, no redundant micro-copy
- **Social Proof:** Inline: `+1 200 traiteurs nous font déjà confiance` with overlapping gold avatar circles in a flex container
- **Dashboard Mockup:** Glass container (`glass shadow-glass rounded-3xl p-3`) housing a dark-gradient revenue card with gold chart sparkline, stat tiles, and an orders list with gold status dots. Floating animated cards on left and bottom: payment receipt and quote progress. This set-piece establishes the premium dashboard aesthetic without real data
- **No Filler:** No "Scroll to explore", no scroll arrows, no bouncing chevrons. The content pulls naturally

**Animation:** Staggered cascade reveals. Headline fades in (`opacity: 0, y: 16` → 1, 0) with `duration: 0.7, delay: 0.05`. Subtext `delay: 0.15`. CTAs `delay: 0.25`. Dashboard mockup: `opacity: 0, scale: 0.96, y: 24` → 1, 1, 0 with `duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1]`.

---

## 6. Layout Principles

### Spacing System

Traytio uses an 8px base spacing scale mapped to Tailwind spacing. The token system (`src/lib/design-tokens.ts`) defines:

| Token | Rem | Pixels | Usage |
|-------|-----|--------|-------|
| xs | 0.25rem | 4px | Avatar badges, progress gap, tiny separations |
| sm | 0.5rem | 8px | Gap between label-input-error stack, button icon gaps, compact section gaps |
| md | 1rem | 16px | Card internal padding, gap between elements, section margin |
| lg | 1.5rem | 24px | Section gap between components, card stacks |
| xl | 2rem | 32px | Large section padding |
| 2xl | 3rem | 48px | Page section top/bottom padding |

Custom spacing values in use: `gap-14` (3.5rem / 56px) for hero grid, `pt-36 pb-24` (9rem / 6rem) for hero vertical, `px-6 lg:px-10` for dashboard container.

**Marketing spacing:** Generous. `pt-36 pb-24` for hero. Section gaps of `mt-10`, `gap-14`. Whitespace signals exclusivity — large empty intervals separate value propositions.

**Dashboard spacing:** Controlled. `px-6 lg:px-10` container. `gap-4` for KPI grid. `space-y-6` for stacked widgets. `py-8` for page top. Cards use `p-5` internal padding. Table cells use `px-4 py-2`.

### Border Radius

The radius system (`globals.css`):

| Token | Calculation | Value (approx) | CSS Class | Usage |
|-------|------------|----------------|-----------|-------|
| `--radius-sm` | `calc(0.75rem * 0.6)` | 7.2px | `rounded-sm` | Small utility elements |
| `--radius-md` | `calc(0.75rem * 0.8)` | 9.6px | `rounded-md` | Buttons, inputs, standard elements |
| `--radius-lg` | `0.75rem` | 12px | `rounded-lg` | Cards, dialogs, tables, search, selects (MOST COMMON) |
| `--radius-xl` | `calc(0.75rem * 1.4)` | 16.8px | `rounded-xl` | Dashboard KPI cards, stat tiles, order lists |
| `--radius-2xl` | `calc(0.75rem * 1.8)` | 21.6px | `rounded-2xl` | Marketing cards, skeleton containers |
| `--radius-3xl` | `calc(0.75rem * 2.2)` | 26.4px | `rounded-3xl` | Glass dashboard mockup, large marketing panels |
| `--radius-4xl` | `calc(0.75rem * 2.6)` | 31.2px | `rounded-4xl` | Hero glass container, featured hero elements |
| `rounded-full` | `9999px` | `pill` | `rounded-full` | Marketing CTA pills, status dots, avatars, badges (badge uses `rounded-4xl` but conceptually pill) |

**Principles:**
- Standard UI elements (buttons, inputs, selects, tables): `rounded-lg` (12px)
- Cards: `rounded-xl` (16.8px) for dashboard, `rounded-2xl` (21.6px) for marketing
- Marketing CTAs: `rounded-full` pill — this is the only pill-shaped UI, reserved exclusively for primary actions
- Dialogs, sheets, modals: `rounded-xl` (16.8px)
- Status dots, badges, avatars: `rounded-full`
- Generously rounded corners — never sharp 0-radius corners on interactive elements

### Shadows & Elevation

| Token | Shadow | Usage |
|-------|--------|-------|
| **`--shadow-soft`** | `0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)` | Default card elevation, subtle lift |
| **`--shadow-lift`** | `0 12px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)` | Hover state for cards, modal/popover elevation, user menu |
| **`--shadow-gold`** | `0 12px 40px rgba(212,162,76,0.22)` | Gold-tinted shadow for CTA buttons, accent cards, premium states (marketing) |
| **`--shadow-glass`** | `0 8px 32px rgba(0,0,0,0.06)` | Glass-morphism panels, floating cards |

**Token system** (`src/lib/design-tokens.ts`):
- `sm`: `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)`
- `md`: `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)`
- `lg`: `0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05)`
- `gold`: `0 4px 14px rgba(201, 168, 76, 0.35)`

**Principles:**
- Traytio is mostly flat. Depth comes from surface alternation, corner rounding, and thin borders rather than strong drop shadows
- Shadows are always low-opacity (`0.04–0.10` black), wide-spreading (`24px–40px blur`). Never harsh
- Gold glow reserved for marketing CTA hover states — never used as permanent shadow
- `ring-1 ring-foreground/10` on cards provides subtle containment without shadow
- Dialog/Sheet uses `shadow-lg` with semi-transparent black backdrop and `backdrop-blur-xs`

### Grid & Layout

- **Grid-First:** CSS Grid for all structural layouts. Marketing hero: `grid lg:grid-cols-[1.05fr_1fr] gap-14`. Dashboard: 12-column grid, 5-column KPI grid. Never `calc()` percentage math
- **Feature Sections:** The "3 equal cards in a row" pattern is BANNED. Use 2-column zig-zag, asymmetric bento grids, or horizontal scroll galleries
- **Containment:** Marketing: `max-w-7xl` (1280px) centered `mx-auto`. Dashboard: `max-w-[1480px]` centered. Generous horizontal padding scales: `1rem` mobile → `2rem` tablet → `4rem` desktop
- **Full-Height:** `min-h-svh` for sidebar wrapper. Never `h-screen`
- **Dashboard Layout:** Top bar + content area. Sidebar optional via `SidebarProvider`. Main content: `relative flex w-full flex-1 flex-col bg-background`
- **No Overlapping:** Every element occupies its own grid cell or flow position. Background decorative layers use `pointer-events-none` and sit behind content stack

---

## 7. Responsive Rules

Every screen must work across all viewports. Multi-column layouts collapse strictly to single-column below 768px.

### Breakpoints

Traytio uses Tailwind v4 breakpoints (mobile-first):

| Name | Min Width | Key Changes |
|------|-----------|-------------|
| **Default (Mobile)** | 0 | Single column, compact padding (`px-4`), reduced headline scale (`3rem`), hidden decorative elements |
| **sm** | 640px | Slightly wider containers, two-column KPI grid |
| **md** | 768px | Tablet nav appears, dashboard header flex-row, multi-column grids begin |
| **lg** | 1024px | Full nav links, 3+ column grids, split hero composition, full `px-10` padding |
| **xl** | 1280px | Desktop dashboard nav (full horizontal with overflow dropdown), sidebar expanded |
| **2xl** | 1536px | Maximum container width, wide layouts |

### Responsive Behaviors

- **Hero Layout (< 768px):** Grid collapses to single column. Dashboard mockup hidden (`hidden md:block`). Floating decorative cards hidden. Headline scales down via `clamp(3rem, 6.5vw, 5.75rem)`. CTA buttons stack vertically
- **Navigation (< 768px):** Full horizontal nav collapses to hamburger → `SheetContent` slide-in drawer. Logo + mobile search button visible. Desktop/tablet search input collapses to magnifying glass icon
- **Dashboard Grids:** KPI grid: 1-col → 2-col (`sm`) → 3-col (`lg`). Dashboard layout: stacked → 9/3 sidebar split (`xl`). Widget sections: stacked → inline flex
- **Cards & Grids:** Marketing card grids collapse from 3-column to 2 to 1. Dashboard widget areas stack vertically
- **Typography:** Headlines scale via `clamp()`. Body text minimum `1rem` (16px). Never shrink body below `14px`
- **Tables:** Horizontal scroll wrapped in `overflow-x-auto` on mobile
- **Touch Targets:** All interactive elements minimum 44px tap target. Buttons full-width on mobile
- **No Horizontal Scroll:** Critical failure if any element causes horizontal overflow. The `overflow-x-hidden` on marketing `<main>` wrapper prevents layout breakage
- **Padding:** `px-4` mobile → `px-6` tablet → `px-10` desktop (dashboard). Marketing: `px-6` consistently, larger on desktop
- **Spacing:** Vertical section gaps reduce proportionally. Hero: `pt-36 pb-24` → reduced on mobile
- **Testing:** Verify at 375px (iPhone SE), 390px (iPhone 14), 768px (iPad), 1024px (small laptop), 1440px (desktop)

---

## 8. Motion & Interaction (Code-Phase Intent)

> **Note:** Stitch generates static screens. This section documents intended motion behavior for the implementation agent.

### Physics Engine
- Spring-based exclusively via Framer Motion. Default spring: `stiffness: 100, damping: 20`. Custom ease curves for hero: `[0.16, 1, 0.3, 1]` (gentle deceleration). No linear easing anywhere

### Entrance & Reveal
- **Staggered Orchestration:** Hero content cascades at `delay: 0.05, 0.15, 0.25`. Dashboard mockup: `delay: 0.2` with custom cubic-bezier. KPI cards stagger at `i * 0.05s`. Dashboard sections cascade at `i * 0.05s`. Never mount lists instantly
- **Types:** `fade-in` (`opacity 0 + translateY(10px) → 1, 0, 0.6s`), `slide-up` (`translateY(20px) → 0, 0.6s`), `scale-in` (`scale(0.95) → 1, 0.4s`). All `ease-out`
- **Scroll-triggered:** Framer Motion `whileInView` for marketing sections

### Hover & Active
- **KPI Cards:** Lift on hover — `shadow-soft` → `shadow-lift` transition. Gold accent cards show gold radial glow
- **Buttons:** Depressed active state: `translateY(1px)` (`active:not-aria-[haspopup]:translate-y-px`). Hover: background shift. Arrow icon: `translateX(0.5)` on group hover
- **Navbar Links:** Background shifts `hover:bg-secondary/80`. Active: `bg-foreground/[0.07]` with subtle shadow
- **Top Bar User Avatar:** Gold ring on hover: `hover:ring-2 hover:ring-gold/30 hover:ring-offset-1`
- **Search bar:** Gold border on focus: `hover:border-gold/50 hover:ring-1 hover:ring-gold/20`
- **No glow effects** on interactive elements — only the marketing Hero CTA uses `hover:shadow-gold`

### Perpetual Micro-Interactions
- **Status dots:** Ping animation (`animate-ping` on gold dot behind solid dot)
- **Floating cards:** Infinite `y` cycle at 5–6s intervals (`animate: { y: [0, -10, 0] }, transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }`)
- **Loading shimmer:** 2s infinite sweep (`shimmer` keyframe, background-position -200% → 200%)
- **Float animations on marketing elements:** `.animate-float` (6s) and `.animate-float-slow` (10s)
- **Notification bell:** Red badge with count, no animation on bell itself

### Layout Transitions
- **Sidebar:** Expand/collapse via `transition-[width] duration-200 ease-linear`. Width changes smoothly between `16rem` and `3rem`
- **Dialogs/Sheets:** `duration-200 ease-in-out` with slide + fade. Base UI handles data attributes (`data-open`, `data-closed`) with CSS transitions
- **Route transitions:** Not implemented yet — Next.js App Router with instant navigation

### Performance
- Animate ONLY `transform` and `opacity`. Never `top`, `left`, `width`, `height` for animations
- `transition-all` limited to safe properties: opacity, transform, background-color, border-color, box-shadow
- CPU-heavy perpetual animations isolated in leaf components (floating cards are individual `motion.div` elements)
- `noise-overlay` uses `pointer-events-none` pseudo-elements — never blocks interaction
- Target 60fps minimum

---

## 9. Anti-Patterns (Banned)

### Component Consistency Rules
Enforced rules that every UI component must follow:

- **No emojis** — anywhere in UI, code, or alt text. Use lucide icons instead
- **No `Inter` font** — use `DM Sans` (body/UI) and `Cormorant Garamond` (display)
- **No generic old-style serif fonts** (`Times New Roman`, `Georgia`, `Garamond`) — `Cormorant Garamond` is the one allowed exception
- **No pure black (`#000000`)** — always Charcoal Ink (`#1A1A1A`) or Charcoal gradient
- **No neon outer glows** or default box-shadow glow effects
- **No oversaturated accent colors** — Signal Gold is ~45% saturation, well below the 80% ceiling
- **No excessive gradient text** on large headers — gold gradient reserved for hero accent phrase only
- **No custom mouse cursors** — use system default and `cursor-pointer` on interactive elements only
- **No overlapping elements** — text never overlaps images or other content. Background decorative layers are `pointer-events-none` and sit below content stack
- **No 3-column equal card layouts** for feature rows — use 2-column zig-zag, bento grids, or horizontal scroll
- **No centered Hero sections** — always asymmetric split, left-aligned, or offset composition
- **No filler UI text** — "Scroll to explore", "Swipe down", "Discover more below", scroll arrows, bouncing chevrons are BANNED
- **No generic placeholder names** — "John Doe", "Acme", "Nexus", "SmartFlow". Use organic example data: "Mariage Lambert", "Gala Crédit Suisse", "Cocktail Hermès", "Mariage Dubois"
- **No fake round numbers** — `99.99%`, `50%`, `1234567`. Use organic data: `MAD 482 900`, `+24%`, `+1 200 traiteurs`, `47.2%`
- **No AI copywriting clichés** — "Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize", "Leverage"
- **No broken Unsplash links** — use `picsum.photos/seed/{id}/800/600` or SVG UI Avatars with initials
- **No generic `shadcn/ui` defaults** — customize radii (`rounded-lg`, `rounded-xl`, `rounded-2xl`), colors (Gold palette `#C9A96E`), shadows (Soft, Lift, Gold, Glass). `components.json` style is `base-nova`
- **No `z-index` spam** — use only for Navbar (`z-30`/`z-50`), Dialog/Sheet overlay (`z-50`), Tooltip content (`z-50`), Modal layer contexts. Never above 50
- **No `h-screen`** — always `min-h-[100dvh]` or `min-h-svh`. iOS Safari address bar jump prevention
- **No circular loading spinners** — skeletal shimmer only (`.animate-shimmer` or `animate-pulse` with `bg-muted`)
- **No floating labels** — labels always positioned above their inputs
- **No underline on non-link text** — underline reserved for `link` variant buttons and `<a>` elements

### UX Principles

- **Purpose before polish** — every component must earn its place. If it doesn't serve the user's task, remove it
- **Whitespace is a trust signal** — generous empty intervals between sections signal calm and control. Dashboard surfaces are organized but never cramped
- **One action per screen** — the primary action should be visually unambiguous (Signal Gold or Charcoal-filled button)
- **Error states are inline and contextual** — Destructive Red (`#CC3333`) accent, clear recovery action, never a generic "Something went wrong"
- **Empty states guide, don't frustrate** — composed composition with icon, guidance text, and optional CTA. Never blank or "No data found"
- **Privacy by default** — `PrivacyModeProvider` with blur toggle (`EyeToggle`). Sensitive financial values are masked with 8px blur. Toggleable via header button
- **Loading is not blocking** — skeletons match the exact layout dimension. Users see structure immediately, content fills in
- **Keyboard accessible** — all interactive elements have `focus-visible` gold ring. Sidebar toggle via `⌘B`, search via `⌘K`. Dialog close via `Escape`
- **Reduced motion respected** — animations use CSS `transition` and Framer Motion which respect `prefers-reduced-motion`. No mandatory infinite animations for core interaction

### Accessibility

- All form inputs use `<label>` with proper `htmlFor`/`id` wiring (see `FormLabel` in `form.tsx`)
- Interactive elements have explicit `aria-label` attributes: "Toggle Sidebar", "Notifications", "Menu utilisateur", "Rechercher", "Ouvrir le menu"
- Dialogs use `DialogTitle` and `DialogDescription` for screen reader context
- Skeletons use `aria-hidden` or no semantic structure — they are decorative
- Privacy mode values use `aria-hidden={true}` when blurred
- Color contrast: Charcoal Ink (`#1A1A1A`) on Cream Canvas (`#FFFFFF`) passes WCAG AAA. Signal Gold on white passes at larger sizes only — use Charcoal Ink for body text, gold only for accents and decorative elements
- Selection highlight is gold-tinted (`rgba(212, 162, 76, 0.25)`) — warm and distinctive
- `sr-only` class used for screen reader-only labels (dialog close buttons, sidebar trigger text)
- Focus order follows visual order — ensure DOM order matches visual layout
- Disabled states: `opacity-50 cursor-not-allowed` on buttons, `pointer-events-none` on disabled controls
- Touch targets: minimum 44px for all interactive elements
