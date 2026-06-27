export const statusBadgeClass = (status: string) => {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "badge-pending";
  if (s === "rejected") return "badge-urgent";
  if (s === "resolved") return "badge-resolved";
  if (s === "approved") return "badge-progress";
  return "badge-status text-stone-400 bg-stone-800 border-stone-700";
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
  if (p === "high" || p === "critical") return "badge-urgent";
  if (p === "low") return "badge-resolved";
  return "badge-pending";
};

export const priorityLabel = (priority: string) => {
  const p = String(priority || "").toLowerCase();
  return PRIORITY_LABELS[p] || priority;
};

export const humanLocation = (p: any) => {
  const b = p.building ? `Корпус ${p.building}` : "Корпус ?";
  const place = p.placeName ? ` \u2022 ${p.placeName}` : " \u2022 ?";
  return `${b}${place}`;
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
