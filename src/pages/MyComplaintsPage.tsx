import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { deleteProblem, fetchCategories } from "@/services/problemsApi";
import ComplaintCard from "@/components/ComplaintCard";
import CommentSection from "@/components/CommentSection";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import ArrowLinkButton from "@/components/ArrowLinkButton";
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
import { DatePicker } from "@/components/ui/date-picker";
import {
  FilterSearchInput,
  StatusFilterSelect,
  PriorityFilterSelect,
  CategoryFilterCombobox,
} from "@/components/ComplaintFilters";
import { FilterToolbar } from "@/components/FilterToolbar";
import PageSpinner from "@/components/PageSpinner";
import EmptyState from "@/components/EmptyState";
import { isAdminUser, groupByChain } from "@/lib/complaintUtils";
import { isSameLocalDay } from "@/lib/dateUtils";
import { useCommentToggle } from "@/hooks/useCommentToggle";
import { useMyComplaints } from "@/hooks/useMyComplaints";
import { useUser } from "@/context/UserContext";
import type { CategoryOption } from "@/lib/types";
import { CheckmarkCircle02Icon, Search01Icon } from "@hugeicons/core-free-icons";

const MyComplaintsPage = () => {
  const location = useLocation();
  const openComplaintId = (location.state as { openComplaintId?: number } | null)?.openComplaintId;
  const { user: currentUser } = useUser();
  const comments = useCommentToggle();
  const { problems, loading, reload } = useMyComplaints();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string[]>([]);
  const [priority, setPriority] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);


  // Deep link: open the side panel for a specific complaint (e.g. right after
  // filing one from /create-report) once its record has loaded.
  useEffect(() => {
    if (openComplaintId != null && problems.some((p) => p.id === openComplaintId)) {
      setSelectedId(openComplaintId);
      setSheetOpen(true);
    }
  }, [openComplaintId, problems]);

  const onDelete = async (id: number) => {
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

  const resetFilters = () => {
    setStatus([]);
    setPriority([]);
    setSelectedCategories([]);
    setDate(undefined);
    setSearch("");
  };

  const filtered = useMemo(
    () =>
      groupByChain(
        problems.filter((p) => {
          const searchOk =
            search === "" ||
            (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
            (p.description || "").toLowerCase().includes(search.toLowerCase());
          const statusOk = status.length === 0 || status.includes(p.status);
          const priorityOk =
            priority.length === 0 || (p.priority != null && priority.includes(p.priority));
          const categoryOk =
            selectedCategories.length === 0 ||
            (p.category != null && selectedCategories.includes(p.category));
          const dateOk = !date || isSameLocalDay(p.createdAt, date);
          return searchOk && statusOk && priorityOk && categoryOk && dateOk;
        })
      ),
    [problems, search, status, priority, selectedCategories, date]
  );

  if (loading) return <PageSpinner />;

  const selectedProblem = selectedId != null ? problems.find((p) => p.id === selectedId) ?? null : null;

  const openSheet = (id: number) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  return (
    <>
      {/* header + front-and-center CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Мої звернення
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Усі ваші звернення та що з ними зараз відбувається.
          </p>
        </div>
        <ArrowLinkButton to="/create-report">Створити звернення</ArrowLinkButton>
      </div>

      {/* Compact filter toolbar — a single short row instead of a 25% sidebar.
          A resident's own handful of records doesn't need four vertical
          sections; chips and a search input sit inline above the data, and
          the reset button is right-aligned. */}
      <div className="mb-6">
        <FilterToolbar onReset={resetFilters}>
          <div className="w-full sm:w-64">
            <FilterSearchInput value={search} onChange={setSearch} />
          </div>
          <div className="w-full sm:w-48">
            <StatusFilterSelect value={status} onChange={setStatus} />
          </div>
          <div className="w-full sm:w-48">
            <PriorityFilterSelect value={priority} onChange={setPriority} />
          </div>
          <div className="w-full sm:w-56">
            <CategoryFilterCombobox
              value={selectedCategories}
              onChange={setSelectedCategories}
              categories={categories}
            />
          </div>
          <div className="w-full sm:w-44">
            <DatePicker
              date={date}
              setDate={setDate}
              placeholder="Дата подання"
            />
          </div>
        </FilterToolbar>
      </div>

      {/* request list */}
      <div className="space-y-4">
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
            title="Нічого не знайшли за цими фільтрами."
            action={
              <button
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                onClick={resetFilters}
              >
                Скинути фільтри
              </button>
            }
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
              commentsMode="inline"
              commentsSide="right"
              commentsOpen={comments.isOpen(p.id)}
              onCommentToggle={() => comments.toggle(p.id)}
              commentsContent={
                <CommentSection
                  complaintId={p.id}
                  currentUserId={currentUser?.user}
                  isAdmin={isAdminUser(currentUser)}
                  complaintAuthorId={p.user_id}
                />
              }
              showResidentActions
              onResidentChange={reload}
              showDelete
              onDelete={onDelete}
            />
          ))
        )}
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

export default MyComplaintsPage;
