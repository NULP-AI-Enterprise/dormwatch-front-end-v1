import { Badge } from "@/components/ui/badge";
import { roleLabel } from "@/lib/complaintUtils";

export function RoleBadge({ role, isAdmin = false }: { role?: string | null; isAdmin?: boolean }) {
  return <Badge variant="outline">{isAdmin ? roleLabel("admin") : roleLabel(role || "")}</Badge>;
}
