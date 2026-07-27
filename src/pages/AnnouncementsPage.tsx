import { useEffect, useMemo, useState } from "react";
import { fetchAnnouncements } from "@/services/problemsApi";
import AnnouncementCard from "@/components/AnnouncementCard";
import AnnouncementSidePanel from "@/components/AnnouncementSidePanel";
import EmptyState from "@/components/EmptyState";
import PageSpinner from "@/components/PageSpinner";
import { Megaphone01Icon } from "@hugeicons/core-free-icons";
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
            <AnnouncementCard
              key={a.announcement_id}
              announcement={a}
              clickable
              onClick={() => setSelected(a)}
            />
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