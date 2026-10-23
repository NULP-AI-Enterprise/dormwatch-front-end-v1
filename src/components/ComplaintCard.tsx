import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronUp, ChevronDown, MessageSquare, Trash2, ChevronRight, ThumbsUp, Home, Image as ImageIcon, Eye, User, Users, Phone } from "lucide-react";
import { resolveImageUrl } from "@/services/imageUtils";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/StatusBadge";
import ComplaintAdminActions from "@/components/ComplaintAdminActions";
import ComplaintResidentActions from "@/components/ComplaintResidentActions";
import ProgressStepper from "@/components/ProgressStepper";
import { isBlockComplaint, cleanComplaintDescription } from "@/lib/complaintUtils";
import { cn } from "@/lib/utils";
import { ERROR_TEXT, ERROR_BORDER, ERROR_BG_HOVER } from "@/lib/theme";
import { useUser } from "@/context/UserContext";
import ImagePreviewDialog from "@/components/ImagePreviewDialog";
import type { Complaint } from "@/lib/types";

interface ComplaintCardProps {
  complaint: Complaint;
  variant?: "default" | "compact";
  showOwnerBadge?: boolean;

  // Layout
  bodyPadding?: string;
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
  showOwnerBadge = false,
  bodyPadding = "p-4 sm:p-6",
  cardClassName,
  footerClassName,
  metaVariant: _metaVariant = "location",
  descriptionFallback = "",
  onCardClick,
  showPhoto = true,
  photoZoom: _photoZoom = false,
  photoHeight: _photoHeight = "h-40",
  onPhotoPreview,
  showPriority = false,
  showProgress = false,
  footerLeft: _footerLeft = "none",
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
  const { user: currentUser } = useUser();
  const isAdmin = currentUser?.role === "admin" || (currentUser as unknown as { is_superuser?: boolean })?.is_superuser;
  const [internalPreviewUrl, setInternalPreviewUrl] = useState<string | null>(null);
  const isMyComplaint =
    !!p.isMine ||
    (currentUser?.user != null &&
      (p.user_id === currentUser.user || (p as unknown as { userId?: number }).userId === currentUser.user));

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
          <div className="flex gap-2 mb-3 items-center flex-wrap">
            {p.isRework && (
              <Badge
                variant="outline"
                className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5"
              >
                Повторне опрацювання
              </Badge>
            )}
            {showOwnerBadge && isMyComplaint && (
              <Badge
                variant="outline"
                className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5"
              >
                <User className="size-3" strokeWidth={2.5} />
                Ваше звернення
              </Badge>
            )}
            {p.studentPhone && !isAdmin && (
              <Badge
                variant="outline"
                className="border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400 inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5"
              >
                <Phone className="size-3" strokeWidth={2} />
                {p.studentPhone}
              </Badge>
            )}
            {p.category && (
              <Badge variant="outline" className="text-muted-foreground border-border bg-card">
                {p.category}
              </Badge>
            )}
            {p.supportersCount > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent inline-flex items-center gap-1">
                <ThumbsUp className="size-3" strokeWidth={2} /> {p.supportersCount}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {p.building || "?"}
              {p.placeName && <><Dot />{p.placeName}</>}
            </span>
          </div>
          {cleanComplaintDescription(p.description) && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3 break-all whitespace-pre-wrap">
              {cleanComplaintDescription(p.description)}
            </p>
          )}
          {showPhoto && p.photoUrl && (
            <div className="mb-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = resolveImageUrl(p.photoUrl as string);
                  if (url) {
                    if (onPhotoPreview) {
                      onPhotoPreview(url);
                    } else {
                      setInternalPreviewUrl(url);
                    }
                  }
                }}
                className="inline-flex items-center gap-2 px-2.5 py-1 text-xs border border-border bg-muted/30 hover:bg-muted text-foreground hover:border-primary/40 transition-all cursor-pointer group/attachment select-none"
                title="Натисніть для перегляду фото у повному розмірі"
              >
                <div className="relative size-6 shrink-0 overflow-hidden border border-border bg-card">
                  <img
                    src={resolveImageUrl(p.thumbnail || p.photoUrl) || ""}
                    alt=""
                    className="w-full h-full object-cover group-hover/attachment:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <ImageIcon
                    className="size-3.5 text-muted-foreground group-hover/attachment:text-primary transition-colors shrink-0"
                    strokeWidth={2}
                  />
                  <span className="font-semibold text-foreground group-hover/attachment:text-primary transition-colors">
                    Фото проблеми
                  </span>
                  <span className="text-muted-foreground text-[11px] font-normal flex items-center gap-1">
                    · (переглянути)
                    <Eye className="size-3 ml-0.5 text-muted-foreground group-hover/attachment:text-primary transition-colors" strokeWidth={2} />
                  </span>
                </div>
              </button>
            </div>
          )}

          {(isBlockComplaint(p.description) || p.isShared) && (
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              {isBlockComplaint(p.description) && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                  <Home className="size-3.5 shrink-0 text-blue-500" strokeWidth={2} />
                  <span>Звернення стосується блоку</span>
                </div>
              )}
              {p.isShared && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  <Users className="size-3.5 shrink-0 text-amber-500" strokeWidth={2} />
                  <span>Звернення стосується спільного простору</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Модальне вікно перегляду фото */}
        <ImagePreviewDialog
          imageUrl={internalPreviewUrl}
          onClose={() => setInternalPreviewUrl(null)}
        />
      </Card>
    );
  }

  // ── Default variant ─────────────────────────────────────────────
  const hasBlock = isBlockComplaint(p.description);
  const cleanDescription = cleanComplaintDescription(p.description);

  const reworkBadge = p.isRework && (
    <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5">
      Повторне опрацювання
    </Badge>
  );

  const phoneBadge = p.studentPhone && !isAdmin && (
    <Badge
      variant="outline"
      className="border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400 inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5"
    >
      <Phone className="size-3" strokeWidth={2} />
      {p.studentPhone}
    </Badge>
  );

  const metaLine = (
    <>
      {p.category}
      {p.category && <Dot />}
      {p.building || "?"}
      {p.placeName && <><Dot />{p.placeName}</>}
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
      <MessageSquare className="size-3" strokeWidth={2} />
      Коментарі{" "}
      {commentsOpen ? (
        <ChevronUp className="size-3 inline" strokeWidth={2} />
      ) : (
        <ChevronDown className="size-3 inline" strokeWidth={2} />
      )}
    </Button>
  );

  const hasFooterActions =
    (commentsMode === "inline" && !!commentButton) ||
    showResidentActions ||
    (showDelete && isAdmin) ||
    showAdminActions;

  return (
    <Card className={cn("py-0 border-border shadow-none bg-card overflow-hidden w-full max-w-full min-w-0", cardClassName)}>
      <div className={cn("min-w-0", bodyPadding)}>
        {/* Mobile top row: badges left, details button right */}
        <div className="flex items-start justify-between gap-2 mb-2 sm:hidden">
          <div className="flex flex-wrap gap-1.5 items-center flex-1 min-w-0">
            {statusBadge}
            <OverdueBadge complaint={p} />
            {reworkBadge}
            {showOwnerBadge && isMyComplaint && (
              <Badge variant="outline" className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5">
                <User className="size-3" strokeWidth={2.5} />
                Ваше звернення
              </Badge>
            )}
            {phoneBadge}
            {p.supportersCount > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent inline-flex items-center gap-1 text-[11px]">
                <ThumbsUp className="size-3" strokeWidth={2} /> {p.supportersCount}
              </Badge>
            )}
          </div>
          {onCardClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCardClick();
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 text-primary hover:text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 rounded-none transition-all cursor-pointer group/details select-none shrink-0"
              title="Переглянути деталі звернення"
            >
              <span>Деталі</span>
              <ChevronRight className="size-3 text-primary/70" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Desktop top row: badges left, details button right */}
        <div className="hidden sm:flex sm:justify-between sm:items-start mb-3 gap-2">
          {!showProgress && (
            <div className="flex flex-wrap gap-2 items-center min-w-0">
              {statusBadge}
              <OverdueBadge complaint={p} />
              {reworkBadge}
              {showOwnerBadge && isMyComplaint && (
                <Badge variant="outline" className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5">
                  <User className="size-3" strokeWidth={2.5} />
                  Ваше звернення
                </Badge>
              )}
              {phoneBadge}
              {p.supportersCount > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent inline-flex items-center gap-1">
                  <ThumbsUp className="size-3" strokeWidth={2} /> {p.supportersCount}
                </Badge>
              )}
            </div>
          )}
          {showProgress && (
            <div className="flex flex-wrap gap-2 items-center min-w-0">
              {reworkBadge}
              {showOwnerBadge && isMyComplaint && (
                <Badge variant="outline" className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5">
                  <User className="size-3" strokeWidth={2.5} />
                  Ваше звернення
                </Badge>
              )}
              {phoneBadge}
            </div>
          )}
          <div className="flex items-center gap-3 shrink-0">
            {onCardClick && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCardClick();
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 text-primary hover:text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 rounded-none transition-all cursor-pointer group/details select-none shrink-0"
                title="Переглянути деталі звернення"
              >
                <span>Деталі</span>
                <ChevronRight className="size-3 text-primary/70 group-hover/details:text-primary group-hover/details:translate-x-0.5 transition-all" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-2 break-words [overflow-wrap:anywhere]">
          {p.title || "Без назви"}
        </h3>

        {showPriority && (
          <div className="flex flex-wrap gap-2 mb-3">
            <PriorityBadge priority={p.priority} />
          </div>
        )}

        {cleanDescription && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 break-all [overflow-wrap:anywhere] line-clamp-2">
            {cleanDescription}
          </p>
        )}

        {!cleanDescription && !hasBlock && !p.isShared && descriptionFallback && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 break-all [overflow-wrap:anywhere] line-clamp-2">
            {descriptionFallback}
          </p>
        )}

        {(hasBlock || p.isShared) && (
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            {hasBlock && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                <Home className="size-4 shrink-0 text-blue-500" strokeWidth={2} />
                <span>Звернення стосується блоку</span>
              </div>
            )}
            {p.isShared && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                <Users className="size-4 shrink-0 text-amber-500" strokeWidth={2} />
                <span>Звернення стосується спільного простору</span>
              </div>
            )}
          </div>
        )}

        {p.rejectionReason && (p.status === "rejected" || p.status === "denied") && (
          <div className="mb-4 p-3 bg-sky-500/10 border border-sky-500/25 rounded-none text-xs">
            <span className="font-bold text-sky-600 dark:text-sky-400 block mb-1">Причина відхилення:</span>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere]">{p.rejectionReason}</p>
          </div>
        )}

        {showPhoto && p.photoUrl && (
          <div className="mb-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const url = resolveImageUrl(p.photoUrl as string);
                if (url) {
                  if (onPhotoPreview) {
                    onPhotoPreview(url);
                  } else {
                    setInternalPreviewUrl(url);
                  }
                }
              }}
              className="inline-flex items-center gap-2.5 px-3 py-1.5 text-xs border border-border bg-muted/30 hover:bg-muted text-foreground hover:border-primary/40 transition-all cursor-pointer group/attachment select-none max-w-full"
              title="Натисніть для перегляду фото у повному розмірі"
            >
              <div className="relative size-7 shrink-0 overflow-hidden border border-border bg-card">
                <img
                  src={resolveImageUrl(p.thumbnail || p.photoUrl) || ""}
                  alt=""
                  className="w-full h-full object-cover group-hover/attachment:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <ImageIcon
                  className="size-3.5 text-muted-foreground group-hover/attachment:text-primary transition-colors shrink-0"
                  strokeWidth={2}
                />
                <span className="font-semibold text-foreground group-hover/attachment:text-primary transition-colors">
                  Фото проблеми
                </span>
                <span className="text-muted-foreground text-[11px] font-normal flex items-center gap-1">
                  · (переглянути)
                  <Eye className="size-3 ml-0.5 text-muted-foreground group-hover/attachment:text-primary transition-colors" strokeWidth={2} />
                </span>
              </div>
            </button>
          </div>
        )}

        {showProgress && (
          <div className="mb-4">
            <Separator className="mb-4" />
            <ProgressStepper status={p.status} />
          </div>
        )}

        <div className={cn("flex flex-wrap items-center justify-between pt-3 gap-2", footerClassName)}>
          {hasFooterActions && (
            <div className="flex flex-wrap gap-2 items-center">
              {commentsSide === "left" && commentButton}
              {commentsSide === "right" && commentButton}
              {showResidentActions && (
                <ComplaintResidentActions
                  complaint={p}
                  onChanged={() => onResidentChange?.()}
                  size="xs"
                />
              )}
              {showDelete && isAdmin && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDelete?.(p.id)}
                  className={`${ERROR_TEXT} border ${ERROR_BORDER} ${ERROR_BG_HOVER} transition-colors`}
                >
                  <Trash2 className="size-3.5" strokeWidth={2} />
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
          )}

          <span className="text-xs font-normal text-muted-foreground ml-auto text-right">
            {metaLine}
          </span>
        </div>
      </div>

      {commentsMode === "inline" && commentsOpen && (
        <>
          {commentsSeparator && <Separator dashed />}
          <div className="p-4">{commentsContent}</div>
        </>
      )}

      {/* Модальне вікно перегляду фото */}
      <ImagePreviewDialog
        imageUrl={internalPreviewUrl}
        onClose={() => setInternalPreviewUrl(null)}
      />
    </Card>
  );
};

export default ComplaintCard;
