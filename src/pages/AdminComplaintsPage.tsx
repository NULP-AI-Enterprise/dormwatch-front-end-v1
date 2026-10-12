import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { isSameLocalDay } from "@/lib/dateUtils";
import {
  fetchAllComplaints,
  updateComplaintAdmin,
  deleteAdminComplaint,
  fetchCategories,
  fetchWorkers,
} from "@/services/problemsApi";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import ComplaintCard from "@/components/ComplaintCard";
import {
  FilterSearchInput,
  ComplaintFiltersPopover,
  ComplaintActiveFilterChips,
} from "@/components/ComplaintFilters";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { complaintIsOverdue } from "@/lib/complaintUtils";
import { ACCENT_BORDER, ACCENT_BG_LIGHT, ACCENT_BG_HOVER_LIGHT, ERROR, ERROR_TEXT } from "@/lib/theme";
import { useBuildings } from "@/hooks/useBuildings";
import { useUser } from "@/context/UserContext";
import ImagePreviewDialog from "@/components/ImagePreviewDialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import { X, Inbox, ArrowLeft, ArrowRight } from "lucide-react";
import type { Complaint, CategoryOption } from "@/lib/types";

const ITEMS_PER_PAGE = 10;

const getPageNumbers = (current: number, total: number): (number | string)[] => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, "...", total];
  }
  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
};

const AdminComplaintsPage = () => {
  const location = useLocation();
  const { user: currentUser } = useUser();
  const [selectedStatus, setSelectedStatus] = useState<string[]>(
    location.state?.selectedStatus ? [location.state.selectedStatus] : []
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [selectedDeadline, setSelectedDeadline] = useState<Date | undefined>(undefined);
  // Triage shortcut target: the overview's Прострочені stat lands here with
  // the derived overdue flag pre-filtered.
  const [overdueOnly, setOverdueOnly] = useState<boolean>(
    !!location.state?.overdueOnly
  );
  const [reworkOnly, setReworkOnly] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [workers, setWorkers] = useState<{ worker_id: number; full_name: string }[]>([]);
  const buildings = useBuildings();

  useEffect(() => {
    fetchWorkers().then(setWorkers).catch(() => setWorkers([]));
  }, []);

  const loadCategories = async () => {
    const data = await fetchCategories();
    setCategories(data);
  };

  const [viewedComplaints, setViewedComplaints] = useState<Set<number>>(() => {
    try {
      const stored = sessionStorage.getItem('viewedComplaints');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const markAsViewed = (id: number) => {
    setViewedComplaints(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      sessionStorage.setItem('viewedComplaints', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const loadComplaints = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchAllComplaints();
      setComplaints(data);
      setSelectedComplaint(prev => prev ? data.find(c => c.id === prev.id) || prev : prev);
    } catch (err) {
      console.warn('Failed to load complaints', err);
      setErr("Не вдалося завантажити звернення.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
    loadCategories();

    window.addEventListener("adminComplaintUpdated", loadComplaints);
    return () => window.removeEventListener("adminComplaintUpdated", loadComplaints);
  }, []);

  const handleAdminPatch = async (id: number, body: Record<string, unknown>) => {
    try {
      await updateComplaintAdmin(id, body);
      loadComplaints();
    } catch (err) {
      console.warn('Failed to update complaint', err);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await deleteAdminComplaint(id);
      setComplaints((prev) => prev.filter((p) => String(p.id) !== String(id)));
    } catch (err) {
      console.warn('Failed to remove complaint', err);
    }
  };

  const filteredComplaints = useMemo(
    () =>
      complaints.filter((p) => {
        const statusOk =
          selectedStatus.length === 0 || selectedStatus.includes(p.status);
        const categoryOk =
          selectedCategories.length === 0 ||
          (p.category != null && selectedCategories.includes(p.category));
        const buildingOk =
          selectedBuilding.length === 0 || selectedBuilding.includes(p.building);
        const priorityOk =
          selectedPriority.length === 0 ||
          (p.priority != null && selectedPriority.includes(p.priority));
        // Worker filter matches the assigned contractor's name (unassigned
        // complaints only show when the filter is empty).
        const workerOk =
          selectedWorkers.length === 0 ||
          (p.worker != null && selectedWorkers.includes(p.worker.full_name));
        const deadlineOk =
          !selectedDeadline || isSameLocalDay(p.deadline, selectedDeadline);
        const overdueOk = !overdueOnly || complaintIsOverdue(p);
        const reworkOk = !reworkOnly || Boolean(p.isRework);
        const searchOk =
          searchQuery === "" ||
          (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const dateOk = !selectedDate || isSameLocalDay(p.createdAt, selectedDate);
        return (
          statusOk && categoryOk && buildingOk && priorityOk &&
          workerOk && deadlineOk && overdueOk && reworkOk && searchOk && dateOk
        );
      }),
    [complaints, selectedStatus, selectedCategories, selectedBuilding, selectedPriority, selectedWorkers, selectedDeadline, overdueOnly, reworkOnly, searchQuery, selectedDate]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedStatus,
    selectedCategories,
    selectedBuilding,
    selectedPriority,
    selectedWorkers,
    selectedDeadline,
    overdueOnly,
    reworkOnly,
    selectedDate,
    searchQuery,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedComplaints = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredComplaints.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredComplaints, safeCurrentPage]);

  const handlePageChange = (newPage: number) => {
    const targetPage = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(targetPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFilters = () => {
    setSelectedStatus([]);
    setSelectedCategories([]);
    setSelectedBuilding([]);
    setSelectedPriority([]);
    setSelectedWorkers([]);
    setSelectedDeadline(undefined);
    setOverdueOnly(false);
    setReworkOnly(false);
    setSelectedDate(undefined);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const activeFilterCount =
    selectedStatus.length +
    selectedCategories.length +
    selectedBuilding.length +
    selectedPriority.length +
    selectedWorkers.length +
    (selectedDeadline ? 1 : 0) +
    (selectedDate ? 1 : 0) +
    (overdueOnly ? 1 : 0) +
    (reworkOnly ? 1 : 0);

  return (
    <>
      <ImagePreviewDialog
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-3">
              <div className="w-full sm:max-w-md">
                <FilterSearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Пошук звернень..."
                />
              </div>
              <ComplaintFiltersPopover
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                selectedBuilding={selectedBuilding}
                onBuildingChange={setSelectedBuilding}
                buildings={buildings}
                selectedPriority={selectedPriority}
                onPriorityChange={setSelectedPriority}
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
                categories={categories}
                selectedWorkers={selectedWorkers}
                onWorkersChange={setSelectedWorkers}
                workers={workers}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedDeadline={selectedDeadline}
                onDeadlineChange={setSelectedDeadline}
                overdueOnly={overdueOnly}
                onOverdueOnlyChange={setOverdueOnly}
                reworkOnly={reworkOnly}
                onReworkOnlyChange={setReworkOnly}
                onReset={resetFilters}
                activeCount={activeFilterCount}
              />
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-xs text-muted-foreground hover:text-foreground h-9 px-2.5 hidden sm:inline-flex cursor-pointer"
                >
                  <X className="size-3.5 mr-1" strokeWidth={2} />
                  Скинути
                </Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground self-center sm:self-auto shrink-0">
              Знайдено: <span className="font-semibold text-foreground">{filteredComplaints.length}</span>
              {totalPages > 1 && (
                <span className="ml-1 text-muted-foreground">
                  (стор. {safeCurrentPage} з {totalPages})
                </span>
              )}
            </div>
          </div>

          <ComplaintActiveFilterChips
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            selectedBuilding={selectedBuilding}
            onBuildingChange={setSelectedBuilding}
            selectedPriority={selectedPriority}
            onPriorityChange={setSelectedPriority}
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
            selectedWorkers={selectedWorkers}
            onWorkersChange={setSelectedWorkers}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedDeadline={selectedDeadline}
            onDeadlineChange={setSelectedDeadline}
            overdueOnly={overdueOnly}
            onOverdueOnlyChange={setOverdueOnly}
            reworkOnly={reworkOnly}
            onReworkOnlyChange={setReworkOnly}
            onResetAll={resetFilters}
          />

          <div className="space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="md" />
              </div>
            )}
            {!loading && err && (
              <div className={`border ${ERROR} ${ERROR_TEXT} p-4 text-xs font-semibold`}>
                {err}
              </div>
            )}

            {!loading && !err && filteredComplaints.length === 0 && (
              <EmptyState
                icon={Inbox}
                title="Звернень не знайдено"
                subtitle="Жодне звернення не відповідає поточним фільтрам."
              />
            )}

            {!loading &&
              !err &&
              paginatedComplaints.map((p) => (
                <ComplaintCard
                  key={p.id}
                  complaint={p}
                  cardClassName={`group transition-colors ${
                    p.status === "pending" && !viewedComplaints.has(p.id as number)
                      ? `border-l-2 ${ACCENT_BORDER} border-y-border border-r-border ${ACCENT_BG_LIGHT} ${ACCENT_BG_HOVER_LIGHT}`
                      : ""
                  }`}
                  onCardClick={() => {
                    markAsViewed(p.id as number);
                    setSelectedComplaint(p);
                    setSheetOpen(true);
                  }}
                  showPriority
                  descriptionFallback={"\u2014"}
                  showPhoto
                  photoZoom
                  photoHeight="h-44"
                  onPhotoPreview={setPreviewImage}
                  showAdminActions
                  onAdminPatch={handleAdminPatch}
                  onAdminDelete={handleRemove}
                />
              ))}
          </div>

          {!loading && !err && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border bg-card p-4">
              <span className="text-xs text-muted-foreground font-normal order-2 sm:order-1">
                Показано {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredComplaints.length)} з {filteredComplaints.length} звернень
              </span>

              <div className="flex items-center gap-1.5 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage === 1}
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  className="h-8 px-2.5 text-xs cursor-pointer"
                >
                  <ArrowLeft className="size-3.5 mr-1" strokeWidth={2} />
                  <span className="hidden sm:inline">Попередня</span>
                </Button>

                <div className="flex items-center gap-1">
                  {getPageNumbers(safeCurrentPage, totalPages).map((page, idx) =>
                    page === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-xs text-muted-foreground select-none">
                        …
                      </span>
                    ) : (
                      <Button
                        key={`page-${page}`}
                        variant={page === safeCurrentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className={`h-8 w-8 p-0 text-xs font-semibold cursor-pointer ${
                          page === safeCurrentPage ? "pointer-events-none" : ""
                        }`}
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  className="h-8 px-2.5 text-xs cursor-pointer"
                >
                  <span className="hidden sm:inline">Наступна</span>
                  <ArrowRight className="size-3.5 ml-1" strokeWidth={2} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedComplaint && (
        <ComplaintSidePanel
          complaint={selectedComplaint}
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open);
            if (!open) setSelectedComplaint(null);
          }}
          onStatusChange={loadComplaints}
          currentUserId={currentUser?.user}
          isAdmin={true}
        />
      )}
    </>
  );
};

export default AdminComplaintsPage;
