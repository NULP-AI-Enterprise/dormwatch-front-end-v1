import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAnnouncements } from "@/services/problemsApi";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import { Megaphone01Icon, PinIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { formatDate } from "@/lib/dateUtils";
import type { Announcement } from "@/lib/types";

// Compact read-only announcements board for the dashboard sidebar. Active only
// (expired posts are filtered out here — they still live on /announcements),
// pinned-first, capped to a handful. Realizes the DESIGN.md "CommunityBoard".
const MAX_ITEMS = 4;

const AnnouncementsWidget = () => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchAnnouncements()
      .then((all) => setItems(all.filter((a) => !a.is_expired).slice(0, MAX_ITEMS)))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <Card className="border-border shadow-none bg-card">
      <CardContent>
        <h4 className="text-xs font-semibold text-muted-foreground mb-3">Оголошення</h4>

        {loaded && items.length === 0 ? (
          <div className="border border-dashed border-border p-8 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center border border-border bg-card">
              <HugeiconsIcon
                icon={Megaphone01Icon}
                className="size-5 text-muted-foreground"
                strokeWidth={1.5}
              />
            </div>
            <p className="text-xs text-muted-foreground">Оголошень поки немає</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {items.map((a, i) => (
              <div key={a.announcement_id}>
                {i > 0 && <Separator className="my-3" dashed />}
                <div className="flex items-start gap-2">
                  {a.is_pinned && (
                    <HugeiconsIcon
                      icon={PinIcon}
                      className="size-3.5 mt-0.5 shrink-0 text-primary"
                      strokeWidth={2}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(a.building_name || "Всі гуртожитки") + " · " + formatDate(a.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator className="my-4" />
        <Link
          to="/announcements"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          Усі оголошення
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" strokeWidth={2} />
        </Link>
      </CardContent>
    </Card>
  );
};

export default AnnouncementsWidget;
