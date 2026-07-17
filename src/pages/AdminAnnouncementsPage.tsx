import { useEffect, useMemo, useState } from "react";
import { fetchAdminAnnouncements, deleteAnnouncement } from "@/services/problemsApi";
import { useBuildings } from "@/hooks/useBuildings";
import { useAdminHeaderActions } from "@/components/AdminHeaderContext";
import AnnouncementSidePanel from "@/components/AnnouncementSidePanel";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddIcon, Delete02Icon, Megaphone01Icon, PinIcon } from "@hugeicons/core-free-icons";
import { formatDate } from "@/lib/dateUtils";
import type { Announcement } from "@/lib/types";

const AdminAnnouncementsPage = () => {
  const buildings = useBuildings();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    fetchAdminAnnouncements()
      .then(setAnnouncements)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Push the "new announcement" button into the shared AdminLayout header.
  const headerAction = useMemo(
    () => (
      <Button onClick={() => setCreating(true)}>
        <HugeiconsIcon icon={AddIcon} data-icon="inline-start" strokeWidth={2} />
        Нове оголошення
      </Button>
    ),
    []
  );
  useAdminHeaderActions(headerAction);

  const handleDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await deleteAnnouncement(pending.announcement_id);
      setPending(null);
      load();
    } catch (err) {
      console.warn("Failed to delete announcement", err);
    } finally {
      setDeleting(false);
    }
  };

  const panelOpen = creating || selected !== null;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        )}

        {!loading && announcements.length === 0 && (
          <EmptyState
            icon={Megaphone01Icon}
            title="Оголошень ще немає"
            subtitle="Створіть перше оголошення для мешканців."
          />
        )}

        {!loading && announcements.length > 0 && (
          <div className="bg-card border border-border overflow-hidden">
            <Table className="text-left border-collapse">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b border-border text-sm text-muted-foreground">
                  <TableHead className="px-6 py-3 font-semibold">Заголовок</TableHead>
                  <TableHead className="px-6 py-3 font-semibold">Область</TableHead>
                  <TableHead className="px-6 py-3 font-semibold">Статус</TableHead>
                  <TableHead className="px-6 py-3 font-semibold">Дата</TableHead>
                  <TableHead className="px-6 py-3 font-semibold text-right">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {announcements.map((a) => (
                  <TableRow
                    key={a.announcement_id}
                    className="bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelected(a)}
                  >
                    <TableCell className="px-6 py-4">
                      <p className="font-semibold text-foreground">{a.title}</p>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="secondary">{a.building_name || "Всі гуртожитки"}</Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {a.is_pinned && (
                          <Badge>
                            <HugeiconsIcon icon={PinIcon} data-icon="inline-start" strokeWidth={2} />
                            Закріплено
                          </Badge>
                        )}
                        {a.is_expired && (
                          <Badge variant="outline" className="text-muted-foreground">Архів</Badge>
                        )}
                        {!a.is_pinned && !a.is_expired && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">
                      {formatDate(a.created_at)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Видалити ${a.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPending(a);
                        }}
                      >
                        <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AnnouncementSidePanel
        open={panelOpen}
        announcement={selected}
        buildings={buildings}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setCreating(false);
          }
        }}
        onSaved={load}
      />

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити оголошення?</AlertDialogTitle>
            <AlertDialogDescription>
              Оголошення «{pending?.title}» буде видалено. Сповіщення, які вже
              отримали мешканці, залишаться.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAnnouncementsPage;
