import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  fetchAllComplaints,
  fetchApprovedComplaints,
  updateComplaintStatus,
  deleteProblem,
  CATEGORY_LABELS,
  fetchTickets,
  fetchEmployees,
} from "../services/problemsApi";
import { resolveImageUrl } from "../services/imageUtils";
import ComplaintSidePanel from "../components/ComplaintSidePanel";
import TicketCreateForm from "../components/TicketCreateForm";
import { useUser } from "../context/UserContext";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import LoadingSpinner from "../components/LoadingSpinner";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";

import { Separator } from "../components/ui/separator";
import { statusBadgeClass, statusLabel, priorityBadgeClass, priorityLabel } from "../lib/complaintUtils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SearchIcon,
  Delete01Icon,
  EditIcon,
  Message01Icon,
  Cancel01Icon,
  InboxIcon,
  CheckmarkCircleIcon,
  CancelCircleIcon,
  AddIcon,
} from "@hugeicons/core-free-icons";
import type { Complaint, Ticket, Employee } from "../lib/types";

const categoryOptions = [
  { id: "all", name: "Всі категорії" },
  { id: "plumbing", name: "Сантехніка" },
  { id: "electricity", name: "Електрика" },
  { id: "furniture", name: "Меблі" },
  { id: "internet", name: "Інтернет" },
];

const statusOptions = [
  { id: "pending", name: "Очікує" },
  { id: "approved", name: "Активно" },
  { id: "rejected", name: "Відхилено" },
  { id: "resolved", name: "Вирішено" },
];

const ticketStatusOptions = [
  { id: "all", name: "Всі" },
  { id: "not_created", name: "Без тікета" },
  { id: "created", name: "З тікетом" },
];

function FilterRadioGroup({
  options,
  value,
  onChange,
}: {
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="space-y-1">
      {options.map((opt) => (
        <label
          key={opt.id}
          className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors border-l-4 ${
            value === opt.id
              ? "border-l-blue-500 bg-primary/5 text-foreground"
              : "border-l-transparent text-muted-foreground hover:border-l-stone-500 hover:text-foreground"
          }`}
        >
          <RadioGroupItem value={opt.id} id={`filter-${opt.id}`} className="w-3.5 h-3.5 accent-blue-500" />
          <span className="text-xs font-semibold cursor-pointer">
            {opt.name}
          </span>
        </label>
      ))}
    </RadioGroup>
  );
}

const AdminComplaintsPage = () => {
  const location = useLocation();
  const { user: currentUser } = useUser();
  const [selectedStatus, setSelectedStatus] = useState(location.state?.selectedStatus || "pending");
  const [selectedCategory, setSelectedCategory] = useState("all");

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
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedForTicket, setSelectedForTicket] = useState<Complaint | null>(null);
  const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
  const [, setEmployees] = useState<Employee[]>([]);

  const loadComplaints = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchAllComplaints();
      setComplaints(data);
    } catch (err) {
      console.warn('Failed to load complaints', err);
      setErr("Не вдалося завантажити заявки.");
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    fetchTickets().then(setTickets);
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const [tab, setTab] = useState<"requests" | "tickets">("requests");

  useEffect(() => {
    if (tab === "tickets") {
      loadTickets();
      fetchApprovedComplaints("new").then(setApprovedForTickets);
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

  const openTicketModal = (complaint: Complaint, ticket?: Ticket) => {
    setSelectedForTicket(complaint);
    setTicketToEdit(ticket || null);
    setIsTicketModalOpen(true);
  };

  const filteredComplaints = useMemo(
    () =>
      complaints.filter((p) => {
        const statusOk = selectedStatus === "all" || p.status === selectedStatus;
        const categoryOk =
          selectedCategory === "all" || p.category === selectedCategory;
        const searchOk =
          searchQuery === "" ||
          (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        return statusOk && categoryOk && searchOk;
      }),
    [complaints, selectedStatus, selectedCategory, searchQuery]
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

  return (
    <>
      <div className="flex-1 flex flex-col min-h-screen">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "requests" | "tickets")} className="flex-1 flex flex-col">
          <div className="flex items-center">
            <TabsList variant="line" className="h-auto bg-transparent">
              <TabsTrigger value="requests" className="px-5 py-3 text-xs font-semibold">
                Заявки
              </TabsTrigger>
              <TabsTrigger value="tickets" className="px-5 py-3 text-xs font-semibold">
                Тікети
              </TabsTrigger>
            </TabsList>
          </div>
          <Separator />

          <TabsContent value="requests" className="flex-1 p-5">
            <div className="grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-border shadow-none bg-card">
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <HugeiconsIcon icon={SearchIcon} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" strokeWidth={2} />
                      <Input
                        placeholder="Пошук заявок..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>

                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                      Статус
                    </h4>
                    <FilterRadioGroup
                      options={[{ id: "all", name: "Всі" }, ...statusOptions]}
                      value={selectedStatus}
                      onChange={setSelectedStatus}
                    />

                    <Separator className="my-4" />

                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                      Категорії
                    </h4>
                    <FilterRadioGroup
                      options={categoryOptions}
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                    />
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
                  <div className="border border-red-500/30 bg-red-500/10 text-red-400 p-4 text-xs font-bold">
                    {err}
                  </div>
                )}

                {!loading && !err && filteredComplaints.length === 0 && (
                  <div className="border border-dashed border-border p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 mb-4 border border-border bg-card flex items-center justify-center text-muted-foreground">
                      <HugeiconsIcon icon={InboxIcon} className="size-5" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-bold text-foreground mb-1">Заявок не знайдено</p>
                    <p className="text-xs text-muted-foreground">Жодна заявка не відповідає поточним фільтрам.</p>
                  </div>
                )}

                {!loading &&
                  !err &&
                  filteredComplaints.map((p) => (
                    <Card key={p.id} className="border-border shadow-none bg-card group">
                      <div className="p-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground truncate max-w-xl">
                              {p.title || "Без назви"}
                            </h3>
                            <p className="text-xs font-normal text-muted-foreground mt-1">
                              {CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS] || p.category || "Категорія"}<span className="w-1 h-1 bg-border inline-block mx-1" />{p.building ? `Корпус ${p.building}` : "Корпус ?"}<span className="w-1 h-1 bg-border inline-block mx-1" />{p.placeName || "?"}
                            </p>
                          </div>
                          <Badge variant="outline" className={statusBadgeClass(p.status)}>
                            {statusLabel(p.status)}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge
                            variant="outline"
                            className={priorityBadgeClass(p.priority)}
                          >
                            Пріоритет: {priorityLabel(p.priority)}
                          </Badge>
                          {p.createdAt && (
                            <span className="text-xs text-muted-foreground font-semibold">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                          {p.description || "—"}
                        </p>

                        {p.photoUrl && (
                          <div className="w-full h-44 overflow-hidden border border-border mb-4">
                            <img
                              src={resolveImageUrl(p.thumbnail || p.photoUrl)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex flex-col md:flex-row md:items-center justify-between pt-4 gap-4">
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground font-semibold">
                              ID: {p.id}
                            </span>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => {
                                setSelectedComplaint(p);
                                setSheetOpen(true);
                              }}
                              className="text-primary text-xs font-semibold hover:underline inline-flex items-center gap-1 p-0 h-auto"
                            >
                              <HugeiconsIcon icon={Message01Icon} className="size-3" strokeWidth={2} />
                              Коментарі
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {p.status === "pending" && (
                              <>
                                <Button
                                  size="xs"
                                  onClick={() => handleChangeStatus(p.id, "approved")}
                                >
                                  <HugeiconsIcon icon={CheckmarkCircleIcon} className="size-3 mr-1" strokeWidth={2} />
                                  Схвалити
                                </Button>
                                <Button
                                  size="xs"
                                  variant="destructive"
                                  onClick={() => handleChangeStatus(p.id, "rejected")}
                                >
                                  <HugeiconsIcon icon={CancelCircleIcon} className="size-3 mr-1" strokeWidth={2} />
                                  Відхилити
                                </Button>
                              </>
                            )}
                            {p.status === "approved" && (
                              <Button
                                size="xs"
                                onClick={() => handleChangeStatus(p.id, "resolved")}
                              >
                                <HugeiconsIcon icon={CheckmarkCircleIcon} className="size-3 mr-1" strokeWidth={2} />
                                Вирішити
                              </Button>
                            )}
                            <Button
                              size="xs"
                              variant="destructive"
                              onClick={() => handleRemove(p.id)}
                            >
                              <HugeiconsIcon icon={Delete01Icon} className="size-3 mr-1" strokeWidth={2} />
                              Видалити
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="flex-1 p-5">
            <div className="grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-border shadow-none bg-card">
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" strokeWidth={2} />
                      <Input
                        placeholder="Пошук тікетів..."
                        value={ticketSearchQuery}
                        onChange={(e) => setTicketSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>

                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                      Статус тікету
                    </h4>
                    <FilterRadioGroup
                      options={ticketStatusOptions}
                      value={ticketStatus}
                      onChange={setTicketStatus}
                    />

                    <Separator className="my-4" />

                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                      Категорії
                    </h4>
                    <FilterRadioGroup
                      options={categoryOptions}
                      value={ticketCategory}
                      onChange={setTicketCategory}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3 space-y-6">
                <h3 className="text-sm font-bold text-foreground">
                  Тікети для підтверджених заявок
                </h3>
                {filteredTickets.length === 0 ? (
                  <div className="border border-dashed border-border p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 mb-4 border border-border bg-card flex items-center justify-center text-muted-foreground">
                      <Inbox className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <p className="text-xs text-muted-foreground">Жодна заявка не відповідає фільтрам.</p>
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-2 gap-4">
                    {filteredTickets.map((p) => {
                      const ticket = tickets.find((t) => t.complaint === p.id);
                      return (
                        <Card key={p.id} className="border-border shadow-none bg-card">
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-sm font-bold text-foreground">
                                {p.title || "Без назви"}
                              </h4>
                              <Badge
                                variant="outline"
                                className={priorityBadgeClass(p.priority)}
                              >
                                {priorityLabel(p.priority)}
                              </Badge>
                            </div>
                            <div className="flex gap-2 mb-3 items-center">
                              <Badge variant="outline" className="text-muted-foreground border-border bg-card">
                                {CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS] || p.category || "Категорія"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{p.building ? `Корпус ${p.building}` : "Корпус ?"}<span className="w-1 h-1 bg-border inline-block mx-1" />{p.placeName || "?"}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-4 line-clamp-3">{p.description}</p>

                            {ticket ? (
                              <div className="bg-primary/5 p-3 border border-primary/10 relative group/ticket">
                                <p className="text-xs font-bold text-primary">
                                  Тікет створено (ID: {ticket.ticket_id})
                                </p>
                                {ticket.user && (
                                  <p className="text-xs text-primary/80 mt-1">
                                    Виконавець: {ticket.user.first_name} {ticket.user.last_name}
                                  </p>
                                )}
                                {ticket.deadline && (
                                  <p className="text-xs text-primary/70 mt-1">
                                    Дедлайн: {new Date(ticket.deadline).toLocaleDateString()}
                                  </p>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => openTicketModal(p, ticket)}
                                  className="absolute top-2 right-2 text-primary hover:text-blue-300 opacity-0 group-hover/ticket:opacity-100 transition-opacity"
                                >
                                  <HugeiconsIcon icon={EditIcon} className="size-3.5" strokeWidth={2} />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => openTicketModal(p)}
                              >
                                <HugeiconsIcon icon={AddIcon} className="size-4 mr-1.5" strokeWidth={2} />
                                Створити тікет
                              </Button>
                            )}
                          </div>
                        </Card>
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
        />
      )}

      {isTicketModalOpen && selectedForTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border shadow-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-base font-bold text-foreground">
                {ticketToEdit ? "Редагувати тікет" : "Створити тікет"}
              </h2>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsTicketModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-5" strokeWidth={2} />
              </Button>
            </div>
            <TicketCreateForm
              onClose={() => setIsTicketModalOpen(false)}
              onSaved={() => {
                setIsTicketModalOpen(false);
                loadTickets();
              }}
              editTicket={ticketToEdit}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AdminComplaintsPage;
