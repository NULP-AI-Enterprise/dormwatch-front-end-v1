import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { DatePicker } from "@/components/ui/date-picker";
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
  StatusFilterSelect,
  BuildingFilterSelect,
  PriorityFilterSelect,
  CategoryFilterCombobox,
  WorkerFilterSelect,
} from "@/components/ComplaintFilters";
import { FilterToolbar } from "@/components/FilterToolbar";
import EmptyState from "@/components/EmptyState";
import { complaintIsOverdue } from "@/lib/complaintUtils";
import { ACCENT_BORDER, ACCENT_BG_LIGHT, ACCENT_BG_HOVER_LIGHT, ERROR, ERROR_TEXT } from "@/lib/theme";
import { useBuildings } from "@/hooks/useBuildings";
import { useUser } from "@/context/UserContext";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, InboxIcon } from "@hugeicons/core-free-icons";
import type { Complaint, CategoryOption } from "@/lib/types";

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

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
        const searchOk =
          searchQuery === "" ||
          (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const dateOk = !selectedDate || isSameLocalDay(p.createdAt, selectedDate);
        return (
          statusOk && categoryOk && buildingOk && priorityOk &&
          workerOk && deadlineOk && overdueOk && searchOk && dateOk
        );
      }),
    [complaints, selectedStatus, selectedCategories, selectedBuilding, selectedPriority, selectedWorkers, selectedDeadline, overdueOnly, searchQuery, selectedDate]
  );

  const resetFilters = () => {
    setSelectedStatus([]);
    setSelectedCategories([]);
    setSelectedBuilding([]);
    setSelectedPriority([]);
    setSelectedWorkers([]);
    setSelectedDeadline(undefined);
    setOverdueOnly(false);
    setSelectedDate(undefined);
    setSearchQuery("");
  };

  return (
    <>
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-[90vw] bg-transparent border-none shadow-none p-0 flex justify-center items-center" showCloseButton={false}>
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          {previewImage && (
            <img
              src={previewImage}
              className="w-full h-auto max-h-[90vh] object-contain"
              alt="Full size"
            />
          )}
          <DialogClose className="absolute top-4 right-4 text-foreground hover:text-muted-foreground">
            <HugeiconsIcon icon={Cancel01Icon} className="size-6" strokeWidth={2} />
          </DialogClose>
        </DialogContent>
      </Dialog>

      <div className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 p-6 space-y-6">
          {/* Compact filter toolbar — same paradigm as MyComplaintsPage /
              DashboardPage. Status, building, priority, worker, overdue-only,
              category, two date pickers (deadline + filing) all sit in one
              row above the data. */}
          <FilterToolbar onReset={resetFilters}>
            <div className="w-full sm:w-64">
              <FilterSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Пошук звернень..."
              />
            </div>
            <div className="w-full sm:w-48">
              <StatusFilterSelect value={selectedStatus} onChange={setSelectedStatus} />
            </div>
            <div className="w-full sm:w-48">
              <BuildingFilterSelect
                value={selectedBuilding}
                onChange={setSelectedBuilding}
                buildings={buildings}
              />
            </div>
            <div className="w-full sm:w-48">
              <PriorityFilterSelect value={selectedPriority} onChange={setSelectedPriority} />
            </div>
            <div className="w-full sm:w-48">
              <WorkerFilterSelect
                value={selectedWorkers}
                onChange={setSelectedWorkers}
                workers={workers}
              />
            </div>
            <div className="w-full sm:w-44">
              <DatePicker
                date={selectedDeadline}
                setDate={setSelectedDeadline}
                placeholder="Дедлайн"
              />
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
                date={selectedDate}
                setDate={setSelectedDate}
                placeholder="Дата подання"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
              <Checkbox
                id="overdue-only"
                checked={overdueOnly}
                onCheckedChange={(v) => setOverdueOnly(v === true)}
              />
              <span>Лише прострочені</span>
            </label>
          </FilterToolbar>

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
                icon={InboxIcon}
                title="Звернень не знайдено"
                subtitle="Жодне звернення не відповідає поточним фільтрам."
              />
            )}

            {!loading &&
              !err &&
              filteredComplaints.map((p) => (
                <ComplaintCard
                  key={p.id}
                  complaint={p}
                  cardClassName={`group transition-colors cursor-pointer ${
                    p.status === "pending" && !viewedComplaints.has(p.id as number)
                      ? `border-l-2 ${ACCENT_BORDER} border-y-border border-r-border ${ACCENT_BG_LIGHT} ${ACCENT_BG_HOVER_LIGHT}`
                      : "hover:bg-muted/50"
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
                  footerLeft="id"
                  showAdminActions
                  onAdminPatch={handleAdminPatch}
                  onAdminDelete={handleRemove}
                />
              ))}
          </div>
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
