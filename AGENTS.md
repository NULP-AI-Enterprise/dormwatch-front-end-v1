# dormwatch-web-app

Vite + React 19 + TypeScript frontend for DormWatch — a dormitory issue
tracking system at LPNU. Tailwind CSS v4 with shadcn/ui (style `radix-lyra`,
stone base, Hugeicons icons), React Router v7, data served by the sibling repo
`dormwatch-server` (Django + DRF REST API under `/api/`). Workspace-level
conventions live in the root `CLAUDE.md`.

## Commands

- `npm run dev` — Vite dev server
- `npm run lint` — ESLint (no typecheck)
- `npm run build` — `tsc -b` typecheck + `vite build`

## Golden rules (non-negotiable)

- **Ukrainian copy only.** All labels, buttons, headings, status text, and
  empty states are Ukrainian. The only English: the brand "DormWatch" and
  technical identifiers (e.g. `#id`, email domains like `@lpnu.ua`).
- **No "AI slop" aesthetic.** No heavy gradients, soft glow shadows, pill
  radii, emojis-as-UI, or floating components. Crisp borders, sharp edges,
  clear hierarchy.
- **Sharp corners everywhere** (`--radius: 0`). The only exceptions: radio
  indicators and the `LoadingSpinner` (both keep `rounded-full`).
- **No raw CSS for visuals.** Visual styles use Tailwind utilities in JSX;
  `index.css` holds only tokens.
- **Named type scale only.** No `text-[Npx]`, no bracket classes where a named
  class exists, no positive `tracking-*`, no `font-medium`, no text below
  `text-xs`. Three weights only: `font-bold`, `font-semibold`, `font-normal`.
- **Semantic color tokens only.** Status colors come from
  `src/lib/complaintUtils.ts`; never raw hex or `bg-blue-500`.
- **Hugeicons only**, rendered via `<HugeiconsIcon icon={...} className="size-*" />`
  (see `src/components/Logo.tsx`). Never another icon set.
- **Compose shadcn primitives** in `src/components/ui` before hand-rolling
  markup; add missing ones with `npx shadcn@latest add <component>`.
- **Per-feature priority/status/category labels** must read from the shared
  sources in `src/lib/complaintUtils.ts` — never hard-code strings.

## Architecture (stable subset)

- **App shells:** landing `/` and `/auth` are standalone; `/user`,
  `/create-report`, `/dashboard` are wrapped in `Header` + `Footer`; `/admin/*`
  uses `AdminLayout` with a sidebar.
- **Auth redirects:** logged-in users on `/` go to their role home; admins on
  `/create-report` go to `/admin`; unauthenticated users on `/user` go to `/`.
- **Data flows** through `src/services` with shared types in
  `src/lib/types.ts`.

## Workspace conventions

- **Commits:** work on a feature branch (`feature/<name>`) — never commit
  directly to `main`. Conventional Commits (`type(scope): summary`), 1–2 lines,
  only after end-to-end verification. A green typecheck is not verification.
- **Full-loop rule:** every API field must have a UI read *and* write control.
  "Editable via `/admin/` or DB" does not count as done — trace the write path
  (endpoint + form/input) for every persisted field. Shell/DB is fine for
  testing only.
- **shadcn skill:** invoke the `shadcn` skill when building or changing UI.
  Compose existing primitives before writing custom markup; add components via
  the CLI (decline overwrites); read `npx shadcn@latest docs <component>`
  before using one. `className` is for layout, not restyling a primitive's
  colors/typography — the one sanctioned exception is enforcing the design
  system, and it must cite the section in a comment.
- **Design system is authoritative** for look-and-feel: `.agents/design-system.md`.
  Reconcile shadcn defaults to it, not the other way around.
- **Authenticated test requests** need a Bearer token minted server-side — see
  `dormwatch-server/AGENTS.md` (never change a user's password).

## References

- `.agents/design-system.md` — the visual spec (authoritative)
- `components.json` — shadcn config (style, base color, icon library)
- `src/lib/types.ts` — shared data types
- Root `CLAUDE.md` — workspace-wide conventions
