import { useEffect, useState } from "react";
import { fetchAnnouncements } from "@/services/problemsApi";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Megaphone01Icon, PinIcon } from "@hugeicons/core-free-icons";
import { formatDate } from "@/lib/dateUtils";
import { sortAnnouncements } from "@/lib/announcementUtils";
import type { Announcement } from "@/lib/types";
import AnnouncementsModal from "@/components/AnnouncementsModal";

// Compact read-only announcements board for the dashboard sidebar. Active only,
// pinned-first, capped to a handful. Realizes the design-system.md "Intentional
// Empty States" pattern.
const MAX_ITEMS = 1;

const AnnouncementsWidget = () => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    fetchAnnouncements()
      .then((all) => {
        const active = all.filter((a) => !a.is_expired);
        setItems(sortAnnouncements(active).slice(0, MAX_ITEMS));
      })
      .finally(() => setLoaded(true));
  }, []);

  const openAnnouncement = (id?: number) => {
    if (id !== undefined) setSelectedId(id);
    else setSelectedId(null);
    setModalOpen(true);
  };

  return (
    <>
      <Card className="border-border shadow-none bg-card">
        <CardContent>
          <h4 className="text-xs font-normal text-muted-foreground mb-3">Оголошення</h4>

          {loaded && items.length === 0 ? (
            <div className="border border-dashed border-border p-8 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center border border-border bg-card">
                <HugeiconsIcon
                  icon={Megaphone01Icon}
                  className="size-5 text-muted-foreground"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-sm text-muted-foreground">Оголошень поки немає</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {items.map((a, i) => (
                <div key={a.announcement_id}>
                  {i > 0 && <Separator className="my-3" dashed />}
                  <button
                    type="button"
                    onClick={() => openAnnouncement(a.announcement_id)}
                    className="flex items-start gap-2 text-left w-full group cursor-pointer p-2 -m-2 border border-transparent hover:bg-muted/50 hover:border-border transition-colors"
                  >
                    {a.is_pinned && (
                      <HugeiconsIcon
                        icon={PinIcon}
                        className="size-3.5 mt-0.5 shrink-0 text-primary"
                        strokeWidth={2}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {a.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(a.building_name || "Всі гуртожитки") + " · " + formatDate(a.created_at)}
                      </p>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <Button
              variant="outline"
              size="xs"
              className="w-full mt-4 font-semibold text-xs border-border text-foreground hover:bg-muted"
              onClick={() => openAnnouncement()}
            >
              <HugeiconsIcon icon={Megaphone01Icon} className="size-3.5 mr-1.5" strokeWidth={1.5} />
              Переглянути всі оголошення
            </Button>
          )}
        </CardContent>
      </Card>

      <AnnouncementsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialAnnouncementId={selectedId}
      />
    </>
  );
};

export default AnnouncementsWidget;
