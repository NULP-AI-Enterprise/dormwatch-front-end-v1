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

// One color row per state, shared by every surface that paints a state:
// badge chip, accent label text, progress-bar fill.
const NEUTRAL_COLOR = {
  badge: "text-muted-foreground bg-card border-border",
  text: "text-muted-foreground",
  fill: "bg-muted",
};

const STATUS_COLORS: Record<string, { badge: string; text: string; fill: string }> = {
  pending: {
    badge: "text-yellow-500 bg-yellow-500/10 border-yellow-700/50",
    text: "text-yellow-500",
    fill: "bg-yellow-500",
  },
  approved: {
    badge: "text-blue-500 bg-blue-500/10 border-blue-700/50",
    text: "text-blue-600 dark:text-blue-400",
    fill: "bg-blue-500",
  },
  in_progress: {
    badge: "text-violet-500 bg-violet-500/10 border-violet-700/50",
    text: "text-violet-600 dark:text-violet-400",
    fill: "bg-violet-500",
  },
  review: {
    badge: "text-cyan-500 bg-cyan-500/10 border-cyan-700/50",
    text: "text-cyan-600 dark:text-cyan-400",
    fill: "bg-cyan-500",
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
  not_accepted: {
    badge: "text-orange-500 bg-orange-500/10 border-orange-700/50",
    text: "text-orange-500",
    fill: "bg-orange-500",
  },
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

export const priorityBadgeClass = (priority?: string | null) => {
  const p = String(priority || "").toLowerCase();
  if (p === "critical") return "text-red-500 bg-red-500/10 border-red-700/50";
  if (p === "high") return "text-orange-500 bg-orange-500/10 border-orange-700/50";
  if (p === "low") return "text-green-500 bg-green-500/10 border-green-700/50";
  return "text-yellow-500 bg-yellow-500/10 border-yellow-700/50";
};

export const priorityLabel = (priority?: string | null) => {
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

export const isAdminUser = (user: { role?: { role_name?: string } } | null | undefined) =>
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

// Re-file chains: every member denormalizes the chain head id (`root`; roots
// themselves carry null). Lists group by it so a saga reads as one story —
// the original first, its re-files beneath in filing order.
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
