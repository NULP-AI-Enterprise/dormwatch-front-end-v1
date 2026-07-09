import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  Message01Icon,
  Delete01Icon,
  EditIcon,
  AddIcon,
} from "@hugeicons/core-free-icons";
import { resolveImageUrl } from "@/services/imageUtils";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import ComplaintAdminActions from "@/components/ComplaintAdminActions";
import ProgressStepper from "@/components/ProgressStepper";
import { formatDate } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import type { Complaint, Ticket } from "@/lib/types";

// Maps a complaint's raw status to a ProgressStepper stage. Shared here (rather
// than in TicketCard) since ComplaintCard is now the component that renders the
// progress bar via `showProgress`.
const stageMap: Record<string, "submitted" | "in_progress" | "resolved" | "rejected"> = {
  pending: "submitted",
  approved: "in_progress",
  resolved: "resolved",
  rejected: "rejected",
};

interface ComplaintCardProps {
  complaint: Complaint;
  variant?: "default" | "compact";

  // Layout
  bodyPadding?: string; // "p-5" | "p-6"
  cardClassName?: string;
  footerClassName?: string;

  // Metadata line
  metaVariant?: "location" | "date";
  descriptionFallback?: string;

  // Card interaction
  onCardClick?: () => void;

  // Photo
  showPhoto?: boolean;
  photoZoom?: boolean;
  photoHeight?: string; // "h-40" | "h-44" | "h-48"
  onPhotoPreview?: (url: string) => void;

  // Priority row
  showPriority?: boolean;

  // Progress bar (default variant only)
  showProgress?: boolean;

  // Footer left
  footerLeft?: "added-date" | "id" | "none";

  // Comments
  commentsMode?: "inline" | "hidden";
  commentsSide?: "left" | "right";
  commentsOpen?: boolean;
  commentsSeparator?: boolean;
  onCommentToggle?: () => void;
  commentsContent?: ReactNode;

  // Delete (non-admin)
  showDelete?: boolean;
  deleteHoverReveal?: boolean; // true = dashboard absolute reveal; false = user bar icon
  onDelete?: (id: number) => void;

  // Admin actions (approve / reject / resolve + delete dialog)
  showAdminActions?: boolean;
  onStatusChange?: (id: number, status: string) => void;
  onAdminDelete?: (id: number) => void;

  // Ticket controls (compact variant)
  ticket?: Ticket | null;
  showTicketControls?: boolean;
  onTicketAction?: (complaint: Complaint, ticket?: Ticket) => void;
}

const Dot = ({ className }: { className?: string }) => (
  <span className={cn("w-1 h-1 bg-border inline-block mx-1", className)} />
);

const ComplaintCard = ({
  complaint,
  variant = "default",
  bodyPadding = "p-6",
  cardClassName,
  footerClassName = "flex flex-col md:flex-row md:items-center justify-between pt-4 gap-4",
  metaVariant = "location",
  descriptionFallback = "",
  onCardClick,
  showPhoto = false,
  photoZoom = false,
  photoHeight = "h-40",
  onPhotoPreview,
  showPriority = false,
  showProgress = false,
  footerLeft = "none",
  commentsMode = "hidden",
  commentsSide = "right",
  commentsOpen = false,
  commentsSeparator = false,
  onCommentToggle,
  commentsContent,
  showDelete = false,
  deleteHoverReveal = false,
  onDelete,
  showAdminActions = false,
  onStatusChange,
  onAdminDelete,
  ticket,
  showTicketControls = false,
  onTicketAction,
}: ComplaintCardProps) => {
  const p = complaint;

  // ── Compact variant (ticket cards) ──────────────────────────────
  if (variant === "compact") {
    return (
      <Card className={cn("py-0 border-border shadow-none bg-card", cardClassName)}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-semibold text-foreground">
              {p.title || "Без назви"}
            </h4>
            {showPriority && <PriorityBadge priority={p.priority} />}
          </div>
          <div className="flex gap-2 mb-3 items-center">
            {p.category && (
              <Badge variant="outline" className="text-muted-foreground border-border bg-card">
                {p.category}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {p.building ? `Корпус ${p.building}` : "Корпус ?"}
              <Dot />
              {p.placeName || "?"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-4 line-clamp-3 break-all whitespace-pre-wrap">
            {p.description}
          </p>

          {showTicketControls &&
            (ticket ? (
              <div className="bg-primary/5 p-3 border border-primary/10 relative group/ticket">
                <p className="text-xs font-semibold text-primary">
                  Тікет створено (ID: {ticket.ticket_id})
                </p>
                {ticket.user && (
                  <p className="text-xs text-primary/80 mt-1">
                    Виконавець: {ticket.user.first_name} {ticket.user.last_name}
                  </p>
                )}
                {ticket.deadline && (
                  <p className="text-xs text-primary/70 mt-1">
                    Дедлайн: {formatDate(ticket.deadline)}
                  </p>
                )}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onTicketAction?.(p, ticket)}
                  className="absolute top-2 right-2 text-primary hover:text-blue-300 opacity-0 group-hover/ticket:opacity-100 transition-opacity"
                >
                  <HugeiconsIcon icon={EditIcon} className="size-3.5" strokeWidth={2} />
                </Button>
              </div>
            ) : (
              <Button onClick={() => onTicketAction?.(p)}>
                <HugeiconsIcon icon={AddIcon} className="size-4 mr-1.5" strokeWidth={2} />
                Створити тікет
              </Button>
            ))}
        </div>
      </Card>
    );
  }

  // ── Default variant ─────────────────────────────────────────────
  const hoverRevealDelete = showDelete && deleteHoverReveal;

  const metaLine =
    metaVariant === "date" ? (
      <>
        {p.category || ""}
        <Dot className="mx-1.5" />
        {formatDate(p.createdAt)}
      </>
    ) : (
      <>
        {p.category}
        <Dot />
        {p.building ? `Корпус ${p.building}` : "Корпус ?"}
        <Dot />
        {p.placeName || "?"}
      </>
    );

  const statusBadge = <StatusBadge status={p.status} />;

  const commentButton = commentsMode === "inline" && (
    <Button
      variant="ghost"
      size="xs"
      onClick={onCommentToggle}
      className="text-primary text-xs font-semibold hover:underline inline-flex items-center gap-1 p-0 h-auto"
    >
      <HugeiconsIcon icon={Message01Icon} className="size-3" strokeWidth={2} />
      Коментарі{" "}
      {commentsOpen ? (
        <HugeiconsIcon icon={ChevronUpIcon} className="size-3 inline" strokeWidth={2} />
      ) : (
        <HugeiconsIcon icon={ChevronDownIcon} className="size-3 inline" strokeWidth={2} />
      )}
    </Button>
  );

  return (
    <Card
      className={cn(
        "py-0 border-border shadow-none bg-card",
        onCardClick && "group hover:bg-muted/50 transition-colors cursor-pointer",
        hoverRevealDelete && "group relative",
        cardClassName
      )}
      onClick={
        onCardClick
          ? (e) => {
              if ((e.target as HTMLElement).closest('button, [role="dialog"], a')) return;
              onCardClick();
            }
          : undefined
      }
    >
      {hoverRevealDelete && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onDelete?.(p.id)}
          className="absolute top-2 right-2 z-10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          title="Видалити"
        >
          <HugeiconsIcon icon={Delete01Icon} className="size-3.5" strokeWidth={2} />
        </Button>
      )}

      <div className={bodyPadding}>
        {/* Unified header: status badge left, meta line right, bold title below.
            Same across admin / feed / reports — role-specific controls live in
            the footer, not the header. */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
          <div className="flex flex-wrap gap-2">{statusBadge}</div>
          <span className="text-xs font-normal text-muted-foreground shrink-0">
            {metaLine}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-2">
          {p.title || "Без назви"}
        </h3>

        {showPriority && (
          <div className="flex flex-wrap gap-2 mb-3">
            <PriorityBadge priority={p.priority} prefix />
            {p.createdAt && (
              <span className="text-xs text-muted-foreground font-semibold">
                {formatDate(p.createdAt)}
              </span>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed mb-4 break-all whitespace-pre-wrap">
          {p.description || descriptionFallback}
        </p>

        {showPhoto && p.photoUrl && (
          <div
            className={cn(
              "w-full overflow-hidden border border-border mb-4",
              photoHeight,
              photoZoom && "cursor-zoom-in"
            )}
            onClick={
              photoZoom
                ? (e) => {
                    e.stopPropagation();
                    onPhotoPreview?.(resolveImageUrl(p.photoUrl as string));
                  }
                : undefined
            }
          >
            <img
              src={resolveImageUrl(p.thumbnail || p.photoUrl)}
              className={cn(
                "w-full h-full object-cover",
                photoZoom && "hover:scale-105 transition-transform duration-500"
              )}
              alt=""
            />
          </div>
        )}

        {showProgress && (
          <div className="mb-4">
            <Separator className="mb-4" />
            <ProgressStepper stage={stageMap[p.status] ?? "submitted"} />
          </div>
        )}

        <div className={footerClassName}>
          <div className="flex items-center gap-4">
            {footerLeft === "added-date" && (
              <span className="text-xs font-normal text-muted-foreground">
                Додано {formatDate(p.createdAt)}
              </span>
            )}
            {footerLeft === "id" && (
              <span className="text-xs text-muted-foreground font-semibold">ID: {p.id}</span>
            )}
            {commentsSide === "left" && commentButton}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {commentsSide === "right" && commentButton}
            {showDelete && !deleteHoverReveal && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onDelete?.(p.id)}
                className="text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
              >
                <HugeiconsIcon icon={Delete01Icon} className="size-3.5" strokeWidth={2} />
              </Button>
            )}
            {showAdminActions && (
              <ComplaintAdminActions
                complaint={p}
                onStatusChange={(status) => onStatusChange?.(p.id, status)}
                onDelete={() => onAdminDelete?.(p.id)}
              />
            )}
          </div>
        </div>
      </div>

      {commentsMode === "inline" && commentsOpen && (
        <>
          {commentsSeparator && <Separator dashed />}
          <div className="p-4">{commentsContent}</div>
        </>
      )}
    </Card>
  );
};

export default ComplaintCard;
