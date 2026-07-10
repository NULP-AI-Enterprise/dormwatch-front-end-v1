import type { ReactNode } from "react";
import { formatDate } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/lib/types";

const workerName = (ticket: Ticket) => ticket.worker?.full_name ?? null;

type CalloutProps = {
  variant: "callout";
  ticket: Ticket;
  // Full heading line (carries the ticket id in-line, e.g. "Тікет #12").
  heading: string;
  tone?: "primary" | "accent";
  action?: ReactNode;
  className?: string;
};

type DetailProps = {
  variant: "detail";
  ticket: Ticket;
  idPosition?: "top" | "bottom";
  className?: string;
};

type TicketInfoProps = CalloutProps | DetailProps;

// Single renderer for the work-order summary (assignee / deadline / ticket #).
// Previously copy-pasted in five places (both ComplaintCard strips, TicketCard,
// ComplaintSidePanel owner block, TicketSidePanel read-only view). Two families:
//   - "callout": boxed primary tint on complaint cards. Heading carries the id;
//     empty assignee/deadline are hidden; optional edit action, top-right.
//   - "detail": plain muted list in side panels + the ticket card. Bold labels,
//     honest "Не призначено"/"—" fallbacks, id as its own line (top or bottom).
export default function TicketInfo(props: TicketInfoProps) {
  const { ticket } = props;

  if (props.variant === "callout") {
    const tone = props.tone ?? "accent";
    const headingColor = tone === "primary" ? "text-primary" : "text-blue-400";
    const line1 = tone === "primary" ? "text-primary/80" : "text-blue-300/80";
    const line2 = tone === "primary" ? "text-primary/70" : "text-blue-300/70";
    const name = workerName(ticket);
    return (
      <div
        className={cn(
          "bg-primary/5 border border-primary/10 p-3",
          props.action && "relative group/ticket",
          props.className
        )}
      >
        <p className={cn("text-xs font-semibold", headingColor)}>{props.heading}</p>
        {name && <p className={cn("text-xs mt-1", line1)}>Виконавець: {name}</p>}
        {ticket.deadline && (
          <p className={cn("text-xs mt-1", line2)}>Дедлайн: {formatDate(ticket.deadline)}</p>
        )}
        {props.action}
      </div>
    );
  }

  const idPosition = props.idPosition ?? "bottom";
  const idLine = (
    <p className="text-xs text-muted-foreground font-semibold">Тікет #{ticket.ticket_id}</p>
  );
  return (
    <div className={cn("space-y-2", props.className)}>
      {idPosition === "top" && idLine}
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold">Виконавець:</span>{" "}
        {workerName(ticket) ?? "Не призначено"}
      </p>
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold">Дедлайн:</span>{" "}
        {ticket.deadline ? formatDate(ticket.deadline) : "—"}
      </p>
      {idPosition === "bottom" && idLine}
    </div>
  );
}
