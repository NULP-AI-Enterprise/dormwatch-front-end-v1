// Central design tokens — the single source for accent, link, selected,
// hover-accent, error, and success palettes. Raw hue utilities at feature
// call sites route through here so the same color never carries two unrelated
// meanings on one screen.

// Brand accent — the design-system light/dark pair (blue-400 dark / blue-600
// light, per .agents/design-system.md). Use for links, highlighted text, active
// nav indicators, and the hover left-border bar.
export const ACCENT = "text-blue-600 dark:text-blue-400";
export const ACCENT_HOVER = "hover:text-blue-700 dark:hover:text-blue-400";
export const ACCENT_BORDER = "border-blue-500";
export const ACCENT_BORDER_DARK = "border-blue-800";
export const ACCENT_BORDER_LIGHT = "border-blue-700/50";
export const ACCENT_BG = "bg-blue-500";
export const ACCENT_BG_HOVER = "hover:bg-blue-500/10";
export const ACCENT_BG_HOVER_DARK = "hover:bg-blue-600";
export const ACCENT_BG_LIGHT = "bg-blue-500/5";
export const ACCENT_BG_HOVER_LIGHT = "hover:bg-blue-500/10";
export const ACCENT_BG_SUBTLE = "bg-blue-500/10";
export const ACCENT_SUBTLE = ACCENT_BG_SUBTLE;

// Link — same as accent, named for semantic clarity at link call sites.
export const LINK = ACCENT;
export const LINK_HOVER = ACCENT_HOVER;

// Selected/active state — for nav items and sidebar entries.
export const SELECTED = "border-blue-500 bg-primary/5 text-foreground";

// Hover accent — for group-hover reveals on cards and announcement titles.
export const HOVER_ACCENT = "group-hover:text-blue-600 dark:group-hover:text-blue-400";

// Error/destructive — for delete buttons, error banners, logout.
export const ERROR = "text-red-500 bg-red-500/10 border-red-700/50";
export const ERROR_TEXT = "text-red-500 dark:text-red-400";
export const ERROR_BG = "bg-red-500/10";
export const ERROR_BG_HOVER = "hover:bg-red-400/10";
export const ERROR_BORDER = "border-red-400/30";

// Success — for success messages and positive indicators.
export const SUCCESS = "text-green-600 bg-green-500/10 border-green-700/50";
export const SUCCESS_TEXT = "text-green-600 dark:text-green-400";
