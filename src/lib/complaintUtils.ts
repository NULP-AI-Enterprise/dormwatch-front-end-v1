// The canonical lifecycle vocabulary — slugs byte-identical with the server's
// COMPLAINT_STATUS choices (models.py), one row per state. Pipeline order
// (the resident stepper) first, then the terminal states. Unknown codes fall
// back to their raw value / the neutral style.
export const STATUS_OPTIONS = [
  "pending",
  "approved",
  "in_progress",
  "review",
  "resolved",
  "rejected",
  "not_accepted",
  "withdrawn",
] as const;

export const TERMINAL_STATUSES = ["resolved", "rejected", "not_accepted", "withdrawn"];

export const STATUS_LABELS: Record<string, string> = {
  pending: "Очікує",
  approved: "Схвалено",
  in_progress: "В роботі",
  review: "На перевірці",
  resolved: "Вирішено",
  rejected: "Відхилено",
  not_accepted: "Не прийнято",
  withdrawn: "Скасовано",
};

// One color row per state, shared by every surface that paints a state.
// Design system §3: lifecycle colors communicate distinct meanings, each earned
// by a distinct meaning — amber = awaiting action, sky = in work, green =
// resolved/success, red = rejected/error/urgent/overdue. States that resolve
// to the same meaning share a hue; everything else is neutral.
const NEUTRAL_COLOR = {
  badge: "text-muted-foreground bg-card border-border",
  text: "text-muted-foreground",
  fill: "bg-muted",
};

const semanticStatus = (name: "warning" | "info" | "success" | "danger") => ({
  // Literal classes are kept here so Tailwind discovers every palette token.
  warning: { badge: "text-status-warning bg-status-warning-bg border-status-warning/40", text: "text-status-warning", fill: "bg-status-warning" },
  info: { badge: "text-status-info bg-status-info-bg border-status-info/40", text: "text-status-info", fill: "bg-status-info" },
  success: { badge: "text-status-success bg-status-success-bg border-status-success/40", text: "text-status-success", fill: "bg-status-success" },
  danger: { badge: "text-status-danger bg-status-danger-bg border-status-danger/40", text: "text-status-danger", fill: "bg-status-danger" },
})[name];

const STATUS_COLORS: Record<string, { badge: string; text: string; fill: string }> = {
  pending: semanticStatus("warning"),
  approved: semanticStatus("info"),
  in_progress: semanticStatus("info"),
  review: semanticStatus("info"),
  resolved: semanticStatus("success"),
  rejected: semanticStatus("danger"),
  not_accepted: semanticStatus("warning"),
  withdrawn: NEUTRAL_COLOR,
};

export const statusBadgeClass = (status: string | null | undefined) =>
  STATUS_COLORS[String(status || "").toLowerCase()]?.badge ?? NEUTRAL_COLOR.badge;

export const statusColor = (status: string | null | undefined) =>
  STATUS_COLORS[String(status || "").toLowerCase()] ?? NEUTRAL_COLOR;

// Distribution charts share status semantics, with distinct fills for the two
// blue stages. Review and approved share the information-blue fill.
export const statusChartColor = (status: string) => {
  if (status === "in_progress") return "bg-chart-in-progress";
  if (status === "closed_other") return "bg-muted-foreground/50";
  return statusColor(status).fill;
};

export const PRIORITY_LABELS: Record<string, string> = {
  high: "Високий",
  medium: "Середній",
  low: "Низький",
  critical: "Критичний",
};

// Role display labels for the admin residents page. Roles are a free-text
// backend table, so unknown role_names fall back to their raw value.
export const ROLE_LABELS: Record<string, string> = {
  admin: "Адміністратор",
  student: "Студент",
  worker: "Працівник",
  працівник: "Працівник",
  адміністратор: "Адміністратор",
  студент: "Студент",
};

export const roleLabel = (roleName: string) =>
  ROLE_LABELS[String(roleName || "").trim().toLowerCase()] || roleName || "Користувач";

// Ordered low → critical; the single source for priority selectors/forms.
export const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"] as const;

export const statusLabel = (status: string) => {
  const s = String(status || "").toLowerCase();
  return STATUS_LABELS[s] || status;
};


// Priority is uniform neutral text badges across all levels.
const NEUTRAL_PRIORITY = {
  badge: "text-muted-foreground bg-card border-border",
  text: "text-muted-foreground",
};

export const priorityBadgeClass = (priority: string | null | undefined) =>
  priority === "critical" ? semanticStatus("danger").badge : NEUTRAL_PRIORITY.badge;

export const priorityColor = (priority: string | null | undefined) =>
  priority === "critical" ? semanticStatus("danger") : NEUTRAL_PRIORITY;

export const priorityLabel = (priority: string | null | undefined): string => {
  const p = String(priority || "").toLowerCase();
  return PRIORITY_LABELS[p] || priority || "—";
};

// "Active" = still on the pipeline (not in any terminal state). Used for the
// "Активні" stat and to decide whether a work-order tracking strip should
// present the complaint as ongoing.
export const isActiveStatus = (status: string | null | undefined) =>
  !TERMINAL_STATUSES.includes(String(status || "").toLowerCase());

// Overdue = the server's single flag ("В роботі" past its deadline): trust the
// payload flag when the list was annotated, fall back to computing it locally
// so surfaces that render a stale/unannotated object still agree with the
// badge, filter, and notification. One definition: its only client-side home.
export const complaintIsOverdue = (c: {
  status?: string | null;
  deadline?: string | null;
  isOverdue?: boolean;
}) =>
  c.isOverdue ||
  (c.status === "in_progress" &&
    !!c.deadline &&
    new Date(c.deadline) < new Date());

export const OVERDUE_LABEL = "Прострочено";

export const isAdminUser = (user: {
  is_staff?: boolean;
  role?: { role_name?: string | null } | null;
} | null | undefined) =>
  !!(
    user?.is_staff || user?.role &&
    ["admin", "адміністратор"].includes(
      (user.role.role_name || "").toLowerCase()
    )
  );

export const getUserInitials = (
  user: { first_name?: string; last_name?: string } | null | undefined,
  fallback = "U"
) => {
  if (!user) return fallback;
  const initials = `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase();
  return initials || fallback;
};

// Third role bucket: a provisioned worker account (UserProfile, role `worker`,
// linked 1:1 from Worker). Workers land in the worker layout — never the full
// resident app.
export const isWorkerUser = (user: {
  role?: { role_name?: string | null } | null;
} | null | undefined) =>
  !!user?.role?.role_name &&
  ["worker", "працівник"].includes(user.role.role_name.toLowerCase()) &&
  !isAdminUser(user);

export const roleHomeRoute = (roleName: string | null | undefined): string => {
  const r = String(roleName || "").toLowerCase();
  if (r === "admin" || r === "адміністратор") return "/admin";
  if (r === "worker" || r === "працівник") return "/worker";
  return "/user";
};
export const chainGroupId = (c: { id: number; root: number | null }) =>
  c.root ?? c.id;

const chainTimestamp = (c: { createdAt: string | null }) =>
  c.createdAt ? new Date(c.createdAt).getTime() : -Infinity;

export function groupByChain<
  T extends { id: number; root: number | null; createdAt: string | null },
>(list: T[]): T[] {
  const groups = new Map<number, T[]>();
  for (const c of list) {
    const key = chainGroupId(c);
    const group = groups.get(key);
    if (group) group.push(c);
    else groups.set(key, [c]);
  }
  return [...groups.values()]
    .map((group) =>
      // Chain head (id === group key) leads; the rest follow in filing order.
      group.sort((a, b) => {
        if (a.id === chainGroupId(a)) return -1;
        if (b.id === chainGroupId(b)) return 1;
        return chainTimestamp(a) - chainTimestamp(b);
      })
    )
    .sort((ga, gb) => {
      // Groups surface by their most recent activity, newest saga first.
      const newest = (g: T[]) => Math.max(...g.map(chainTimestamp));
      return newest(gb) - newest(ga);
    })
    .flat();
}

/**
 * Checks whether a complaint description indicates it concerns a shared block (tagged with "[Блок]").
 */
export const isBlockComplaint = (description?: string | null): boolean => {
  if (!description) return false;
  return /\[Блок\]/i.test(description);
};

/**
 * Strips the "[Блок]" tag from the description text so it doesn't display as raw text.
 */
export const cleanComplaintDescription = (description?: string | null): string => {
  if (!description) return "";
  return description.replace(/\[Блок\]/gi, "").trim();
};

// Shared urgency and exhaustive analytics: unknown persisted values remain visible.
export const isUrgentPriority = (priority?: string | null) =>
  priority === "critical" || priority === "high";

export function priorityBreakdown(items: { priority?: string | null }[]) {
  const known = PRIORITY_OPTIONS.map((value) => ({
    value, label: priorityLabel(value),
    count: items.filter((item) => item.priority === value).length,
  })).reverse();
  const unknown = items.filter((item) =>
    !PRIORITY_OPTIONS.some((value) => value === item.priority)
  ).length;
  return unknown ? [...known, { value: "unknown", label: "Не визначено", count: unknown }] : known;
}
