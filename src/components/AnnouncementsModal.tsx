import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Megaphone01Icon,
  PinIcon,
  Link01Icon,
  Clock01Icon,
  Briefcase01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { formatDate } from "@/lib/dateUtils";
import { sortAnnouncements } from "@/lib/announcementUtils";
import { fetchAnnouncements } from "@/services/problemsApi";
import type { Announcement } from "@/lib/types";

interface AnnouncementsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcements?: Announcement[];
  initialAnnouncementId?: number | null;
}

const ITEMS_PER_PAGE = 5;

const extractUrl = (text: string): string | null => {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
};

const AnnouncementsModal = ({
  open,
  onOpenChange,
  announcements: providedAnnouncements,
  initialAnnouncementId,
}: AnnouncementsModalProps) => {
  const [items, setItems] = useState<Announcement[]>(providedAnnouncements || []);
  const [loading, setLoading] = useState(!providedAnnouncements);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailedAnnouncement, setDetailedAnnouncement] = useState<Announcement | null>(null);
  const [wasOpen, setWasOpen] = useState(false);
  // Announcement id awaiting automatic selection; undefined once resolved or navigated away.
  const [pendingTargetId, setPendingTargetId] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    if (providedAnnouncements) {
      setItems(providedAnnouncements);
      return;
    }

    if (open) {
      setLoading(true);
      fetchAnnouncements()
        .then((all) => setItems(all.filter((a) => !a.is_expired)))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, providedAnnouncements]);

  // Sort pinned announcements first, then newest first
  const sortedItems = sortAnnouncements(items);

  // Reset on close and seed the initial target synchronously during render,
  // so the first committed paint already shows the right view (no list flash).
  if (!open && wasOpen) {
    setWasOpen(false);
    setDetailedAnnouncement(null);
    setCurrentPage(1);
    setPendingTargetId(undefined);
  } else if (open && !wasOpen) {
    setWasOpen(true);
    setDetailedAnnouncement(null);
    setCurrentPage(1);
    setPendingTargetId(initialAnnouncementId ?? null);
  }

  // Resolve the pending target as soon as it is found in the list, or as soon
  // as the full list is known to not contain it.
  if (open && pendingTargetId !== undefined && !loading) {
    const index = sortedItems.findIndex((a) => a.announcement_id === pendingTargetId);
    if (index !== -1) {
      setDetailedAnnouncement(sortedItems[index]);
      setCurrentPage(Math.floor(index / ITEMS_PER_PAGE) + 1);
    }
    setPendingTargetId(undefined);
  }

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / ITEMS_PER_PAGE));
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden rounded-none border-border flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-border bg-card shrink-0">
          <DialogTitle className="text-lg font-bold text-foreground">
            Оголошення
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Важлива інформація та повідомлення від адміністрації
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="p-8 text-center text-xs font-semibold text-muted-foreground">
                Завантаження оголошень...
              </div>
            ) : sortedItems.length === 0 ? (
              <div className="border border-dashed border-border p-12 text-center">
                <HugeiconsIcon
                  icon={Megaphone01Icon}
                  className="size-8 text-muted-foreground mx-auto mb-3"
                  strokeWidth={1.5}
                />
                <p className="text-sm font-bold text-foreground">Поки немає оголошень</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Нові оголошення від адміністрації з'являться тут
                </p>
              </div>
            ) : detailedAnnouncement ? (
              /* Single Detailed View */
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-xs font-semibold text-primary p-0 h-auto hover:bg-transparent hover:underline"
                  onClick={() => setDetailedAnnouncement(null)}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5 mr-1" strokeWidth={2} />
                  Назад до всіх оголошень
                </Button>

                <div className="border border-border bg-card p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {detailedAnnouncement.is_pinned && (
                        <Badge variant="outline" className="gap-1 border-blue-700/50 bg-blue-500/10 text-blue-500 font-semibold">
                          <HugeiconsIcon icon={PinIcon} className="size-3" strokeWidth={2} />
                          Закріплено
                        </Badge>
                      )}
                      <Badge variant="outline" className="gap-1 border-border bg-muted text-muted-foreground font-normal">
                        <HugeiconsIcon icon={Briefcase01Icon} className="size-3" strokeWidth={1.5} />
                        {detailedAnnouncement.building_name || "Всі гуртожитки"}
                      </Badge>
                      {detailedAnnouncement.created_by_name && (
                        <Badge variant="outline" className="gap-1 border-border bg-muted text-muted-foreground font-normal">
                          <HugeiconsIcon icon={UserIcon} className="size-3" strokeWidth={1.5} />
                          {detailedAnnouncement.created_by_name}
                        </Badge>
                      )}
                    </div>

                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <HugeiconsIcon icon={Clock01Icon} className="size-3" strokeWidth={1.5} />
                      {formatDate(detailedAnnouncement.created_at)}
                    </span>
                  </div>

                  <h2 className="text-base md:text-lg font-bold text-foreground leading-snug break-words">
                    {detailedAnnouncement.title}
                  </h2>

                  <div className="text-xs md:text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
                    {detailedAnnouncement.body}
                  </div>

                  {((detailedAnnouncement as unknown as { link?: string }).link ||
                    extractUrl(detailedAnnouncement.body)) && (
                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      <a
                        href={
                          (detailedAnnouncement as unknown as { link?: string }).link ||
                          extractUrl(detailedAnnouncement.body)!
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <HugeiconsIcon icon={Link01Icon} className="size-4" strokeWidth={2} />
                        Перейти за посиланням
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Paginated List View (5 items per page) */
              paginatedItems.map((item) => {
                const explicitLink = (item as unknown as { link?: string }).link;
                const detectedUrl = explicitLink || extractUrl(item.body);

                return (
                  <div
                    key={item.announcement_id}
                    className="border border-border bg-card p-4 transition-colors hover:border-border/80"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.is_pinned && (
                          <Badge variant="outline" className="gap-1 border-blue-700/50 bg-blue-500/10 text-blue-500 font-semibold">
                            <HugeiconsIcon icon={PinIcon} className="size-3" strokeWidth={2} />
                            Закріплено
                          </Badge>
                        )}
                        <Badge variant="outline" className="gap-1 border-border bg-muted text-muted-foreground font-normal">
                          <HugeiconsIcon icon={Briefcase01Icon} className="size-3" strokeWidth={1.5} />
                          {item.building_name || "Всі гуртожитки"}
                        </Badge>
                      </div>

                      <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                        <HugeiconsIcon icon={Clock01Icon} className="size-3" strokeWidth={1.5} />
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground leading-snug break-words">
                      {item.title}
                    </h3>

                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 break-words leading-relaxed">
                      {item.body}
                    </p>

                    <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setDetailedAnnouncement(item)}
                        className="text-xs font-semibold cursor-pointer"
                      >
                        Детальніше
                        <HugeiconsIcon icon={ArrowRight01Icon} className="size-3 ml-1" strokeWidth={2} />
                      </Button>

                      {detectedUrl && (
                        <a
                          href={detectedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <HugeiconsIcon icon={Link01Icon} className="size-3.5" strokeWidth={2} />
                          Посилання
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {!detailedAnnouncement && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-card shrink-0">
            <span className="text-xs text-muted-foreground font-normal">
              Сторінка {currentPage} з {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="cursor-pointer"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3 mr-1" strokeWidth={2} />
                Попередня
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="cursor-pointer"
              >
                Наступна
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-3 ml-1" strokeWidth={2} />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementsModal;
