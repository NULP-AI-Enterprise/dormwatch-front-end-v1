# DormWatch Design System

Successor of the deleted `DESIGN.md`. Only stable, generalizable rules live
here; page-level layouts and per-component specs are intentionally **not**
documented — read the code (`src/pages`, `src/components`).

## 1. Philosophy

DormWatch bridges residents and housing management at LPNU. The interface
prioritizes utility, accessibility, and institutional trust over flashy
consumer trends.

- Reject the "AI slop" aesthetic: no heavy gradients, soft glow shadows,
  pill-shaped radii, emojis as UI, bulbous floating components.
- Embrace: crisp `border-border` borders, sharp edges, distinct visual
  hierarchy, asymmetrical hover states (`4px` left-border reveal), and
  meaningful micro-visualizations (progress steppers).
- The background is a flat `var(--background)` surface — **no background
  texture of any kind** (the former patterned overlay was removed).
- **Language:** the entire UI is Ukrainian. Only the brand "DormWatch" and
  technical identifiers (e.g. `#id`, `@lpnu.ua`) are English.
- **Accent color is for interaction; color on data is information.** The `--primary`
  accent is a first-class tool for signaling what can be acted on and what is
  selected (see §4). Color on data is a different, scarce resource: a small,
  deliberate palette of hues reserved for the few states where hue genuinely
  helps scanning — never a rainbow keyed to every row of data, never a hue per
  pipeline step. When a state's color doesn't earn its meaning, render it
  monochrome.

## 2. Motifs

### The "Ticket" motif

Complaint cards and data containers read as physical work orders.

- **Categorization:** `text-xs font-semibold text-foreground` for form/section
  labels, `text-xs font-normal text-muted-foreground` for metadata.
- **Separators:** dashed borders via `<Separator dashed />` divide card
  sections; solid separators for page-level and header boundaries.
- **Status indicators:** small, crisp, rectangular badges with high-contrast
  text and a subtle translucent background fill (see Semantic status colors).

### Asymmetrical hover states

Interactions feel mechanical and precise.

- Instead of lifting elements with a drop-shadow, reveal a `1px` solid left
  bar in the primary accent (`w-1`, `opacity-0 → opacity-100` on group hover)
  accompanied by a slight text color shift.
- Link/text hover uses `border-left: 4px solid var(--primary)` with
  `translateX(0.25rem)` and `padding-left: 0.5rem`.

### The "auth field" interaction

Auth-form inputs use a custom focus treatment: a `3px` solid left border in
`var(--primary)` crops in via `border-left-color` transition, with a
`padding-left` shift of `0.5rem` — the field "indents" when focused.

## 3. Typography

### Core rules

1. **No raw CSS for visual styles.** Use Tailwind utilities in JSX. Exceptions:
   theme tokens, keyframe animations, and imperative CSS that can't be
   expressed as utilities.
2. **No bracket classes where the named scale covers the value.** `text-[10px]`,
   `w-[420px]`, `h-[32px]`, `gap-[12px]`, `px-[16px]` are banned when
   `text-xs`, `w-96`, `h-8`, `gap-3`, `px-4` exist. Arbitrary values are only
   for truly non-standard layout edge cases (e.g. `top-[calc(50%-20px)]`).
3. **No positive letter-spacing.** `tracking-wider`/`tracking-widest` and
   positive `letter-spacing` are banned.
4. **`tracking-tight` only on display sizes** — Hero (`text-5xl+`) and H1
   (`text-2xl+`).
5. **No arbitrary pixel font sizes.** `text-[Npx]` is forbidden; minimum
   `text-xs` (12px); named scale only.
6. **No 8–11px text anywhere.** If content doesn't fit at `text-xs`, the
   layout is wrong.
7. **No uppercase-only convention.** `uppercase` only for status badges.
8. **No `.micro-label` generic utility** — labels use inline Tailwind utilities.
9. **No per-instance button typography overrides.** Button label styling is
   defined once in the Button component (currently `text-xs font-semibold`,
   `rounded-none`) and never overridden with `className` at call sites.

### Type scale

| Token | Size | Weight | Tracking | Where |
|---|---|---|---|---|
| Hero (H0) | `text-5xl` / `md:text-6xl` | `font-bold` | `tracking-tight` | Landing hero only |
| Page title (H1) | `text-2xl` / `md:text-3xl` | `font-bold` | `tracking-tight` | Top of every page/section |
| Section title (H2) | `text-lg` / `md:text-xl` | `font-semibold` | none | Group headings |
| Card title (H3) | `text-sm` | `font-semibold` | none | Complaint / ticket card titles |
| Body | `text-sm` | `font-normal` | none | Paragraphs, descriptions |
| Metadata | `text-xs` | `font-normal` | none | Dates, locations, secondary info |
| Badge label | `text-xs` | `font-semibold` | none | Status / category badges |
| Button label | defined in Button component | `font-semibold` | none | All buttons use component default |
| Data value | `text-sm` | `font-normal` | none | Displayed user data, counts |

**Weight rules:** only `font-bold`, `font-semibold`, `font-normal`. No
`font-medium` (visually ambiguous). `font-bold` = headings only (H0, H1);
`font-semibold` = subheadings, labels, buttons; `font-normal` = everything else.

### Contrast

All text at `text-xs` or smaller keeps a minimum **4.5:1** contrast ratio
against its background. `--muted-foreground` on `--card` passes AA for 12px
text (~6.3:1). Color is never the sole carrier of meaning, so color-blind-safe
contrast is a baseline requirement: hue changes must always be paired with a
label.

## 4. Color system

### Tokens

Colors are OKLCH custom properties in `src/index.css` under `:root` and
`.dark` (`.dark` is applied to wrapper elements to activate dark mode).

**Dark mode tokens:** `--background: oklch(0.147 0.004 49.25)` (Stone 900,
app background) · `--foreground: oklch(0.985 0.001 106.423)` (Stone 50) ·
`--card: oklch(0.216 0.006 56.043)` (Stone 800, surfaces) ·
`--muted: oklch(0.268 0.007 34.298)` · `--muted-foreground: oklch(0.709 0.01 56.259)`
(Stone 400) · `--primary: oklch(0.424 0.199 265.638)` (blue 800, brand accent)
· `--primary-foreground: oklch(0.97 0.014 254.604)` ·
`--destructive: oklch(0.704 0.191 22.216)` · `--border: oklch(1 0 0 / 10%)`.

**Light mode tokens:** `--background: oklch(1 0 0)` (white) ·
`--foreground: oklch(0.147 0.004 49.25)` (Stone 900) · `--card: oklch(1 0 0)` ·
`--muted-foreground: oklch(0.553 0.013 58.071)` (Stone 600) ·
`--border: oklch(0.923 0.003 48.717)` (Stone 200).

### Color is a scarce resource

Hierarchy and meaning come primarily from typography, spacing, borders, and
surfaces; color is additive, not the default grammar. Three allowed uses, in
priority order:

1. **Interactive accent (`--primary`)** — signals what can be acted on or is
   currently selected: the primary action per view, links and focus rings,
   active/selected tabs and nav states, the hover left-bar reveal. This is
   sanctioned and used widely; leave it alone.
2. **Semantic status** — a short, fixed hue set for state labels only (see
   below). The palette is deliberately small: a state gets a hue only when the
   hue genuinely aids scanning; everything else is neutral (`foreground`,
   `muted-foreground`, `card`, `muted`, `border`).
3. **Error (`--destructive`)** — destructive actions, error messages, invalid
   input, deletion.

Color is never used to decorate — no tinted rows, no hue-coded filters, no
rainbow bars.

### Semantic status colors

Status hues exist to make a handful of consequential states scannable in dense
lists. The palette is a hard ceiling of four hues, owned by
`src/lib/complaintUtils.ts` — that file is the only one allowed to map a
status to a Tailwind class:

- `amber` — awaiting action (pending)
- `blue` — in work / approved
- `green` — resolved / success
- `red` — rejected / error / urgent / overdue
- everything else is neutral (`text-muted-foreground`, no fill)

Rules:

- The label always carries the meaning; color only aids scanning. States that
  resolve to the same meaning share a hue — "На перевірці", "Не прийнято",
  priority levels, and roles do **not** earn hues of their own; they are
  distinct by name and stay uncolored unless genuinely alert-level.
- Status color is allowed **on the status token itself**: the badge trio
  `text-*-500 bg-*-500/10 border-*-700/50` on one of the four hues, and the
  matching `text-*-500` for inline state names.
- Nothing else borrows these hues: no fills on cards/rows, no progress
  segmentation, no tinted icons, no status-colored filters or charts.

### Banned

- Per-state hues that stretch the lifecycle into a rainbow (`violet` for
  in_progress, `cyan` for review, `orange` for not_accepted, …). Sharing the
  four hues across similar states is expected, not a bug.
- Colored role banners (roles are names — text only).
- Full priority spectrum (priority is text — only "critical" may borrow the
  `red` hue).
- Tinted surface fills (`bg-*-500/10` on cards, rows, inputs) and any
  `bg-*-500` behind content.
- Colored headings, colored body text, and hue-coded data icons that repeat a
  status hue without being that status.

## 5. Geometry & surfaces

### Shape & radius (strictly sharp)

- `rounded-none` everywhere: cards, buttons, dialogs, avatars, inputs, badges,
  tabs, selects. `--radius: 0` globally in `:root` and `.dark`.
- **Exceptions:** radio group items + indicator dots keep `rounded-full`
  (platform convention, distinguishes from checkboxes); `LoadingSpinner` keeps
  `rounded-full` (a rotating square reads as broken, defeating the progress
  indicator).

### Surface opacity tiers

`bg-muted` at three levels; use the lowest tier that gives sufficient
separation:

| Tier | Usage |
|---|---|
| `bg-muted` | Static surfaces needing a visible fill (tab list, future step bars, icon boxes) |
| `bg-muted/50` | Hover states, lighter fills (outline button hover, cross-link cards, table header row) |
| `bg-muted/30` | Subtle tints behind content (comment section, skeleton secondary bars) |

### App chrome (sidebar, header, toolbars)

The persistent framing surfaces — sidebar, top header/toolbar — are one
continuous piece of "chrome," visually distinct from the content area.

- **One surface token for all chrome:** every chrome surface uses the same
  elevated fill (`bg-card`), never a mix of `bg-card` and `bg-background`.
  The content area keeps the base `bg-background` so the chrome sits above it.
- **Chrome/content boundary** is a solid `border-border`, never dashed
  (dashed is reserved for intra-card divisions).

### Aligning fixed-height rows (border-model discipline)

When two fixed-height rows sit side by side across a layout seam, their bottom
edges (and any divider) must land on the same pixel.

- **Draw a row's bottom divider with an in-box `border-b`, not an appended 1px
  separator element.** With the default `box-border`, a `border-b` lives
  *inside* the declared height; a separate sibling separator adds its 1px
  *outside*, pushing the seam down and leaving a sub-pixel mismatch.
- **Rule:** rows aligned across a seam use the *same* height token **and** the
  *same* divider mechanism — never pair a bordered row against a
  row-plus-`Separator`.

### Buttons

- **Size discipline:** use the `default` size; avoid `size="sm"` unless a
  layout constraint requires it.
- Primary: `bg-primary text-primary-foreground hover:bg-primary/80`,
  `font-semibold`, square corners, `h-8` default. One primary button per view.
- Outline: `border-border bg-background hover:bg-muted hover:text-foreground`.
- Ghost: `text-muted-foreground hover:bg-muted hover:text-foreground`. Keep them
  true ghosts — rely on the variant's own hover; never bolt on structural chrome
  (left-border dividers, `hover:opacity-*`). A divider from adjacent chrome
  belongs on the surrounding container, not the button.
- **Composite triggers (avatar/element + affordance):** when a ghost trigger
  wraps a fixed-height element alongside an affordance icon or label, do **not**
  force `h-8` — use `h-auto` plus content-scaled vertical padding. Scale the
  padding and affordance to what the trigger wraps:
  - **Header account trigger** (`StudentLayout`): compact — `sm` avatar +
    trailing `ChevronDownIcon`, no label, `gap-2 py-1.5`. The chevron reads as a
    menu that drops *below*.
  - **Sidebar account trigger** (`AdminLayout`): full-width list row — `md`
    avatar + two-line name/place + trailing `ArrowRight01Icon` (`ml-auto`),
    `gap-3 px-4 py-3`. The arrow reads as navigation.
  - The difference is intentional and content-driven: a chevron for an in-place
    menu, an arrow for a navigational row.
- Destructive: `bg-destructive/10 text-destructive hover:bg-destructive/20`.
- Focus states: `focus-visible:border-ring focus-visible:ring-1
  focus-visible:ring-ring/50`.

### Cards

- Base: `rounded-none bg-card border border-border` with internal vertical gap
  (`--card-spacing`).
- Ticket-style: `bg-card border border-border` with the group-hover left-border
  reveal.
- Hover: `hover:border-border/80 transition-colors` (slight border brightening).
- **Padding — do not double it.** `Card` supplies its own vertical padding
  (`py-(--card-spacing)`); `CardContent` supplies only horizontal padding by
  default. Do **not** add a full-`p` override (`p-4`, `p-6`) to `CardContent`
  or a raw wrapper `div` inside a `Card` — it re-adds vertical padding on top of
  the Card's own. Instead:
  1. Default look → add no padding class.
  2. Inner gaps between children → `space-y-*` (not `p-*`).
  3. Genuinely different padding → `py-0` on the `Card`, then one `p-*` on the
     inner content. Never let both layers apply padding at once.

### Inputs

- Base: `h-8 rounded-none border border-input bg-transparent px-2.5` with
  `focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50`.
- Dark mode: `dark:bg-input/30`, `dark:disabled:bg-input/80`.
- Autofill override (dark only): WebKit autofill gets
  `box-shadow: 0 0 0 30px #1c1917 inset` with `text-fill-color: #fafaf9` to
  prevent the white flash.

### Tabs

- `line` variant: active tab gets a `0.5` (2px) bottom bar via an `::after`
  pseudo-element (`after:bg-foreground after:h-0.5 after:opacity-100`). Used in
  the user dashboard.
- `default` variant: segment style with `bg-muted` list and `bg-background`
  active triggers.

### Progress indicators

Progress visualizations are monochrome by design — the pipeline itself is
information, and painting each step its own hue would be decoration.

- Segments/bars for reached steps fill with a neutral foreground
  (`bg-foreground` on a `bg-muted` track); unreached stays `bg-muted`.
- Color appears only for a genuine alert outcome: a rejection/error terminal
  may collapse to a single full-width `--destructive` bar. Nothing else in a
  progress indicator may be colored.
- Terminal labels under the bar use the four-hue status set from §4; the bar
  itself is monochrome unless it is the destructive case.

### Intentional empty states

Do not leave dead space when there is no data.

- `border-dashed border-border p-8 text-center` box with a muted icon in a
  small centered square (`w-12 h-12 border border-border bg-card`).
- Provide a reassuring heading + description.

### Skeleton loading

- `animate-pulse` on the container.
- Bars: `bg-muted/50` for prominent elements, `bg-muted/30` for secondary
  lines.
- Vary widths (`w-3/4`, `w-1/2`, `w-full`) for realism.

## 6. Iconography

**Hugeicons only** (`@hugeicons/react` + `@hugeicons/core-free-icons`).

- **Style:** outline, 1.5–2px stroke width.
- **Rendering:** `<HugeiconsIcon icon={IconName} strokeWidth={2} className="size-X" />`
  (see `src/components/Logo.tsx` for the canonical pattern).
- **Sizing:** `size-*` utilities, never `w-* h-*` pairs. Primary
  navigation/actions `size-6`; secondary/list items `size-4`–`size-5`; micro
  actions `size-3`–`size-3.5`; inline with button text `size-3`/`size-4`.
- **Common icons:** `Building03Icon` (brand), `ArrowRight01Icon` (CTAs),
  `SearchIcon`, `Delete01Icon`, `Message01Icon`, `BellIcon`, `SettingsIcon`,
  `Logout01Icon`, `MapPinIcon`, `ChevronUpIcon`, `AddIcon`, `Cancel01Icon`,
  `SaveIcon`, `CheckmarkCircleIcon`, `CancelCircleIcon`.
- **Import pattern:**

  ```tsx
  import { HugeiconsIcon } from "@hugeicons/react";
  import { IconName01, IconName02 } from "@hugeicons/core-free-icons";
  ```

## 7. shadcn conventions

- `components.json` is the source of truth for shadcn config: style
  `radix-lyra`, stone base, icon library `hugeicons`, radius none.
- Key primitives already carry the house style — use them, don't restyle:
  `Button` (base `text-xs font-semibold` + `rounded-none`), `Card`
  (`--card-spacing`, `rounded-none`), `Separator` (`dashed` prop),
  `Input` (`h-8`), `Tabs`.
- Add missing components via `npx shadcn@latest add <component>`; never
  hand-author a primitive. Decline overwrites of existing files.
- **Selected/on states use the primary fill.** `data-[state=on]` triggers
  (ToggleGroup, Toggle) render `bg-primary text-primary-foreground border-primary`
  with `hover:bg-primary/80`, not shadcn's muted on-state. Overriding a
  primitive's on-state with `className` is the one sanctioned exception to the
  "className is for layout" rule — cite this doc in a comment when doing it.