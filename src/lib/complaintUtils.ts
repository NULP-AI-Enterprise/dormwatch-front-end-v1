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
  critical: "Критично",
};

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
