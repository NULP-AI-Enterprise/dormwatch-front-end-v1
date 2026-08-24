import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { DatePicker } from "@/components/ui/date-picker";
import { isSameLocalDay } from "@/lib/dateUtils";
import {
  fetchAllComplaints,
  updateComplaintAdmin,
  deleteProblem,
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
import EmptyState from "@/components/EmptyState";
import { complaintIsOverdue } from "@/lib/complaintUtils";
import { useBuildings } from "@/hooks/useBuildings";
import { useUser } from "@/context/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import LoadingSpinner from "@/components/LoadingSpinner";

import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  InboxIcon,
} from "@hugeicons/core-free-icons";
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
      await deleteProblem(id);
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
          <DialogClose className="absolute top-4 right-4 text-foreground hover:text-stone-300">
            <HugeiconsIcon icon={Cancel01Icon} className="size-6" strokeWidth={2} />
          </DialogClose>
        </DialogContent>
      </Dialog>

      <div className="flex-1 flex flex-col min-h-screen">
          <div className="flex-1 p-6">
            <div className="grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-border shadow-none bg-card">
                  <CardContent>
                    <div className="mb-4">
                      <FilterSearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Пошук звернень..."
                      />
                    </div>

                    <h4 className="text-xs font-normal text-muted-foreground mb-3">
                      Статус
                    </h4>
                    <StatusFilterSelect value={selectedStatus} onChange={setSelectedStatus} />

                    <Separator className="my-4" />

                    <h4 className="text-xs font-normal text-muted-foreground mb-3">
                      Гуртожиток
                    </h4>
                    <BuildingFilterSelect
                      value={selectedBuilding}
                      onChange={setSelectedBuilding}
                      buildings={buildings}
                    />

                    <Separator className="my-4" />

                    <h4 className="text-xs font-normal text-muted-foreground mb-3">
                      Пріоритет
                    </h4>
                    <PriorityFilterSelect value={selectedPriority} onChange={setSelectedPriority} />

                    <Separator className="my-4" />

                    <h4 className="text-xs font-normal text-muted-foreground mb-3">
                      Виконавець
                    </h4>
                    <WorkerFilterSelect value={selectedWorkers} onChange={setSelectedWorkers} workers={workers} />

                    <Separator className="my-4" />

                    <h4 className="text-xs font-normal text-muted-foreground mb-3">
                      Дедлайн
                    </h4>
                    <div className="space-y-2">
                      <DatePicker
                        date={selectedDeadline}
                        setDate={setSelectedDeadline}
                        placeholder="Оберіть дату"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Checkbox
                        id="overdue-only"
                        checked={overdueOnly}
                        onCheckedChange={(v) => setOverdueOnly(v === true)}
                      />
                      <Label htmlFor="overdue-only" className="text-xs font-normal text-muted-foreground cursor-pointer">
                        Лише прострочені
                      </Label>
                    </div>

                    <Separator className="my-4" />

                    <h4 className="text-xs font-normal text-muted-foreground mb-3">
                      Категорії
                    </h4>
                    <CategoryFilterCombobox
                      value={selectedCategories}
                      onChange={setSelectedCategories}
                      categories={categories}
                    />

                    <Separator className="my-4" />

                    <h4 className="text-xs font-normal text-muted-foreground mb-3">
                      Дата подання
                    </h4>
                    <div className="space-y-2">
                      <DatePicker
                        date={selectedDate}
                        setDate={setSelectedDate}
                        placeholder="Оберіть дату"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3 space-y-4">
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="md" />
                  </div>
                )}
                {!loading && err && (
                  <div className="border border-red-500/30 bg-red-500/10 text-red-400 p-4 text-xs font-semibold">
                    {err}
                  </div>
                )}

                {!loading && !err && filteredComplaints.length === 0 && (
                  <EmptyState
                    icon={InboxIcon}
                    title="Звернень не знайдено"
                    subtitle="Жодне звернення не відповідає поточним фільтрам."
                    action={
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setSelectedStatus([]);
                          setSelectedCategories([]);
                          setSelectedBuilding([]);
                          setSelectedPriority([]);
                          setSelectedWorkers([]);
                          setSelectedDeadline(undefined);
                          setOverdueOnly(false);
                          setSelectedDate(undefined);
                          setSearchQuery("");
                        }}
                      >
                        Скинути фільтри
                      </Button>
                    }
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
                          ? "border-l-2 border-l-blue-500 border-y-border border-r-border bg-blue-500/5 hover:bg-blue-500/10"
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
