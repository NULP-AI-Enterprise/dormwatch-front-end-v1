import { Badge } from "@/components/ui/badge";
import { roleLabel } from "@/lib/complaintUtils";

export function RoleBadge({ role, isAdmin = false }: { role?: string | null; isAdmin?: boolean }) {
  const normalizedRole = (isAdmin ? "admin" : role || "").trim().toLowerCase();
  // Design system §3: retain distinct role colors with readable theme pairs.
  const colors = ["admin", "адміністратор"].includes(normalizedRole)
    ? "text-role-admin bg-role-admin-bg border-role-admin/30"
    : ["worker", "працівник"].includes(normalizedRole)
      ? "text-role-worker bg-role-worker-bg border-role-worker/30"
      : ["student", "студент"].includes(normalizedRole)
        ? "text-role-student bg-role-student-bg border-role-student/30"
        : undefined;

  return <Badge variant="outline" className={colors}>{roleLabel(normalizedRole)}</Badge>;
}
