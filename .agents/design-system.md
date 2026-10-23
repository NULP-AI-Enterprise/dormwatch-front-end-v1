# DormWatch design system

Approved audit decisions, 2026-10-23. This is the stable visual and interaction
contract; page-specific behavior remains in the components.

## 1. Principles and language

Prioritize useful hierarchy, accessibility, and clear institutional communication.
Use Ukrainian for visible and accessible labels, validation, calendar navigation,
dismiss buttons, notifications, and empty states. DormWatch, identifiers, and
email domains retain their original spelling.

Use flat surfaces, crisp boundaries, and square corners. Avoid decorative
gradients, shadows, pill shapes, and a different hue for every category.
State, selection, unread indicators, and error feedback must also carry text,
an icon, or a programmatic state; color alone is insufficient.

## 2. Typography and responsiveness

Inter Variable is bundled through the application entry point so Vite emits its
font assets. Include Latin and Cyrillic glyph coverage. A production check must
fetch emitted font URLs and render Ukrainian text.

Use the named type scale. Metadata and compact labels use text-xs; body uses
text-sm; card titles use text-sm font-semibold; section titles use text-lg or
text-xl; page titles use text-2xl or text-3xl. The house minimum of text-xs is a
design choice, not a WCAG minimum font-size rule.

Useful variants:
- Brand and hero: display sizes and font-bold with optional tracking-tight.
- Statistics: text-2xl/text-3xl font-bold; values retain readable units.
- Accordion and disclosure: text-sm font-medium or font-semibold.
- Secondary data and compact labels: font-normal or font-medium.
- Print: explicit table/header hierarchy and page-breaking rules; never tiny
  text as a substitute for a usable preview container.
- Button typography belongs to the shared size variant.

Avoid arbitrary pixel text sizes, extra letter spacing, and uppercase-only
headings. A badge may use uppercase, but its readable label is still required.
Do not blanket-normalize weights without examining the semantic role.

Reflow normal content at narrow widths and 200% zoom. Use min-w-0, wrapping,
and responsive grids before clipping or hiding overflow. Dense tables may have
an independently scrollable, named region. Never hide global horizontal
overflow to conceal an off-screen action.

## 3. Color and contrast

src/index.css owns theme tokens. src/lib/complaintUtils.ts maps lifecycle and
priority meanings; StatusBadge and RoleBadge own shared presentation.
Do not duplicate mappings in cards, filters, comments, or analytics.

Palette A (foreground / tinted background):

| Meaning | Light | Dark |
|---|---|---|
| Awaiting action | #92400e / #fffbeb | #fcd34d / #30271b |
| Approved or in progress | #075985 / #f0f9ff | #7dd3fc / #152a36 |
| Success | #166534 / #f0fdf4 | #86efac / #172e22 |
| Rejected, error, critical, overdue | #991b1b / #fef2f2 | #fca5a5 / #341c20 |
| Neutral, including review | #57534e / #f5f5f4 | #d6d3d1 / #292524 |

Use status-*-bg for a badge background and status-* for its foreground.
Neutral review is an explicit product decision. Withdrawn is neutral.
Not accepted and rejected use the danger meaning.
Role badges retain distinct identity cues: administrator yellow/amber, worker
orange, and student blue. RoleBadge owns the mapping; --role-* tokens define
readable foreground/background pairs in both themes. Unknown roles stay neutral.
Critical priority may use danger; remaining priorities stay neutral.
High and critical are both included in the separate urgent filter/count.

The primary fill and primary-foreground pair belong to filled actions and
selected controls. Link text uses --link (#075985 light / #7dd3fc dark).
Never use the dark-theme primary fill as small text on a dark surface.
Muted foreground is #57534e light / #d6d3d1 dark.
Destructive foreground must always be defined.

Normal text, including 12–18px text, needs at least 4.5:1 against its actual
rendered background; large text needs 3:1. Evaluate hover/selected states,
opacity, and composited backgrounds too. Logos and disabled controls have
contrast exceptions; do not count these as ordinary text failures.
Focus and essential control boundaries need appropriate non-text contrast.
Verify measured contrast rather than deriving it from a palette shade number.

Meaningful exceptions to neutral surfaces include selected controls, unread
notifications, contextual success/error messages, and rework/completion feedback.
They use semantic tokens and an explicit label. Charts use color to communicate
status, not a decorative hue spectrum. Role colors communicate the
administrator/worker/student distinction.

## 4. Interaction and accessibility

Compose shared shadcn primitives. Use Button for actions, links for navigation,
ToggleGroup for exclusive visible choices, Checkbox/Switch for boolean state,
Collapsible for disclosure, and Popover for anchored filters. Use shared Sheet
for mobile admin navigation. Close the drawer on navigation.

Controls have persistent accessible names. Associate a visible field label
with its input; placeholder text alone does not replace it. Icon-only controls
need a Ukrainian aria-label. Selection/disclosure expose checked, pressed,
selected, or expanded state through their primitive.

Keyboard focus is a stable, visible 2px ring/outline with no text movement.
Do not indent the input value on focus. Preserve focus visibility and space
around the ring. Popovers/dialogs support Escape and focus return; nested
selectors/calendars must dismiss the correct layer first.

Photo previews are buttons. File uploads retain a focusable native file input
and visible focus treatment. Copy and delete actions are keyboard reachable.
Touch and keyboard feedback must not depend on pointer hover.

The optional ticket hover motif is a 4px bar (w-1), not 1px. It occupies reserved
space or overlays the boundary without shifting content. Hover may change
surface/text color; movement and shadows are not required. Respect reduced
motion for nonessential animations.

## 5. Geometry, surfaces, and shared variants

Square corners apply to cards, dialogs, menus, buttons, avatars, tabs, and
form fields. Radio indicators and circular LoadingSpinner are exceptions.

App chrome uses bg-card with solid border-border boundaries. Content uses
bg-background. Internal ticket divisions use dashed Separator; page, table,
and structural boundaries remain solid.

Card may use an inset ring or a border if it provides the same visible boundary
without changing layout. The current shared ring is accepted. Avoid adding
vertical padding in both Card and CardContent: use content spacing, or disable
Card padding and apply it once to the inner wrapper.

Surface tiers: bg-muted for separation, bg-muted/50 for subtle hover/header
fills, bg-muted/30 for subordinate content and secondary skeleton bars.

Button variants:
- default: primary fill with primary-foreground; principal action.
- outline: visible boundary and neutral surface; secondary action.
- ghost: neutral text/surface on hover; chrome and contextual actions.
- destructive: semantic danger feedback with readable contrast.
- link: --link foreground with underline feedback.

Size variants: default 32px, sm 28px, xs 24px, lg 36px, touch minimum 44px
with text-sm, content for composite triggers or wrapping photo/text actions.
Icon variants follow the corresponding square size. Preserve larger auth and
worker actions; do not shrink them for mechanical consistency.
WCAG 2.2 AA target sizing is 24x24 CSS pixels with stated exceptions; enhanced
AAA is 44x44. Check width, height, and spacing together.

Toggle/ToggleGroup selected state uses primary fill, primary-foreground and a
primary boundary. Tabs may use an explicit underline or selected surface.
Processing-status distribution bars and their legend use shared semantic status
fills: success green, in-progress blue, approved cyan, pending amber, and
not-accepted red. Review remains neutral. Shared statusChartColor owns the
mapping so the chart and legend cannot drift. Counts and labels remain visible.

## 6. Empty, loading, and error states

Full-page emptiness: a dashed panel, heading, useful explanation, and optional
next action. Nested sections: a compact message with normal spacing is enough.
Do not put large empty panels in every resource/comment sub-section.

Skeletons distinguish prominent and subordinate bars; honor reduced motion.
Network failure is never an empty-data state. Show a specific Ukrainian error
and retry action. Preserve entered values and selected filters on failures.
Disable duplicate submissions while saving. Permission-dependent actions use
server capabilities; hidden controls alone are not authorization.

## 7. Icons and implementation boundaries

Use Lucide. A call site may choose size-*; otherwise the shared primitive owns
its default icon size. Do not apply competing size rules at both levels.
Keep icon-only actions named and decorative icons hidden from assistive tech.

Use Tailwind utilities for ordinary visuals. Exact named equivalents are
preferred, but w-96 is not equivalent to 420px and text-xs is not equivalent
to 10px. Changing geometry requires a layout check.
Scoped CSS is appropriate for print pagination/table behavior, browser autofill,
keyframes, and rules utilities cannot reasonably express. Theme colors still
come from tokens. Do not enforce a blanket CSS ban.

## 8. Print and previews

The document preview and printed document follow the app theme, as requested.
Screen controls wrap and stay outside the independently scrollable document
region; print removes the controls and scroll restriction. Tables repeat
headers, avoid splitting rows, and preserve usable column widths. Work orders
start on new pages. Test a real PDF with long data and photos.

Only genuinely overdue active work gets a danger cue, paired with
“Прострочено”; future and historical deadlines remain neutral.
QR codes retain an explicit black-on-white quiet zone for reliable scanning.

## 9. Verification

Build/typecheck and lint are necessary but insufficient. Verify changed flows
against the live API, role permissions, both themes, narrow/tablet/desktop
viewports, keyboard navigation, failures/retry, and production font delivery.
Record measured results and outstanding limitations. Never claim source-only
inspection as a successful runtime test.
