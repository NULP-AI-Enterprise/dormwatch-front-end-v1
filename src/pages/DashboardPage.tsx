import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  fetchPublicComplaints,
  fetchComplaintDetail,
  deleteProblem,
  fetchCategories,
} from "@/services/problemsApi";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ArrowLinkButton from "@/components/ArrowLinkButton";
import {
  FilterSearchInput,
  ComplaintFiltersPopover,
} from "@/components/ComplaintFilters";
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
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import ImagePreviewDialog from "@/components/ImagePreviewDialog";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import ComplaintCard from "@/components/ComplaintCard";
import PageSpinner from "@/components/PageSpinner";
import EmptyState from "@/components/EmptyState";
import { isAdminUser, isBlockComplaint } from "@/lib/complaintUtils";
import { useBuildings } from "@/hooks/useBuildings";
import { useUser } from "@/context/UserContext";
import type { Complaint, CategoryOption } from "@/lib/types";

const DashboardPage = () => {
  const { user: currentUser } = useUser();
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  // All filters (building/priority/category/search) are multi-select and filtered
  // client-side against the full approved set, matching AdminPage/AdminComplaintsPage.
  // Pilot-scale choice: the fetch returns all approved once and
  // filteredProblems narrows it. Revisit (server-side + pagination) at real scale.
  const [activeCorps, setActiveCorps] = useState<string[]>([]);
  const [activePriority, setActivePriority] = useState<string[]>([]);
  // Public board carries both active ("approved") and completed ("resolved")
  // issues; empty selection means "all of those". Only these two codes are
  // offered — pending/rejected are never in the feed.
  const [activeStatus, setActiveStatus] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [problems, setProblems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const buildings = useBuildings();
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedProblem, setSelectedProblem] = useState<Complaint | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        setLoadError("");
        const complaintsData = await fetchPublicComplaints();
        if (Array.isArray(complaintsData)) setProblems(complaintsData);
      } catch {
        setLoadError("Не вдалося завантажити звернення. Спробуйте ще раз.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [reloadKey]);

  const selectedProblemRef = useRef(selectedProblem);
  selectedProblemRef.current = selectedProblem;

  // Refresh the feed and rebind the open panel to the live record. The feed
  // only holds approved/resolved, so a panel action that moves the complaint
  // out of that set (admin "Взято в роботу" → in_progress, archive/delete)
  // would leave the snapshot stale — refetch the detail to keep status and
  // priority truthful, and close the panel if the record is gone.
  const refreshFeed = useCallback(async () => {
    const data = await fetchPublicComplaints().catch(() => { setLoadError("Не вдалося оновити звернення."); return null; });
    if (!Array.isArray(data)) return;
    const fresh = data.filter(Boolean) as Complaint[];
    setProblems(fresh);
    const current = selectedProblemRef.current;
    if (!current) return;
    const updated = fresh.find((c) => c.id === current.id);
    if (updated) {
      setSelectedProblem(updated);
      return;
    }
    try {
      const detail = await fetchComplaintDetail(current.id);
      if (detail) setSelectedProblem(detail);
    } catch {
      setSelectedProblem(null);
      setSheetOpen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => { refreshFeed(); };
    window.addEventListener("complaintUpdated", handler);
    return () => window.removeEventListener("complaintUpdated", handler);
  }, [refreshFeed]);

  const handleDelete = async (id: number) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    try {
      await deleteProblem(deleteTarget);
      setProblems((prev) => prev.filter((p) => p.id !== deleteTarget));
    } catch {
      setErrorMessage("Помилка при видаленні");
    } finally {
      setDeleteTarget(null);
    }
  };



  const admin = isAdminUser(currentUser);

  const filteredProblems = problems.filter((p) => {
    // Dorm feed displays only complaints concerning:
    // 1. Shared spaces in the dormitory (p.isShared)
    // 2. Block complaints, but ONLY for the current user's room/block
    if (!admin) {
      if (p.status === "rejected" || p.status === "denied") {
        return false;
      }
      if (p.isShared) {
        // Shared space complaint -> visible to all residents
      } else if (isBlockComplaint(p.description)) {
        const userPlaceId = currentUser?.place?.place_id;
        const userPlaceName = currentUser?.place?.place_name;
        const isMyBlock =
          p.isMine ||
          (userPlaceId != null && p.placeId != null && p.placeId === userPlaceId) ||
          (userPlaceName && p.placeName && userPlaceName.trim().toLowerCase() === p.placeName.trim().toLowerCase()) ||
          (userPlaceName && p.room && userPlaceName.trim().toLowerCase() === p.room.trim().toLowerCase());
        if (!isMyBlock) {
          return false;
        }
      } else {
        return false;
      }
    }
    const matchesCategory =
      activeCategories.length === 0 ||
      (p.category != null && activeCategories.includes(p.category));
    // Building filters on the complaint's own location (p.building), matching the
    // other three pages — not the reporter's residence the server join used.
    const matchesBuilding =
      activeCorps.length === 0 || activeCorps.includes(p.building);
    const matchesPriority =
      activePriority.length === 0 ||
      (p.priority != null && activePriority.includes(p.priority));
    const matchesStatus =
      activeStatus.length === 0 || activeStatus.includes(p.status);
    const matchesSearch =
      searchQuery === "" ||
      (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesBuilding && matchesPriority && matchesStatus && matchesSearch;
  });

  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedProblems = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredProblems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProblems, safeCurrentPage]);

  const activeFilterCount =
    activeCategories.length +
    activeCorps.length +
    activePriority.length +
    activeStatus.length;

  if (loading) return <PageSpinner />;
  if (loadError) return <div role="alert" className="space-y-3 p-6">
    <p className="text-sm text-destructive">{loadError}</p>
    <Button variant="outline" onClick={() => setReloadKey((key) => key + 1)}>Спробувати ще раз</Button>
  </div>;

  const resetDashboardFilters = () => {
    setActiveCategories([]);
    setActiveCorps([]);
    setActivePriority([]);
    setActiveStatus([]);
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <>
      <ImagePreviewDialog
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      <div className="min-w-0">
        {/* header + front-and-center CTA (residents create; admins jump to panel) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {admin ? "Публічна дошка звернень" : "Звернення"}
            </h1>
          </div>
          {admin && (
            <ArrowLinkButton to="/admin">
              Перейти в комендант-центр
            </ArrowLinkButton>
          )}
        </div>

        {/* Search stays in the open; the facet filters sit behind one trigger
            that opens a sheet at every breakpoint, so the feed starts near the
            top on desktop as well as phones. */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:max-w-sm">
            <FilterSearchInput
              value={searchQuery}
              onChange={(v) => {
                setSearchQuery(v);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <ComplaintFiltersPopover
              selectedStatus={activeStatus}
              onStatusChange={(v) => {
                setActiveStatus(v);
                setCurrentPage(1);
              }}
              statusCodes={['pending', 'approved', 'in_progress', 'review', 'resolved', 'not_accepted']}
              selectedPriority={activePriority}
              onPriorityChange={(v) => {
                setActivePriority(v);
                setCurrentPage(1);
              }}
              selectedBuilding={admin ? activeCorps : []}
              onBuildingChange={admin ? (v) => {
                setActiveCorps(v);
                setCurrentPage(1);
              } : undefined}
              buildings={admin ? buildings : []}
              selectedCategories={activeCategories}
              onCategoriesChange={(v) => {
                setActiveCategories(v);
                setCurrentPage(1);
              }}
              categories={categories}
              onReset={resetDashboardFilters}
              activeCount={activeFilterCount}
            />
            {(activeFilterCount > 0 || searchQuery.trim()) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetDashboardFilters}
                className="text-xs text-muted-foreground hover:text-foreground h-9 px-2.5 cursor-pointer"
              >
                <X className="size-3.5 mr-1" strokeWidth={2} />
                Скинути
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4 min-w-0">
          {paginatedProblems.map((problem) => {
            return (
              <ComplaintCard
                key={problem.id}
                complaint={problem}
                showOwnerBadge={true}
                onCardClick={() => { setSelectedProblem(problem); setSheetOpen(true); }}
                showPhoto
                photoZoom
                photoHeight="h-44"
                onPhotoPreview={setPreviewImage}
                commentsMode="hidden"
                showDelete={admin}
                onDelete={handleDelete}
              />
            );
          })}

          {filteredProblems.length === 0 && (
            <EmptyState
              icon={Search}
              title="Немає звернень за вибраними фільтрами."
            />
          )}

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border bg-card p-4">
              <span className="text-xs text-muted-foreground font-normal order-2 sm:order-1">
                Показано {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredProblems.length)} з {filteredProblems.length} звернень
              </span>
              <div className="flex items-center gap-1.5 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage === 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="h-8 px-2.5 text-xs cursor-pointer"
                >
                  <ChevronLeft className="size-3.5 mr-1" strokeWidth={2} />
                  <span>Попередня</span>
                </Button>
                <span className="text-xs font-semibold px-2 text-foreground">
                  {safeCurrentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="h-8 px-2.5 text-xs cursor-pointer"
                >
                  <span>Наступна</span>
                  <ChevronRight className="size-3.5 ml-1" strokeWidth={2} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedProblem && (
        <ComplaintSidePanel
          complaint={selectedProblem}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onStatusChange={refreshFeed}
          currentUserId={currentUser?.user}
          isAdmin={admin}
        />
      )}

      <ImagePreviewDialog
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />

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

      <Dialog open={!!errorMessage} onOpenChange={(open) => { if (!open) setErrorMessage(null); }}>
        <DialogContent>
          <DialogTitle>Помилка</DialogTitle>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <DialogClose asChild>
            <Button variant="outline" className="mt-2" onClick={() => setErrorMessage(null)}>OK</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardPage;
