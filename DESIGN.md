# DormWatch Design System

## 1. Design Philosophy

DormWatch bridges the gap between dormitory residents and housing management at LPNU. The interface must prioritize utility, accessibility, and institutional trust over flashy consumer trends.

We explicitly reject the "AI slop" aesthetic.
**Avoid:** Heavy gradients, soft glow drop-shadows, pill-shaped (`9999px`) corner radii, emojis as UI elements, and bulbous, floating components.
**Embrace:** Crisp borders, sharp edges, distinct visual hierarchy, utilitarian texture (dot grids + film grain noise), asymmetrical hover states (`4px` left-border reveal), and meaningful micro-visualizations (sparklines, progress steppers).

**Language:** The entire UI is in Ukrainian. All labels, buttons, headings, status text, and empty-state messages use Ukrainian copy. The only English text is the brand name "DormWatch" and technical identifiers (e.g. `#id`, email domains like `@lpnu.ua`).

---

## 2. Global Aesthetics & Motifs

### The "Blueprint" Texture
The application background utilizes two overlaid textures for depth: a dot matrix pattern and a film-grain noise overlay.

*   **Dot Grid:** A radial-gradient dot pattern on the `body` element.
    ```css
    /* Dark Mode */
    background-color: var(--background);
    background-image: radial-gradient(circle, rgba(120, 113, 108, 0.3) 1px, transparent 1px);
    background-size: 24px 24px;

    /* Light Mode */
    background-color: var(--background);
    background-image: radial-gradient(circle, rgba(214, 211, 209, 0.5) 1px, transparent 1px);
    background-size: 24px 24px;
    ```
*   **Noise Overlay:** A fixed, full-viewport `::after` pseudo-element with an inline SVG `feTurbulence` filter, blended at 3% opacity via `mix-blend-mode: overlay`. This adds an analog, printed-paper texture.
    ```css
    body::after {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.03;
      mix-blend-mode: overlay;
      background-image: url("data:image/svg+xml,...");
      background-size: 256px 256px;
    }
    ```

### The "Ticket" Motif
Complaint cards and data containers feel like physical work orders.
*   **Categorization:** Use inline Tailwind utilities — `text-xs font-semibold text-foreground` for form/section labels, `text-xs font-normal text-muted-foreground` for metadata.
*   **Separators:** Dashed borders via `<Separator dashed />` to divide card sections. Solid separators for page-level and header boundaries.
*   **Status Indicators:** Small, crisp, rectangular badges with high-contrast text and a subtle, translucent background fill (see Semantic Status Colors below).

### Asymmetrical Hover States
Interactions feel mechanical and precise.
*   Instead of lifting elements with a drop-shadow on hover, reveal a solid `1px` left border in the primary accent color (`blue-500`), accompanied by a slight text color shift.
*   Implemented via a `1px` absolute bar (`w-1`) that transitions from `opacity-0` to `opacity-100` on group hover.
*   The `link-hover` pattern: `border-left: 4px solid var(--primary)` combined with `translateX(0.25rem)` and `padding-left: 0.5rem`.

### The "Auth Field" Interaction
Form inputs on the login/register pages use a custom focus treatment: a `3px` solid left border in `var(--primary)` crops in via `border-left-color` transition, accompanied by a `padding-left` shift of `0.5rem`. This creates the effect of the field "indenting" when focused.

---

## 3. Typography

### 3.1 Core Rules

1. **No raw CSS for visual styles.** Every visual style must use Tailwind utility classes directly in JSX. The only exceptions: CSS custom properties for theme tokens, keyframe animations, and imperative CSS that cannot be expressed as Tailwind utilities (background textures, SVG filters, noise overlays).
2. **No bracket classes where the named scale covers the value.** `text-[10px]`, `w-[420px]`, `h-[32px]`, `gap-[12px]`, `px-[16px]` are banned if `text-xs`, `w-96`, `h-8`, `gap-3`, `px-4` exist. Arbitrary values (`[brackets]`) are only acceptable for truly non-standard dimensions — layout edge cases like `top-[calc(50%-20px)]`. If you reach for brackets, check the Tailwind docs first.
3. **No positive letter-spacing.** `tracking-wider`, `tracking-widest`, and `letter-spacing` with positive values are banned. They are the typographic equivalent of purple gradients — an artificial "design" signal with no functional purpose.
4. **`tracking-tight` (negative letter-spacing) is allowed only on display sizes** — Hero (`text-5xl+`) and H1 (`text-2xl+`). Inter's default kerning at large sizes benefits from it.
5. **No arbitrary pixel font sizes.** `text-[Npx]` is forbidden. Minimum `text-xs` (12px). Use only the named scale.
6. **No 8px, 9px, 10px, or 11px text anywhere.** If content doesn't fit at `text-xs`, the layout is wrong.
7. **No uppercase-only convention.** Let content determine its case. Forced uppercase (`uppercase`) is only acceptable for status badges.
8. **No `.micro-label` as a generic utility.** All labels use inline Tailwind utilities.
9. **No per-instance button typography overrides.** Button label styling is defined once in the Button component and never overridden with `className`.

### 3.2 Type Scale

| Token | Size | Weight | Tracking | Where |
|---|---|---|---|---|
| Hero (H0) | `text-5xl` / `md:text-6xl` | `font-bold` | `tracking-tight` | Landing page hero only |
| Page title (H1) | `text-2xl` / `md:text-3xl` | `font-bold` | `tracking-tight` | Top of every page/section |
| Section title (H2) | `text-lg` / `md:text-xl` | `font-semibold` | none | Group headings |
| Card title (H3) | `text-sm` | `font-semibold` | none | Complaint / ticket card titles |
| Body | `text-sm` | `font-normal` | none | Paragraphs, descriptions |
| Metadata | `text-xs` | `font-normal` | none | Dates, locations, secondary info |
| Badge label | `text-xs` | `font-semibold` | none | Status / category badges |
| Button label | defined in Button component | `font-semibold` | none | All buttons use component default |
| Data value | `text-sm` | `font-normal` | none | Displayed user data, counts |

**Weight rules:**
- Only three weights in use: `font-bold`, `font-semibold`, `font-normal`
- `font-medium` is not used — it's visually ambiguous between normal and semibold
- `font-bold` = headings only (H0, H1)
- `font-semibold` = subheadings (H2, H3), labels, buttons
- `font-normal` = everything else

### 3.3 Button Typography

Defined once in `components/ui/button.tsx`. Currently uses `text-xs font-medium` — change to `text-xs font-semibold` and remove the tracking. Never add `className` typography overrides at call sites. If a button needs visual distinction, use the `variant` or `size` props, not font overrides.

### 3.4 Contrast Requirement

All text using `text-xs` or smaller must maintain a minimum 4.5:1 contrast ratio against its background. `--muted-foreground` (#a8a29e) on `--card` (#292524) passes AA for 12px text (~6.3:1).

---

## 4. Color System

### CSS Custom Properties (OKLCH)
Colors are defined as OKLCH custom properties in `index.css` under `:root` and `.dark` selectors. The `.dark` class is applied to wrapper elements to activate dark mode.

**Dark Mode (Current Default) Tokens:**
| Token | OKLCH Value | Visual | Usage |
|---|---|---|---|
| `--background` | `oklch(0.147 0.004 49.25)` | `#1C1917` (Stone 900) | App background |
| `--foreground` | `oklch(0.985 0.001 106.423)` | `#FAFAF9` (Stone 50) | Primary text |
| `--card` | `oklch(0.216 0.006 56.043)` | `#292524` (Stone 800) | Surface/cards |
| `--muted` | `oklch(0.268 0.007 34.298)` | Stone 700 ilk | Muted surfaces |
| `--muted-foreground` | `oklch(0.709 0.01 56.259)` | `#A8A29E` (Stone 400) | Secondary text |
| `--primary` | `oklch(0.424 0.199 265.638)` | Blue 800 | Brand accent |
| `--primary-foreground` | `oklch(0.97 0.014 254.604)` | Light blue 50 | Text on primary |
| `--destructive` | `oklch(0.704 0.191 22.216)` | Red 500 | Danger / delete |
| `--border` | `oklch(1 0 0 / 10%)` | `rgba(255,255,255,0.1)` | Borders |

**Light Mode Tokens:**
| Token | OKLCH Value | Visual | Usage |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` | White | App background |
| `--foreground` | `oklch(0.147 0.004 49.25)` | `#1C1917` (Stone 900) | Primary text |
| `--card` | `oklch(1 0 0)` | White | Surface/cards |
| `--muted-foreground` | `oklch(0.553 0.013 58.071)` | `#57534E` (Stone 600) | Secondary text |
| `--border` | `oklch(0.923 0.003 48.717)` | `#E7E5E4` (Stone 200) | Borders |

### Primary Accent (Brand/Action)
*   **Primary Button Default:** `bg-primary` (mapped to `blue-800`)
*   **Primary Button Hover:** `hover:bg-primary/80`
*   **Inline Accent:** `text-blue-400` (dark mode) / `text-blue-600` (light mode) — used for links, highlighted text, and interactive elements.
*   **Hover Left-Border Accent:** `bg-blue-500` — the 1px left-reveal bar on cards and list items. For link/text hover patterns, use `var(--primary)` via the `link-hover` style instead.

### Semantic Status Colors (Tailwind-based)
Applied via Tailwind utility classes (e.g. from `complaintUtils.ts`):

*   **Pending (Жовтий):** `text-yellow-500 bg-yellow-500/10 border-yellow-700/50`
*   **In Progress / Approved (Синій):** `text-blue-500 bg-blue-500/10 border-blue-700/50`
*   **Resolved (Зелений):** `text-green-500 bg-green-500/10 border-green-700/50`
*   **Urgent / Rejected (Червоний):** `text-red-500 bg-red-500/10 border-red-700/50`

---

## 5. UI Components & Geometry

### Shape & Radius (Strictly Sharp)
*   **Standard Radius:** `rounded-none` (0px) for **all** cards, buttons, dialogs, avatars, inputs, badges, tabs, and selects.
*   **CSS Variable:** `--radius: 0` is set globally in both `:root` and `.dark`.
*   **Strict Rule:** No rounded corners anywhere. The interface relies entirely on sharp, structural 90-degree angles.
*   **Exception — Radio Group:** Radio group items and their indicator dots retain `rounded-full`. Circular radio indicators are a platform convention that aids visual distinction from checkboxes. This is the only component exempt from the zero-radius rule.

### Surface Opacity Tiers
`bg-muted` is used at three opacity levels depending on depth. An element should use the lowest opacity tier that provides sufficient visual separation:

| Tier | Usage |
|---|---|
| `bg-muted` | Static surfaces needing a visible background fill (tab list, future stepper bars, icon boxes) |
| `bg-muted/50` | Hover states, lighter surface fills (outline button hover, cross-link cards, table header row) |
| `bg-muted/30` | Subtle background tints behind content (comment section, skeleton secondary bars) |

### Buttons
*   **Primary Action Buttons:** `bg-primary text-primary-foreground hover:bg-primary/80`, `font-semibold`, square corners, `h-8` default, `h-9` for `lg`, `h-6` for `xs`.
*   **Outline Buttons:** `border-border bg-background hover:bg-muted hover:text-foreground`.
*   **Ghost Buttons:** Used for icon-only actions, secondary triggers. `text-muted-foreground hover:bg-muted hover:text-foreground`.
*   **Destructive Buttons:** `bg-destructive/10 text-destructive hover:bg-destructive/20`.
*   **Focus States:** `focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50`.

### Cards
*   **Card base:** `rounded-none bg-card border border-border` with vertical internal gap (`--card-spacing`).
*   **Ticket-style cards:** `bg-card border border-border` with the group-hover left-border reveal pattern.
*   **Card hover:** `hover:border-border/80 transition-colors` (slight border brightening).

### Inputs
*   **Base:** `h-8 rounded-none border border-input bg-transparent px-2.5` with `focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50`.
*   **Dark mode:** `dark:bg-input/30` with `dark:disabled:bg-input/80`.
*   **Autofill override (dark mode only):** WebKit autofill gets `box-shadow: 0 0 0 30px #1c1917 inset` with `text-fill-color: #fafaf9` to prevent white flash.

### Tabs
*   **Variant: `line`**: Underline-style tabs. The active tab gets a `0.5` (2px) bottom bar via an `::after` pseudo-element (`after:bg-foreground after:h-0.5 after:opacity-100`). Used in the User Dashboard.
*   **Variant: `default`**: Pill/segment style with `bg-muted` background on the list and `bg-background` on active triggers.

### Progress Stepper
Used in `TicketCard` to visualize complaint lifecycle. Three stages: "Створено" → "В роботі" → "Вирішено".
*   Rendered as three 1.5-height bars (`h-1.5`) with `gap-0.5`.
*   Completed stages: `bg-blue-500`.
*   Current stage: `bg-blue-500 animate-pulse` (for in-progress) or solid `bg-blue-500`.
*   Future stages: `bg-muted`.

### Sparkline
A minimal bar-chart micro-visualization used in `StatCard` for admin dashboards.
*   Rendered as `flex items-end gap-px` bars inside a `48px` height container.
*   Most recent bar uses the `color` prop at full opacity; historical bars use `currentColor` at 30% opacity.
*   Appears at the bottom of `StatCard`, fading in on group hover (`opacity-20 → opacity-100`).

### Intentional Empty States
Do not leave dead space when there is no data.
*   Use `border-dashed border-border p-8 text-center` box with a muted icon inside a small centered square container (`w-12 h-12 border border-border bg-card`).
*   Provide a reassuring heading + description.
*   Pattern: `border-dashed border-border p-8 text-center`.

### Skeleton Loading
Consistent animated skeleton placeholders for async content.
*   `animate-pulse` on the card container.
*   Interior bars use `bg-muted/50` for prominent elements and `bg-muted/30` for secondary lines.
*   Varying bar widths (`w-3/4`, `w-1/2`, `w-full`) for visual realism.

---

## 6. Iconography

The project uses **Hugeicons** exclusively.

*   **Hugeicons** (`@hugeicons/react` + `@hugeicons/core-free-icons`): The sole icon set used across the entire application.
    *   **Style:** Outline, 1.5–2px stroke width.
    *   **Rendering:** All icons are rendered via `<HugeiconsIcon icon={IconName} strokeWidth={2} className="size-X" />`.
    *   **Sizing:** Use Tailwind `size-*` utilities instead of `w-* h-*` pairs (e.g., `size-4` for 16px).
        *   Primary navigation/actions: `size-6`.
        *   Secondary/list items: `size-4` to `size-5`.
        *   Micro actions: `size-3` to `size-3.5`.
        *   Inline with button text: `size-3` or `size-4` with `mr-1`/`mr-1.5`/`mr-2`.
    *   **Common icons:** `Building03Icon` (brand), `ArrowRight01Icon` (CTAs), `SearchIcon`, `Delete01Icon`, `Message01Icon`, `BellIcon`, `SettingsIcon`, `Logout01Icon`, `MapPinIcon`, `ChevronUpIcon`, `AddIcon`, `Cancel01Icon`, `SaveIcon`, `CheckmarkCircleIcon`, `CancelCircleIcon`.
    *   **Import pattern:**
        ```tsx
        import { HugeiconsIcon } from "@hugeicons/react";
        import { IconName01, IconName02 } from "@hugeicons/core-free-icons";
        ```

---

## 7. Page Layouts & Architecture

### App Shell
*   **Landing/Home** (`/`): Standalone page, no `Header`/`Footer` wrapper. Own full-page `dark` wrapper.
*   **Auth** (`/auth`): Standalone, centered card layout, no `Header`/`Footer`.
*   **Admin** (`/admin/*`): Standalone layout with `AdminSidebar` + content area. No `Header`/`Footer`.
*   **Authenticated Pages** (`/user`, `/create-report`, `/dashboard`): Wrapped with `<Header />` + `<main className="flex-1">` + `<Footer />`.

### Landing Page (`/`)
The marketing/landing page for unauthenticated visitors. Auto-redirects logged-in users.
*   **Sticky nav:** `bg-background/80 backdrop-blur-md sticky top-0 z-50` with `Separator` bottom border.
*   **Brand mark:** `Building2` icon + "DormWatch" in `text-blue-500 font-bold text-xl tracking-tight`.
*   **Nav links:** "Як це працює", "Поширені запитання", "Екстрені контакти" — `text-muted-foreground` hover to `text-foreground`.
*   **Hero Section:** Two-column grid (`lg:grid-cols-2`). Left: headline with `text-blue-400` accent span, body text, two CTA buttons. Right: stylized mock-ticket illustration (layered borders with `rotate-3` / `-rotate-2` transforms and opacity stacking, containing skeleton ticket cards with hover left-border reveal).
*   **Stats Banner:** 4-column grid with `divide-x divide-border`. Large stat numbers (`text-3xl font-bold`) + `text-xs font-normal text-muted-foreground` descriptions.
*   **Features Grid:** 3-column grid of feature cards. Each card: `bg-card border border-border p-8` with icon in `w-12 h-12 border border-border bg-muted` box, group-hover left-border reveal.
*   **CTA Section:** Centered text + primary button. `bg-background py-20`.

### Auth Page (`/auth`)
Dual-mode form page (login / register) controlled by `?tab=register` query param.
*   **Layout:** Centered card (`max-w-lg`) with brand mark, heading, and subtitle above.
*   **Login card:** Email (validated `@lpnu.ua`), password. "Забули пароль?" link.
*   **Register card:** First name, last name, `@lpnu.ua` email, building → room cascade (dynamic fetch), password + confirm.
*   **Cross-link card:** Below main card, a `bg-muted/50` card with `w-1 bg-muted-foreground` left accent bar, linking between login/register.
*   **Error banner:** `border border-destructive/40 bg-destructive/10` box with `text-xs` error text.
*   **Back link:** Below card, "Повернутися на головну" with `ArrowLeft01Icon` that translates `-x-1` on hover.

### User Dashboard (`/user`)
Tabbed dashboard for authenticated residents.
*   **Tabs:** `line` variant with two triggers: "Панель" and "Мої заявки".
*   **Dashboard tab:**
    *   Greeting: `text-3xl font-bold text-foreground` + location with `MapPin` icon.
    *   **CTA block:** Full-width `bg-primary` card with `Wrench` icon in `w-12 h-12 border border-white/20 bg-white/10` box. Arrow icon translates `+x-2` on hover. Contains a gradient overlay that fades in on hover.
    *   **Active tickets:** 2/3 column. Uses `TicketCard` components (max 5 rendered). "Історія" link to `/dashboard`.
    *   **Community board:** 1/3 column. Uses `CommunityBoard` component with dashed-border empty state + `BellOff` icon.
*   **Reports tab:** Full list of user's own complaints. Same card pattern as Dashboard feed but with inline vote counts and `Trash2` delete button with `border border-destructive/30 hover:bg-destructive/10`.

### Problem Feed (`/dashboard`)
Public/semi-public view of all approved complaints with filtering and voting.
*   **Filters toolbar:** Search input (`w-48`) with inline `Search` icon, building `Select`, priority `Select` (all `h-8 text-xs`).
*   **Category pills:** Outline/default toggle buttons in `text-xs font-semibold`.
*   **Content grid:** `lg:grid-cols-3`, 2/3 for complaint list, 1/3 for sidebar action cards.
*   **Complaint cards:** Vote-up button (left column, `Separator orientation="vertical" dashed`), status + category badges, title, description, optional photo (click-to-zoom via `Dialog`), `Separator dashed`, date + comments toggle.
*   **Sidebar:** Primary-colored action card (`bg-primary text-primary-foreground`) with context-dependent CTA (admin → "Перейти в комендант-центр", user → "Створити нову заявку").

### Create Report (`/create-report`)
Multi-section form for submitting new complaints.
*   **Back button:** `border border-border hover:border-primary hover:bg-primary/5`.
*   **Category selector:** 2×2 / 4-column grid of icon+label buttons. Active: `variant="default"`, inactive: `variant="outline"`, `border-2`.
*   **Priority selector:** 3 outline/default toggle buttons (`Низький / Середній / Високий`), `flex-1`.
*   **Form fields:** Title, place name, description (`Textarea`, `min-h-36 resize-none`). All with `text-xs font-semibold text-foreground` label above.
*   **Photo upload:** Square `aspect-square` drop zone with `border-2 border-dashed`. Shows preview with `X` overlay button when photo selected.
*   **Submit button:** Full-width, button label styling per §3.4.

### Admin Dashboard (`/admin`)
Sidebar + main content layout for administrators.
*   **Sidebar:** `AdminSidebar` component with user identity (initials avatar, name, role), navigation links.
*   **Header bar:** `h-16 bg-card` with page title + "Експорт даних" (outline) and "Нове замовлення" (primary) buttons.
*   **Stat cards:** 3-column grid of `StatCard` components (Очікує / В роботі / Вирішено) with colored sparklines.
*   **Recent complaints table:** `bg-card border border-border` container with `Table` component. Rows are clickable, opening `ComplaintSidePanel` (sheet).

---

## 8. Component Patterns

### TicketCard
Compact complaint summary used in the User Dashboard.
*   **Props:** `id`, `title`, `description`, `category`, `date`, `status`, `location?`, `categoryLabel?`.
*   **Layout:** Category `text-xs font-normal text-muted-foreground` + bullet + date → status badge → title + description → `Separator` → `ProgressStepper` + `#id`.
*   **Hover:** Group hover reveals `w-1 bg-blue-500` left bar, title shifts to `text-blue-400`.

### StatCard
Metric display for admin dashboard.
*   **Props:** `icon`, `label`, `value`, `sparklineColor?`, `sparklineData?`, `loading?`.
*   **Layout:** Icon + `text-xs font-semibold text-foreground` → large `text-3xl font-bold` value → optional sparkline bar chart at bottom (hidden at 20% opacity, revealed to 100% on hover).
*   **Skeleton:** Custom `StatCardSkeleton` with `animate-pulse` and mock sparkline bars.

### CommunityBoard
Empty-state placeholder for building announcements.
*   Dashed-border container with `BellOff` icon in square box, heading, and description.

### CommentSection
Embedded comment panel that toggles below complaint cards.
*   Rendered inside a `bg-muted/30` background.
*   Separated from card content by `<Separator dashed />`.

### LoadingSpinner
Minimal CSS spinner for loading states.
*   **Sizes:** `sm` (16px, `border-2`), `md` (32px, `border-2`), `lg` (40px, `border-2`).
*   **Pattern:** `border-primary border-t-transparent animate-spin`. Sometimes customized with `className="border-blue-500"`.

### ComplaintSidePanel
Slide-out sheet (`Sheet` / `Dialog` variant) for viewing/editing individual complaints in the admin dashboard.

---

## 9. Frontend Implementation (React & shadcn/ui)

To enforce this exact design system in the React frontend, the project is initialized using `shadcn/ui` with a highly specific configuration preset.

```bash
npx shadcn@latest init --preset b1ZhP5EQy
```

**Preset Configuration:**
*   **Style:** Lyra
*   **Base Color:** Stone (warm gray)
*   **Theme / Chart Color:** Blue
*   **Font / Heading Font:** Inter Variable
*   **Radius:** None (0px)

### Key shadcn/ui Component Overrides
All components override `rounded-none` globally:

| Component | Key Overrides |
|---|---|
| `Button` | `rounded-none` on base and all sizes (`xs`, `icon-xs`, `icon-sm`). Sizes: `xs (h-6)`, `sm (h-7)`, `default (h-8)`, `lg (h-9)`, `icon (size-8)`, `icon-xs (size-6)`, `icon-sm (size-7)`, `icon-lg (size-9)`. |
| `Badge` | `rounded-none`, height `h-5`, `px-2 py-0.5`. |
| `Card` | `rounded-none`, uses `border border-border`. `--card-spacing` token. |
| `Input` | `rounded-none h-8`, dark mode `bg-input/30`. |
| `Tabs` | `rounded-none` on list and triggers. Line variant uses `::after` pseudo for active underline. |
| `Separator` | Extended with `dashed?: boolean` prop. When dashed: `border-dashed border-t` (horizontal) or `border-l` (vertical). |
| `Table` | Standard shadcn — uses semantic variables (`bg-card`, `bg-muted/50`, `border-border`, `text-muted-foreground`, `text-foreground`). |

---

## 10. Routing & Auth Flow

| Path | Layout | Auth Required | Role |
|---|---|---|---|
| `/` | Standalone | No (redirects if logged in) | Public |
| `/auth` | Standalone | No | Public |
| `/auth?tab=register` | Standalone | No | Public |
| `/user` | Header + Main + Footer | Yes | Resident |
| `/create-report` | Header + Main + Footer | Yes (redirects admin) | Resident |
| `/dashboard` | Header + Main + Footer | No (enhanced if logged in) | Public |
| `/admin` | Sidebar layout | Yes (admin only) | Admin |
| `/admin/complaints` | Sidebar layout | Yes (admin only) | Admin |

**Auth redirect logic:**
*   Logged-in users visiting `/` are redirected to `/user` (residents) or `/admin` (admins).
*   Admins visiting `/create-report` are redirected to `/admin`.
*   Unauthenticated users visiting `/user` are redirected to `/`.

---

## 11. Data Model (Frontend-facing)

### Complaint / Problem
| Field | Type | Description |
|---|---|---|
| `id` | `number` | Unique identifier, displayed as `#id` |
| `title` | `string` | Short headline |
| `description` | `string` | Detailed description |
| `category` | `"plumbing" \| "electricity" \| "furniture" \| "internet"` | Category key |
| `status` | `"pending" \| "approved" \| "rejected" \| "resolved"` | Lifecycle status |
| `priority` | `"low" \| "medium" \| "high" \| "critical"` | Urgency level |
| `building` | `string` | Building name |
| `placeName` | `string` | Room / location description |
| `votesCount` | `number` | Community upvotes |
| `photoUrl` | `string \| null` | Full-size photo URL |
| `thumbnail` | `string \| null` | Thumbnail photo URL |
| `createdAt` | `string` (ISO date) | Creation timestamp |
| `user_id` | `number` | Owner's user ID |

### User Profile
| Field | Type | Description |
|---|---|---|
| `user` | `number` | User ID |
| `email` | `string` | Must end in `@lpnu.ua` |
| `first_name` | `string` | Given name |
| `last_name` | `string` | Family name |
| `building` | `string` | Assigned building name |
| `room` | `string` | Assigned room number |
| `place` | `{ place_name: string }` | Full place object |
| `role` | `{ role_name: string }` | "admin" / "адміністратор" for admin access |

### Category Labels
| Key | Ukrainian Label |
|---|---|
| `plumbing` | Сантехніка |
| `electricity` | Електрика |
| `furniture` | Меблі |
| `internet` | Інтернет |

### Status Labels
| Key | Ukrainian Label |
|---|---|
| `pending` | Очікує |
| `approved` | Активно |
| `rejected` | Відхилено |
| `resolved` | Вирішено |

### Priority Labels
| Key | Ukrainian Label |
|---|---|
| `low` | Низький |
| `medium` | Середній |
| `high` | Високий |
| `critical` | Критично |
