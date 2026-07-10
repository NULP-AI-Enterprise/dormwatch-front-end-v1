export const statusBadgeClass = (status: string) => {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "text-yellow-500 bg-yellow-500/10 border-yellow-700/50";
  if (s === "rejected") return "text-red-500 bg-red-500/10 border-red-700/50";
  if (s === "resolved") return "text-green-500 bg-green-500/10 border-green-700/50";
  if (s === "approved") return "text-blue-500 bg-blue-500/10 border-blue-700/50";
  return "text-muted-foreground bg-card border-border";
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Очікує",
  approved: "Активно",
  rejected: "Відхилено",
  resolved: "Вирішено",
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
};

export const roleLabel = (roleName: string) =>
  ROLE_LABELS[String(roleName || "").toLowerCase()] || roleName;

// Ordered low → critical; the single source for priority selectors/forms.
export const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"] as const;

export const statusLabel = (status: string) => {
  const s = String(status || "").toLowerCase();
  return STATUS_LABELS[s] || status;
};

export const priorityBadgeClass = (priority: string) => {
  const p = String(priority || "").toLowerCase();
  if (p === "high" || p === "critical") return "text-red-500 bg-red-500/10 border-red-700/50";
  if (p === "low") return "text-green-500 bg-green-500/10 border-green-700/50";
  return "text-yellow-500 bg-yellow-500/10 border-yellow-700/50";
};

export const priorityLabel = (priority: string) => {
  const p = String(priority || "").toLowerCase();
  return PRIORITY_LABELS[p] || priority;
};

// Lifecycle stage of a complaint, shared by the progress stepper, the ticket
// tracking strips, and the "Мої тікети" state filter so they never disagree.
// pending → submitted, approved → in_progress, resolved/rejected are terminal.
export type LifecycleStage = "submitted" | "in_progress" | "resolved" | "rejected";

export const lifecycleStage = (status: string | null | undefined): LifecycleStage => {
  const s = String(status || "").toLowerCase();
  if (s === "resolved") return "resolved";
  if (s === "rejected") return "rejected";
  if (s === "approved") return "in_progress";
  return "submitted";
};

// "Active" = still on the working pipeline (not resolved, not rejected). Used
// for the "Активні" stat and to decide whether a work-order tracking strip
// should present the complaint as ongoing.
export const isActiveStatus = (status: string | null | undefined) => {
  const stage = lifecycleStage(status);
  return stage === "submitted" || stage === "in_progress";
};

export const isAdminUser = (user: any) =>
  !!(
    user?.role &&
    ["admin", "адміністратор"].includes(
      (user.role.role_name || "").toLowerCase()
    )
  );

export const getUserInitials = (user: any, fallback = "U") => {
  if (!user) return fallback;
  const initials = `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase();
  return initials || fallback;
};
