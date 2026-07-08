import { Badge } from "@/components/ui/badge";
import {
  statusBadgeClass,
  statusLabel,
  priorityBadgeClass,
  priorityLabel,
} from "@/lib/complaintUtils";
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
  // No badge for an unset priority — priorityBadgeClass would otherwise paint
  // a yellow "medium"-styled empty badge for a value that was never assigned.
  if (!priority) return null;
  return (
    <Badge variant="outline" className={cn(priorityBadgeClass(priority), className)}>
      {prefix ? `Пріоритет: ${priorityLabel(priority)}` : priorityLabel(priority)}
    </Badge>
  );
};
