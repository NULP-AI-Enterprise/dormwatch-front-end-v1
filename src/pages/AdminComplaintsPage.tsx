import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import {
  fetchAllComplaints,
  fetchApprovedComplaints,
  updateComplaintStatus,
  deleteProblem,
  fetchCategories,
  fetchTickets,
  fetchEmployees,
  fetchJson,
} from "@/services/problemsApi";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import ComplaintCard from "@/components/ComplaintCard";
import TicketSidePanel from "@/components/TicketSidePanel";
import { useAdminHeaderActions } from "@/components/AdminHeaderContext";
import {
  FilterSearchInput,
  StatusFilterSelect,
  BuildingFilterSelect,
  PriorityFilterSelect,
  CategoryFilterButtons,
} from "@/components/ComplaintFilters";
import EmptyState from "@/components/EmptyState";
import { NotificationBell } from "@/components/NotificationBell";
import { useBuildings } from "@/hooks/useBuildings";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Download01Icon,
} from "@hugeicons/core-free-icons";
import type { Complaint, Ticket, Employee, CategoryOption } from "@/lib/types";
import { ExportTicketsModal } from "@/components/ExportTicketsModal";

const AdminComplaintsPage = () => {
  const location = useLocation();
  const { user: currentUser } = useUser();
  const [selectedStatus, setSelectedStatus] = useState(location.state?.selectedStatus || "pending");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [ticketStatus, setTicketStatus] = useState("all");
  const [ticketCategory, setTicketCategory] = useState("all");

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [approvedForTickets, setApprovedForTickets] = useState<Complaint[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [ticketSearchQuery, setTicketSearchQuery] = useState("");

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false);
  const [selectedTicketComplaint, setSelectedTicketComplaint] = useState<Complaint | null>(null);
  const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const buildings = useBuildings();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const loadCategories = async () => {
    const data = await fetchCategories();
    setCategories(data);
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setSavingCategory(true);
    setCategoryError("");
    try {
      await fetchJson("/admin/categories/", {
        method: "POST",
        body: { name },
      });
      setNewCategoryName("");
      await loadCategories();
    } catch (err) {
      setCategoryError("Не вдалося додати категорію");
      console.warn("Failed to add category", err);
    } finally {
      setSavingCategory(false);
    }
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
      setErr("Не вдалося завантажити скарги.");
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    fetchTickets().then(setTickets);
  };

  useEffect(() => {
    loadComplaints();
    loadCategories();

    window.addEventListener("adminComplaintUpdated", loadComplaints);
    return () => window.removeEventListener("adminComplaintUpdated", loadComplaints);
  }, []);

  const [tab, setTab] = useState<"requests" | "tickets">("requests");

  useEffect(() => {
    if (tab === "tickets") {
      loadTickets();
      fetchApprovedComplaints().then(setApprovedForTickets);
      fetchEmployees().then(setEmployees);
    }
  }, [tab]);

  const handleChangeStatus = async (id: number, newStatus: string) => {
    try {
      await updateComplaintStatus(id, newStatus);
      loadComplaints();
    } catch (err) {
      console.warn('Failed to change complaint status', err);
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

  const openTicketSheet = (complaint: Complaint, ticket?: Ticket) => {
    setSelectedTicketComplaint(complaint);
    setTicketToEdit(ticket || null);
    setTicketSheetOpen(true);
  };

  const filteredComplaints = useMemo(
    () =>
      complaints.filter((p) => {
        const statusOk = selectedStatus === "all" || p.status === selectedStatus;
        const categoryOk =
          selectedCategory === "all" || p.category === selectedCategory;
        const buildingOk =
          selectedBuilding === "all" || p.building === selectedBuilding;
        const priorityOk =
          selectedPriority === "all" || p.priority === selectedPriority;
        const searchOk =
          searchQuery === "" ||
          (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const dateOk = !selectedDate || new Date(p.createdAt).toLocaleDateString('en-CA') === format(selectedDate, 'yyyy-MM-dd');
        return statusOk && categoryOk && buildingOk && priorityOk && searchOk && dateOk;
      }),
    [complaints, selectedStatus, selectedCategory, selectedBuilding, selectedPriority, searchQuery, selectedDate]
  );

  const filteredTickets = useMemo(
    () =>
      approvedForTickets.filter((p) => {
        const categoryOk =
          ticketCategory === "all" || p.category === ticketCategory;
        const searchOk =
          ticketSearchQuery === "" ||
          (p.title || "").toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(ticketSearchQuery.toLowerCase());
        const hasTicket = tickets.some((t) => t.complaint === p.id);
        let statusOk = true;
        if (ticketStatus === "created") statusOk = hasTicket;
        else if (ticketStatus === "not_created") statusOk = !hasTicket;
        return categoryOk && searchOk && statusOk;
      }),
    [approvedForTickets, tickets, ticketCategory, ticketStatus, ticketSearchQuery]
  );

  const headerActions = useMemo(
    () => (
      <>
        <Button
          variant="outline"
          size="default"
          className="gap-2"
          onClick={() => setIsExportModalOpen(true)}
        >
          <HugeiconsIcon icon={Download01Icon} className="size-4" strokeWidth={2} />
          Експорт даних
        </Button>
        <NotificationBell onSelectComplaint={(c) => {
          setSelectedComplaint(c);
          setSheetOpen(true);
        }} />
      </>
    ),
    [],
  );
  useAdminHeaderActions(headerActions);

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
      <Tabs value={tab} onValueChange={(v) => setTab(v as "requests" | "tickets")} className="flex-1 flex flex-col">
          <div className="px-6 pt-6">
            <TabsList variant="line">
              <TabsTrigger value="requests" className="text-xs font-semibold">
                Скарги
              </TabsTrigger>
              <TabsTrigger value="tickets" className="text-xs font-semibold">
                Тікети
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="requests" className="flex-1 p-6">
            <div className="grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-border shadow-none bg-card">
                  <CardContent>
                    <div className="mb-4">
                      <FilterSearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Пошук скарг..."
                      />
                    </div>

                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                      Статус
                    </h4>
                    <StatusFilterSelect value={selectedStatus} onValueChange={setSelectedStatus} />

                    <Separator className="my-4" />

                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                      Гуртожиток
                    </h4>
                    <BuildingFilterSelect
                      value={selectedBuilding}
                      onValueChange={setSelectedBuilding}
                      buildings={buildings}
                    />

                    <Separator className="my-4" />

                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                      Пріоритет
                    </h4>
                    <PriorityFilterSelect value={selectedPriority} onValueChange={setSelectedPriority} />

                    <Separator className="my-4" />

                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                      Категорії
                    </h4>
                    <CategoryFilterButtons
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                      categories={categories}
                    />

                    <Separator className="my-4" />

                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                      Дата подання
                    </h4>
                    <div className="space-y-2">
                      <DatePicker
                        date={selectedDate}
                        setDate={setSelectedDate}
                        placeholder="Оберіть дату"
                      />
                    </div>

                    <Separator className="my-4" />

                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                      Нова категорія
                    </h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Назва..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddCategory();
                        }}
                        className="text-xs"
                      />
                      <Button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={savingCategory || !newCategoryName.trim()}
                      >
                        Додати
                      </Button>
                    </div>
                    {categoryError && (
                      <p className="text-xs font-semibold text-destructive mt-2">
                        {categoryError}
                      </p>
                    )}
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
                    title="Скарг не знайдено"
                    subtitle="Жодна скарга не відповідає поточним фільтрам."
                  />
                )}

                {!loading &&
                  !err &&
                  filteredComplaints.map((p) => (
                    <ComplaintCard
                      key={p.id}
                      complaint={p}
                      headerLayout="detail"
                      cardClassName="group hover:bg-muted/50 transition-colors cursor-pointer"
                      onCardClick={() => {
                        setSelectedComplaint(p);
                        setSheetOpen(true);
                      }}
                      showDetails
                      onDetails={() => {
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
                      onStatusChange={handleChangeStatus}
                      onAdminDelete={handleRemove}
                    />
                  ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="flex-1 p-6">
            <div className="grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-border shadow-none bg-card">
                  <CardContent>
                    <div className="mb-4">
                      <FilterSearchInput
                        value={ticketSearchQuery}
                        onChange={setTicketSearchQuery}
                        placeholder="Пошук тікетів..."
                      />
                    </div>

                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                      Статус тікету
                    </h4>
                    <Select value={ticketStatus} onValueChange={setTicketStatus}>
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue placeholder="Статус тікету" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Всі</SelectItem>
                        <SelectItem value="not_created">Без тікета</SelectItem>
                        <SelectItem value="created">З тікетом</SelectItem>
                      </SelectContent>
                    </Select>

                    <Separator className="my-4" />

                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                      Категорії
                    </h4>
                    <CategoryFilterButtons
                      value={ticketCategory}
                      onChange={setTicketCategory}
                      categories={categories}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3 space-y-6">
                <h3 className="text-sm font-semibold text-foreground">
                  Тікети для підтверджених заявок
                </h3>
                {filteredTickets.length === 0 ? (
                  <EmptyState
                    icon={InboxIcon}
                    title="Жодна заявка не відповідає фільтрам."
                  />
                ) : (
                  <div className="grid lg:grid-cols-2 gap-4">
                    {filteredTickets.map((p) => {
                      const ticket = tickets.find((t) => t.complaint === p.id);
                      return (
                        <ComplaintCard
                          key={p.id}
                          complaint={p}
                          variant="compact"
                          showPriority
                          showTicketControls
                          ticket={ticket}
                          onTicketAction={openTicketSheet}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
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
          onCreateTicket={(c) => {
            setSheetOpen(false);
            setSelectedComplaint(null);
            openTicketSheet(c);
          }}
        />
      )}

      {selectedTicketComplaint && (
        <TicketSidePanel
          complaint={selectedTicketComplaint}
          ticket={ticketToEdit}
          open={ticketSheetOpen}
          onOpenChange={(open) => {
            setTicketSheetOpen(open);
            if (!open) {
              setSelectedTicketComplaint(null);
              setTicketToEdit(null);
            }
          }}
          employees={employees}
          allTickets={tickets}
          onTicketChange={loadTickets}
        />
      )}

      <ExportTicketsModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
      />
    </>
  );
};

export default AdminComplaintsPage;
