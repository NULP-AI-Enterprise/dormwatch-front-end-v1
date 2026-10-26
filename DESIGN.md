# DormWatch design decisions

This records decisions made with the project owner on 2026-10-23 and 2026-10-26.
Implementation tokens and accessibility rules live in [.agents/design-system.md](.agents/design-system.md).
Follow both documents; the latest explicit user decision takes precedence.

## Color and appearance

- “Не прийнято” uses warning yellow/amber, indicating work returned for another
  attempt. Keep this status consistent across badges, statistics, and charts.
- Use high contrast across the entire app: vivid, readable text and thin colored
  borders on subtle tinted surfaces. Avoid oversized bright fills, washed-out
  pastel text, and neon buttons. The owner's latest badge reference supersedes
  the temporary brighter-fill experiment.
- Role badges stay color coded: students blue, admins yellow/amber, workers orange.
- Semantic status colors remain recognizable in both themes. Review
  (На перевірці) uses the same information-blue badge styling as approved and
  in-progress, per the latest 2026-10-26 decision; this supersedes neutral review.
- Complaint progress bars use the blue accent for reached/current stages and
  gray for future stages. Do not render the progress path white/light gray.
- Analytics status segments and their legend share the same semantic mapping.
- Preserve square corners and readable text contrast. Keep useful control sizes,
  including larger login/worker controls, and visible keyboard focus without
  moving input text.

## Form typography

Main-form labels, choices, input text, and instructions use text-sm (14px).
Labels use font-semibold for hierarchy. Reserve text-xs (12px) for counters,
file-size metadata, and compact labels in dense interfaces. Retain page headings.

## Navigation and controls

- New-report category and priority choices use the shared shadcn ToggleGroup
  selection variant: subtle bg-selection/40 tint, matching accent text/icons, and a 2px
  accent edge (border plus inset ring without layout shift). Keep the selected
  appearance on hover and retain a distinct keyboard-focus ring.
- Keep the notification bell to the right of the user button at every breakpoint,
  including the worker header; responsive layouts must not reverse their order.
- Worker account buttons also fit their text without fixed mobile width caps;
  truncate only when the available header space is exhausted.
- Comment controls stay static: no pulsing buttons, ping animations, or attention
  dots. Indicate unread comments with a plain “· нові” text label.
- Below lg (1024px), including the md tablet range, hide the DormWatch logo in
  the student top navbar. Put the hamburger on the left and notifications at the
  far right. The user button sits beside the bell and fits its content, with
  left-aligned text allowed to use all available width before truncating. Keep
  spare space between the hamburger and account, outside the user button.
  The navigation drawer opens from the left, matching its trigger.
- Inline metadata separators use the text middle dot (·), not CSS square dots
  or vertical lines. Treat these punctuation separators as decorative.
- Top-navbar links use a subtle neutral active surface (bg-muted/30), normal
  foreground text, and a thin blue accent underline (border-link), matching the
  owner’s 2026-10-26 reference. Inactive links use muted text. Expose the current
  route with aria-current; keep visible keyboard focus and the existing layout.
- The notification menu’s “mark all as read” action uses a Lucide CheckCheck
  icon button with a Ukrainian accessible label and tooltip; retain bulk-read behavior.
- Keep the account name and metadata left aligned.
- Keep the compact theme selector on the right inside the account dropdown.
  Profile, theme, and logout rows share aligned icons, labels, and row height;
  do not stretch the theme selector across the menu.
- Admin page actions belong with the other header actions, before export.
  Use a vertical separator between Export data and the account control on desktop.
  Retain wrapping and the accessible mobile side drawer on narrow screens.
- Admin overview, expanded analytics, and resource-report period selectors use
  shadcn Tabs (TabsList/TabsTrigger/TabsContent). The shared bordered track uses
  the same bg-card surface as the admin sidebar/navigation. The active tab uses
  the blue primary accent with its paired foreground, not a black fill. Preserve
  period filtering, arrow-key navigation, one selected period, and responsive wrapping.
- Compose shadcn primitives and preserve existing workflows when correcting style.
  Authentication inputs must retain visible, associated labels.

## Content and behavior

- Only a comment's author may delete it. Admin/staff/superuser status does not
  grant permission to remove other people's comments. Enforce this in the API
  and Django admin as well as hiding unauthorized UI actions.
- Resource changes are allowed for building admins within their building,
  global staff, and workers assigned to the complaint. Students have read access.
- Show payment details unavailable until institution-approved details exist.
  Keep the current dormitory rules for now, as requested.
- Resident management is intended to integrate with another project's student
  database; do not invent a replacement student-management system.
- Allow compact empty messages inside nested sections.
- Print previews and print output follow the app theme, with responsive previews
  and readable print typography.

## Verification and publication

Check light/dark themes, relevant narrow/desktop layouts, and changed behavior
through the UI and live API. Color checks include selected/hover states.
Do not commit or push a new batch until the owner explicitly requests it.
