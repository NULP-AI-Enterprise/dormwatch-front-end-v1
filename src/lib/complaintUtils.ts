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
// Design system §4: status color is a hard ceiling of four hues, each earned
// by a distinct meaning — amber = awaiting action, blue = in work, green =
// resolved/success, red = rejected/error/urgent/overdue. States that resolve
// to the same meaning share a hue; everything else is neutral.
const NEUTRAL_COLOR = {
  badge: "text-muted-foreground bg-card border-border",
  text: "text-muted-foreground",
  fill: "bg-muted",
};

const STATUS_COLORS: Record<string, { badge: string; text: string; fill: string }> = {
  pending: {
    badge: "text-amber-500 bg-amber-500/10 border-amber-700/50",
    text: "text-amber-600 dark:text-amber-400",
    fill: "bg-amber-500",
  },
  approved: {
    badge: "text-blue-500 bg-blue-500/10 border-blue-700/50",
    text: "text-blue-600 dark:text-blue-400",
    fill: "bg-blue-500",
  },
  in_progress: {
    badge: "text-blue-500 bg-blue-500/10 border-blue-700/50",
    text: "text-blue-600 dark:text-blue-400",
    fill: "bg-blue-500",
  },
  review: {
    badge: "text-blue-500 bg-blue-500/10 border-blue-700/50",
    text: "text-blue-600 dark:text-blue-400",
    fill: "bg-blue-500",
  },
  resolved: {
    badge: "text-green-500 bg-green-500/10 border-green-700/50",
    text: "text-green-500",
    fill: "bg-green-500",
  },
  rejected: {
    badge: "text-red-500 bg-red-500/10 border-red-700/50",
    text: "text-red-500",
    fill: "bg-red-500",
  },
  not_accepted: NEUTRAL_COLOR,
  withdrawn: NEUTRAL_COLOR,
};

export const statusBadgeClass = (status: string | null | undefined) =>
  STATUS_COLORS[String(status || "").toLowerCase()]?.badge ?? NEUTRAL_COLOR.badge;

export const statusColor = (status: string | null | undefined) =>
  STATUS_COLORS[String(status || "").toLowerCase()] ?? NEUTRAL_COLOR;

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
};

export const roleLabel = (roleName: string) =>
  ROLE_LABELS[String(roleName || "").toLowerCase()] || roleName;

// Ordered low → critical; the single source for priority selectors/forms.
export const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"] as const;

export const statusLabel = (status: string) => {
  const s = String(status || "").toLowerCase();
  return STATUS_LABELS[s] || status;
};


// Priority is text — no palette. Design system §4: only "critical" (genuinely
// alert-level) may borrow the `red` status hue; the rest stay neutral.
const NEUTRAL_PRIORITY = {
  badge: "text-muted-foreground bg-card border-border",
  text: "text-muted-foreground",
};

const CRITICAL_PRIORITY = {
  badge: "text-red-500 bg-red-500/10 border-red-700/50",
  text: "text-red-500",
};

export const priorityBadgeClass = (priority: string | null | undefined) => {
  const p = String(priority || "").toLowerCase();
  return p === "critical" ? CRITICAL_PRIORITY.badge : NEUTRAL_PRIORITY.badge;
};

export const priorityColor = (priority: string | null | undefined) => {
  const p = String(priority || "").toLowerCase();
  return p === "critical" ? CRITICAL_PRIORITY : NEUTRAL_PRIORITY;
};

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
  role?: { role_name?: string | null } | null;
} | null | undefined) =>
  !!(
    user?.role &&
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
  user.role.role_name.toLowerCase() === "worker" &&
  !isAdminUser(user);

export const roleHomeRoute = (roleName: string | null | undefined): string => {
  const r = String(roleName || "").toLowerCase();
  if (r === "admin" || r === "адміністратор") return "/admin";
  if (r === "worker") return "/worker";
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
