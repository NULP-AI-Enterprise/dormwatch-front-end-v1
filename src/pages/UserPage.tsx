import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ComplaintCard from "@/components/ComplaintCard";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import AnnouncementsWidget from "@/components/AnnouncementsWidget";
import PhoneNumbersWidget from "@/components/PhoneNumbersWidget";
import ArrowLinkButton from "@/components/ArrowLinkButton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import PageSpinner from "@/components/PageSpinner";
import EmptyState from "@/components/EmptyState";
import { deleteProblem } from "@/services/problemsApi";
import { isAdminUser, isActiveStatus, groupByChain } from "@/lib/complaintUtils";
import { useMyComplaints } from "@/hooks/useMyComplaints";
import { useUser } from "@/context/UserContext";
import { CheckmarkCircle02Icon, Search01Icon } from "@hugeicons/core-free-icons";

const STATUS_FILTERS = [
  { value: "all", label: "Всі" },
  { value: "active", label: "Активні" },
  { value: "resolved", label: "Вирішені" },
] as const;

const UserPage = () => {
  const location = useLocation();
  const openComplaintId = (location.state as { openComplaintId?: number } | null)?.openComplaintId;
  const { user: currentUser } = useUser();
  const { problems, loading, reload, complaintById } = useMyComplaints();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_FILTERS[0].value);

  // Deep link: open the side panel for a specific complaint (e.g. right after
  // filing one from /create-report) once its record has loaded.
  useEffect(() => {
    if (openComplaintId != null && complaintById.has(openComplaintId)) {
      setSelectedId(openComplaintId);
      setSheetOpen(true);
    }
  }, [openComplaintId, complaintById]);

  const filtered = useMemo(() => {
    const scoped = problems.filter((p) => {
      if (statusFilter === "active") return isActiveStatus(p.status);
      if (statusFilter === "resolved") return p.status === "resolved";
      return true;
    });
    return groupByChain(scoped);
  }, [problems, statusFilter]);

  if (loading) return <PageSpinner />;

  const firstName = currentUser?.first_name || "Користувач";
  const building = currentUser?.place?.building?.name || "";
  const room = currentUser?.place?.place_name || "";
  const subtitle = [firstName && `Вітаємо, ${firstName}!`, building, room && `Кімната ${room}`]
    .filter(Boolean)
    .join(" · ");

  const onDelete = (id: number) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    try {
      await deleteProblem(deleteTarget);
      reload();
    } catch (err) {
      console.warn("Failed to delete problem", err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const selectedProblem = selectedId != null ? complaintById.get(selectedId) ?? null : null;

  const openSheet = (id: number) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  return (
    <>
      {/* header row + front-and-center CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Мої звернення
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <ArrowLinkButton to="/create-report">Створити звернення</ArrowLinkButton>
      </div>

      {/* Status segmented control — three buckets over the resident's own set:
          все / активні (still on the pipeline) / вирішені. Rejected and
          withdrawn stay visible in «Всі» via their status badge. */}
      <div className="mb-6">
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          value={statusFilter}
          // Radix emits "" when the active item is clicked again; ignore it so
          // a bucket stays selected at all times.
          onValueChange={(value) => {
            if (value) setStatusFilter(value);
          }}
          aria-label="Фільтр за статусом"
        >
          {STATUS_FILTERS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              // design-system.md §7: ToggleGroup on-states carry the primary fill,
              // not the muted on-state shadcn ships by default.
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary data-[state=on]:hover:bg-primary/80"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* two columns: the full complaint list + sticky contact sidebar */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {problems.length === 0 ? (
            <EmptyState
              icon={CheckmarkCircle02Icon}
              title="Тут поки порожньо"
              subtitle="Створіть перше звернення. Комендант побачить його одразу."
              action={
                <ArrowLinkButton to="/create-report" size="sm">
                  Створити звернення
                </ArrowLinkButton>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search01Icon}
              title="Нічого не знайшли за цим фільтром."
            />
          ) : (
            filtered.map((p) => (
              <ComplaintCard
                key={p.id}
                complaint={p}
                metaVariant="date"
                descriptionFallback="—"
                onCardClick={() => openSheet(p.id)}
                showProgress
                showPhoto
                photoHeight="h-44"
                footerClassName="flex items-center justify-between pt-4"
                showResidentActions
                onResidentChange={reload}
                showDelete
                onDelete={onDelete}
              />
            ))
          )}
        </div>

        <div className="lg:col-span-1 lg:sticky lg:top-20 self-start space-y-4">
          <AnnouncementsWidget />
          <PhoneNumbersWidget />
        </div>
      </div>

      {selectedProblem && (
        <ComplaintSidePanel
          complaint={selectedProblem}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onStatusChange={reload}
          currentUserId={currentUser?.user}
          isAdmin={isAdminUser(currentUser)}
        />
      )}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити звернення?</AlertDialogTitle>
            <AlertDialogDescription>Цю дію не можна скасувати.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Видалити</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserPage;