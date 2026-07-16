import { useEffect, useMemo, useState } from "react";
import { fetchAnnouncements } from "@/services/problemsApi";
import AnnouncementSidePanel from "@/components/AnnouncementSidePanel";
import EmptyState from "@/components/EmptyState";
import PageSpinner from "@/components/PageSpinner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dateUtils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Megaphone01Icon, PinIcon } from "@hugeicons/core-free-icons";
import type { Announcement } from "@/lib/types";

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Announcement | null>(null);

  useEffect(() => {
    fetchAnnouncements()
      .then(setAnnouncements)
      .finally(() => setLoading(false));
  }, []);

  // Server already orders pinned-first, newest-first; push expired posts to the
  // bottom so the active board stays on top.
  const ordered = useMemo(() => {
    return [...announcements].sort((a, b) => Number(a.is_expired) - Number(b.is_expired));
  }, [announcements]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Оголошення
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Новини та важлива інформація від адміністрації гуртожитку.
        </p>
      </div>

      {loading ? (
        <PageSpinner />
      ) : ordered.length === 0 ? (
        <EmptyState
          icon={Megaphone01Icon}
          title="Оголошень поки немає"
          subtitle="Тут зʼявлятимуться новини та важливі повідомлення від адміністрації."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {ordered.map((a) => (
            <Card
              key={a.announcement_id}
              className={cn(
                "py-0 border-border shadow-none bg-card group hover:bg-muted/50 transition-colors cursor-pointer",
                a.is_expired && "opacity-60"
              )}
              onClick={() => setSelected(a)}
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{a.building_name || "Всі гуртожитки"}</Badge>
                    {a.is_pinned && (
                      <Badge>
                        <HugeiconsIcon icon={PinIcon} data-icon="inline-start" strokeWidth={2} />
                        Закріплено
                      </Badge>
                    )}
                    {a.is_expired && (
                      <Badge variant="outline" className="text-muted-foreground">Архів</Badge>
                    )}
                  </div>
                  <span className="text-xs font-normal text-muted-foreground shrink-0">
                    {formatDate(a.created_at)}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2 group-hover:text-blue-400 transition-colors">
                  {a.title || "Без назви"}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 break-words whitespace-pre-wrap">
                  {a.body}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AnnouncementSidePanel
        open={selected !== null}
        announcement={selected}
        readOnly
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </>
  );
};

export default AnnouncementsPage;
