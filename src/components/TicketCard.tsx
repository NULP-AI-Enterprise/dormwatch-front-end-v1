import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import type { Complaint, Ticket } from "@/lib/types";

interface TicketCardProps {
  ticket: Ticket; // real Ticket
  complaint: Complaint; // resolved via complaint.id === ticket.complaint
  readOnly?: boolean; // this card's mode, forwarded to the panel on open
  onOpen?: (readOnly: boolean) => void; // card click → parent opens TicketSidePanel
}

const TicketCard = ({ ticket, complaint, readOnly = true, onOpen }: TicketCardProps) => {
  const p = complaint;

  return (
    <Card
      className={cn(
        "py-0 border-border shadow-none bg-card",
        onOpen && "group hover:bg-muted/50 transition-colors cursor-pointer"
      )}
      onClick={
        onOpen
          ? (e) => {
              if ((e.target as HTMLElement).closest('button, [role="dialog"], a')) return;
              onOpen(readOnly);
            }
          : undefined
      }
    >
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={p.status} />
          </div>
          <span className="text-xs font-normal text-muted-foreground shrink-0">
            {p.category || ""}
            <span className="w-1 h-1 bg-border inline-block mx-1.5" />
            {formatDate(p.createdAt)}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-foreground mb-2">
          {p.title || "Без назви"}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 break-all whitespace-pre-wrap">
          {p.description || "—"}
        </p>

        <Separator className="mb-4" />

        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground font-semibold">
            Тікет #{ticket.ticket_id}
          </span>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Виконавець:</span>{" "}
            {ticket.user
              ? `${ticket.user.first_name} ${ticket.user.last_name}`
              : "Не призначено"}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Дедлайн:</span>{" "}
            {ticket.deadline ? formatDate(ticket.deadline) : "—"}
          </p>
        </div>
      </div>
    </Card>
  );
};

export { TicketCard };
