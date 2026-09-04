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
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { resolveImageUrl } from "@/services/imageUtils";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/StatusBadge";
import ComplaintAdminActions from "@/components/ComplaintAdminActions";
import ComplaintResidentActions from "@/components/ComplaintResidentActions";
import ProgressStepper from "@/components/ProgressStepper";
import { formatDate } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import { ERROR_TEXT, ERROR_BORDER, ERROR_BG_HOVER } from "@/lib/theme";
import type { Complaint } from "@/lib/types";

interface ComplaintCardProps {
  complaint: Complaint;
  variant?: "default" | "compact";

  // Layout
  bodyPadding?: "p-5" | "p-6";
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
  photoHeight?: "h-40" | "h-44" | "h-48";
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

  // Delete (non-admin). Rendered as an always-visible footer icon so the
  // control is reachable on touch devices — hover-only reveal is gone.
  showDelete?: boolean;
  onDelete?: (id: number) => void;

  // Admin actions (triage cluster + delete dialog)
  showAdminActions?: boolean;
  onAdminPatch?: (id: number, body: Record<string, unknown>) => void;
  onAdminDelete?: (id: number) => void;

  // Resident lifecycle (accept/reject finished work, withdraw, re-file)
  showResidentActions?: boolean;
  onResidentChange?: () => void;
}

export const Dot = ({ className }: { className?: string }) => (
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
  onDelete,
  showAdminActions = false,
  onAdminPatch,
  onAdminDelete,
  showResidentActions = false,
  onResidentChange,
}: ComplaintCardProps) => {
  const p = complaint;

  // ── Compact variant ──────────────────────────────────────────────
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
              {p.building || "?"}
              {p.placeName && <><Dot />{p.placeName}</>}
              {p.isShared && <span className="ml-0.5">(спільна)</span>}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 break-all whitespace-pre-wrap">
            {p.description}
          </p>
        </div>
      </Card>
    );
  }

  // ── Default variant ─────────────────────────────────────────────

  // Re-file chain flag: a follow-up cites its source so a saga reads as one
  // story in every list that renders it. Public payloads carry no
  // follow_up_of, so the mark never leaks to the board.
  const redoMark = p.followUpOf != null && (
    <>
      <span className="text-xs font-semibold text-foreground shrink-0">
        Повторне до №{p.followUpOf}
      </span>
      <Dot />
    </>
  );

  const metaLine =
    metaVariant === "date" ? (
      <>
        {redoMark}
        {p.category || ""}
        <Dot className="mx-1.5" />
        {formatDate(p.createdAt)}
      </>
    ) : (
      <>
        {redoMark}
        {p.category}
        <Dot />
        {p.building || "?"}
        {p.placeName && <><Dot />{p.placeName}</>}
        {p.isShared && <span className="ml-0.5">(спільна)</span>}
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
        // Clickable cards carry their own visible "Деталі" cue in the header
        // (rendered above). Background does not shift on hover — touch devices
        // never see hover, and the persistent label is the honest affordance.
        onCardClick && "cursor-pointer focus-visible:ring-1 focus-visible:ring-ring/50",
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
      <div className={bodyPadding}>
        {/* Unified header: status badge left, meta line right, bold title below.
            Same across admin / feed / reports — role-specific controls live in
            the footer, not the header. Cards showing the progress stepper omit
            the badge: the stepper already names the current state. When the
            whole card is a tap target, an inline "Деталі" cue gives the row a
            persistent affordance — hover-only background shifts don't read as
            clickable on touch. */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
          {!showProgress && (
            <div className="flex flex-wrap gap-2">
              {statusBadge}
              <OverdueBadge complaint={p} />
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="text-xs font-normal text-muted-foreground shrink-0">
              {metaLine}
            </span>
            {onCardClick && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary shrink-0">
                Деталі
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" strokeWidth={2} />
              </span>
            )}
          </div>
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-2">
          {p.title || "Без назви"}
        </h3>

        {showPriority && (
          <div className="flex flex-wrap gap-2 mb-3">
            <PriorityBadge priority={p.priority} prefix />
            {p.createdAt && (
              <span className="text-xs text-muted-foreground font-normal">
                {formatDate(p.createdAt)}
              </span>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground leading-relaxed mb-4 break-all whitespace-pre-wrap">
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
            <ProgressStepper status={p.status} />
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
              <span className="text-xs text-muted-foreground font-normal">ID: {p.id}</span>
            )}
            {commentsSide === "left" && commentButton}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {commentsSide === "right" && commentButton}
            {showResidentActions && (
              <ComplaintResidentActions
                complaint={p}
                onChanged={() => onResidentChange?.()}
                size="xs"
              />
            )}
            {showDelete && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onDelete?.(p.id)}
                className={`${ERROR_TEXT} border ${ERROR_BORDER} ${ERROR_BG_HOVER} transition-colors`}
              >
                <HugeiconsIcon icon={Delete01Icon} className="size-3.5" strokeWidth={2} />
              </Button>
            )}
            {showAdminActions && (
              <ComplaintAdminActions
                complaint={p}
                onPatch={(body) => onAdminPatch?.(p.id, body)}
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
