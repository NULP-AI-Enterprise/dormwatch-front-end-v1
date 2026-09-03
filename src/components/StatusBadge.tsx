import { Badge } from "@/components/ui/badge";
import {
  statusBadgeClass,
  statusLabel,
  priorityBadgeClass,
  priorityLabel,
} from "@/lib/complaintUtils";
import { OVERDUE_LABEL, complaintIsOverdue } from "@/lib/complaintUtils";
import { cn } from "@/lib/utils";

// Canonical status/priority badge markup. Every call site rendered
// `<Badge variant="outline" className={statusBadgeClass(...)}>` (or a
// drifted raw <span> in TicketCard); these wrappers make that single.

export const StatusBadge = ({
  status,
  className,
}: {
  status: string;
  className?: string;
}) => (
  <Badge variant="outline" className={cn(statusBadgeClass(status), className)}>
    {statusLabel(status)}
  </Badge>
);

export const PriorityBadge = ({
  priority,
  prefix = false,
  className,
}: {
  priority: string | null | undefined;
  /** When true, prepends the "Пріоритет: " label. */
  prefix?: boolean;
  className?: string;
}) => {
  // No badge for an unset priority — the neutral fallback would otherwise paint
  // an empty badge for a value that was never assigned.
  if (!priority) return null;
  return (
    <Badge variant="outline" className={cn(priorityBadgeClass(priority), className)}>
      {prefix ? `Пріоритет: ${priorityLabel(priority)}` : priorityLabel(priority)}
    </Badge>
  );
};

// Red derived flag (never a state): "В роботі" past its deadline. Rendered
// next to the status badge, never instead of it.
export const OverdueBadge = ({
  complaint,
  className,
}: {
  complaint: { status: string; deadline: string | null; isOverdue?: boolean };
  className?: string;
}) =>
  complaintIsOverdue(complaint) ? (
    <Badge
      variant="outline"
      className={cn("text-red-500 bg-red-500/10 border-red-700/50", className)}
    >
      {OVERDUE_LABEL}
    </Badge>
  ) : null;
