import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  fetchAllComplaints,
  fetchApprovedComplaints,
  updateComplaintStatus,
  deleteProblem,
  fetchUserProfile,
  CATEGORY_LABELS,
  fetchTickets,
  fetchEmployees,
} from "../services/problemsApi";
import { resolveImageUrl } from "../services/imageUtils";
import AdminSidebar from "../components/AdminSidebar";
import CommentSection from "../components/CommentSection";
import TicketCreateForm from "../components/TicketCreateForm";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import LoadingSpinner from "../components/LoadingSpinner";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { statusBadgeClass, statusLabel, humanLocation, priorityBadgeClass, priorityLabel, isAdminUser, getUserInitials } from "../lib/complaintUtils";
import {
  Search,
  Trash2,
  Edit3,
  MessageSquare,
  X,
} from "lucide-react";

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
        <div
          key={opt.id}
          className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors border-l-4 ${
            value === opt.id
              ? "border-l-blue-500 bg-blue-500/5 text-stone-50"
              : "border-l-transparent text-stone-400 hover:border-l-stone-500 hover:text-stone-200"
          }`}
        >
          <RadioGroupItem value={opt.id} id={`filter-${opt.id}`} className="w-3.5 h-3.5 accent-blue-500" />
          <Label htmlFor={`filter-${opt.id}`} className="text-xs font-semibold cursor-pointer">
            {opt.name}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

const AdminComplaintsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState(location.state?.selectedStatus || "pending");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [ticketStatus, setTicketStatus] = useState("all");
  const [ticketCategory, setTicketCategory] = useState("all");

  const [complaints, setComplaints] = useState<any[]>([]);
  const [approvedForTickets, setApprovedForTickets] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [ticketSearchQuery, setTicketSearchQuery] = useState("");

  const [openCommentsId, setOpenCommentsId] = useState<number | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedForTicket, setSelectedForTicket] = useState<any>(null);
  const [ticketToEdit, setTicketToEdit] = useState<any>(null);
  const [, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await fetchUserProfile().catch(() => null);
      if (!user) {
        navigate("/");
        return;
      }
      if (!isAdminUser(user)) navigate("/");
      setCurrentUser(user);
    };
    checkAuth();
  }, [navigate]);

  const loadComplaints = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchAllComplaints();
      setComplaints(data);
    } catch {
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
    } catch {
      // silently fail
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await deleteProblem(id);
      setComplaints((prev) => prev.filter((p) => String(p.id) !== String(id)));
    } catch {
      // silently fail
    }
  };

  const openTicketModal = (complaint: any, ticket?: any) => {
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
        const hasTicket = tickets.some((t: any) => t.complaint === p.id);
        let statusOk = true;
        if (ticketStatus === "created") statusOk = hasTicket;
        else if (ticketStatus === "not_created") statusOk = !hasTicket;
        return categoryOk && searchOk && statusOk;
      }),
    [approvedForTickets, tickets, ticketCategory, ticketStatus, ticketSearchQuery]
  );

  const initials = getUserInitials(currentUser, "AD");

  const userName = currentUser
    ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || "Admin"
    : "Admin";

  return (
    <div className="flex min-h-screen dark bg-stone-900">
      <AdminSidebar
        userName={userName}
        userRole="Адміністратор"
        initials={initials}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "requests" | "tickets")} className="flex-1 flex flex-col">
          <div className="flex items-center border-b border-stone-700">
            <TabsList variant="line" className="h-auto bg-transparent">
              <TabsTrigger value="requests" className="px-5 py-3 text-xs font-bold">
                Заявки
              </TabsTrigger>
              <TabsTrigger value="tickets" className="px-5 py-3 text-xs font-bold">
                Тікети
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="requests" className="flex-1 p-5">
            <div className="grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-stone-700 shadow-none bg-stone-800">
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400" strokeWidth={2} />
                      <Input
                        placeholder="Пошук заявок..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>

                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-3">
                      Статус
                    </h4>
                    <FilterRadioGroup
                      options={[{ id: "all", name: "Всі" }, ...statusOptions]}
                      value={selectedStatus}
                      onChange={setSelectedStatus}
                    />

                    <Separator className="my-4 bg-stone-700" />

                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-3">
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
                    <LoadingSpinner size="md" className="text-blue-500 border-blue-500" />
                  </div>
                )}
                {!loading && err && (
                  <div className="border border-red-500/30 bg-red-500/10 text-red-400 p-4 text-xs font-bold">
                    {err}
                  </div>
                )}

                {!loading && !err && filteredComplaints.length === 0 && (
                  <div className="empty-state">
                    <p className="text-sm font-bold text-stone-50 mb-1">Заявок не знайдено</p>
                    <p className="text-xs text-stone-400">Жодна заявка не відповідає поточним фільтрам.</p>
                  </div>
                )}

                {!loading &&
                  !err &&
                  filteredComplaints.map((p) => (
                    <Card key={p.id} className="border-stone-700 shadow-none bg-stone-800 group">
                      <div className="p-5">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                          <div>
                            <h3 className="text-base font-bold text-stone-50 truncate max-w-xl">
                              {p.title || "Без назви"}
                            </h3>
                            <p className="micro-label mt-1">{humanLocation(p)}</p>
                          </div>
                          <Badge variant="outline" className={statusBadgeClass(p.status)}>
                            {statusLabel(p.status)}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="text-stone-400 border-stone-700 bg-stone-800">
                            {CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS] || p.category || "Категорія"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`badge-status ${priorityBadgeClass(p.priority)}`}
                          >
                            Пріоритет: {priorityLabel(p.priority)}
                          </Badge>
                          {p.createdAt && (
                            <Badge variant="outline" className="text-stone-400 border-stone-700 bg-stone-800">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-stone-400 leading-relaxed mb-4">
                          {p.description || "—"}
                        </p>

                        {p.photoUrl && (
                          <div className="w-full h-44 overflow-hidden border border-stone-700 mb-4">
                            <img
                              src={resolveImageUrl(p.thumbnail || p.photoUrl)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex flex-col md:flex-row md:items-center justify-between border-t border-dashed border-stone-700 pt-4 gap-4">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] text-stone-400 font-medium">
                              ID: {p.id}
                            </span>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() =>
                                setOpenCommentsId(openCommentsId === p.id ? null : p.id)
                              }
                              className="text-blue-400 text-[10px] font-semibold hover:underline inline-flex items-center gap-1 p-0 h-auto"
                            >
                              <MessageSquare className="w-3 h-3" strokeWidth={2} />
                              Коментарі {openCommentsId === p.id ? "▲" : "▼"}
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {p.status === "pending" && (
                              <>
                                <Button
                                  size="xs"
                                  onClick={() => handleChangeStatus(p.id, "approved")}
                                  className="text-[10px] font-bold uppercase tracking-wider"
                                >
                                  Схвалити
                                </Button>
                                <Button
                                  size="xs"
                                  variant="destructive"
                                  onClick={() => handleChangeStatus(p.id, "rejected")}
                                  className="text-[10px] font-bold uppercase tracking-wider"
                                >
                                  Відхилити
                                </Button>
                              </>
                            )}
                            {p.status === "approved" && (
                              <Button
                                size="xs"
                                onClick={() => handleChangeStatus(p.id, "resolved")}
                                className="text-[10px] font-bold uppercase tracking-wider"
                              >
                                Вирішити
                              </Button>
                            )}
                            <Button
                              size="xs"
                              variant="destructive"
                              onClick={() => handleRemove(p.id)}
                              className="text-[10px] font-bold uppercase tracking-wider"
                            >
                              <Trash2 className="w-3 h-3 mr-1" strokeWidth={2} />
                              Видалити
                            </Button>
                          </div>
                        </div>

                        {openCommentsId === p.id && (
                          <div className="bg-stone-900/30 border-t border-dashed border-stone-700 mt-4 p-4">
                            <CommentSection
                              complaintId={p.id}
                              currentUserId={currentUser?.user}
                              isAdmin={true}
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="flex-1 p-5">
            <div className="grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-stone-700 shadow-none bg-stone-800">
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400" strokeWidth={2} />
                      <Input
                        placeholder="Пошук тікетів..."
                        value={ticketSearchQuery}
                        onChange={(e) => setTicketSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>

                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-3">
                      Статус тікету
                    </h4>
                    <FilterRadioGroup
                      options={ticketStatusOptions}
                      value={ticketStatus}
                      onChange={setTicketStatus}
                    />

                    <Separator className="my-4 bg-stone-700" />

                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-3">
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
                <h3 className="text-sm font-bold text-stone-50">
                  Тікети для підтверджених заявок
                </h3>
                {filteredTickets.length === 0 ? (
                  <div className="empty-state">
                    <p className="text-xs text-stone-400">Жодна заявка не відповідає фільтрам.</p>
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-2 gap-4">
                    {filteredTickets.map((p) => {
                      const ticket = tickets.find((t: any) => t.complaint === p.id);
                      return (
                        <Card key={p.id} className="border-stone-700 shadow-none bg-stone-800">
                          <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-sm font-bold text-stone-50">
                                {p.title || "Без назви"}
                              </h4>
                              <Badge
                                variant="outline"
                                className={`badge-status ${priorityBadgeClass(p.priority)}`}
                              >
                                {priorityLabel(p.priority)}
                              </Badge>
                            </div>
                            <div className="flex gap-2 mb-3 items-center">
                              <Badge variant="outline" className="text-stone-400 border-stone-700 bg-stone-800">
                                {CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS] || p.category || "Категорія"}
                              </Badge>
                              <span className="text-[10px] text-stone-400">{humanLocation(p)}</span>
                            </div>
                            <p className="text-xs text-stone-400 mb-4 line-clamp-3">{p.description}</p>

                            {ticket ? (
                              <div className="bg-blue-500/5 p-3 border border-blue-500/10 relative group/ticket">
                                <p className="text-xs font-bold text-blue-400">
                                  Тікет створено (ID: {ticket.ticket_id})
                                </p>
                                {ticket.user && (
                                  <p className="text-[10px] text-blue-400/80 mt-1">
                                    Виконавець: {ticket.user.first_name} {ticket.user.last_name}
                                  </p>
                                )}
                                {ticket.deadline && (
                                  <p className="text-[10px] text-blue-400/70 mt-1">
                                    Дедлайн: {new Date(ticket.deadline).toLocaleDateString()}
                                  </p>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => openTicketModal(p, ticket)}
                                  className="absolute top-2 right-2 text-blue-400 hover:text-blue-300 opacity-0 group-hover/ticket:opacity-100 transition-opacity"
                                >
                                  <Edit3 className="w-3.5 h-3.5" strokeWidth={2} />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                className="w-full text-[10px] font-bold uppercase tracking-wider"
                                onClick={() => openTicketModal(p)}
                              >
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

      {isTicketModalOpen && selectedForTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-stone-800 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-stone-700 shadow-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-base font-bold text-stone-50">
                {ticketToEdit ? "Редагувати тікет" : "Створити тікет"}
              </h2>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsTicketModalOpen(false)}
                className="text-stone-400 hover:text-stone-50"
              >
                <X className="w-5 h-5" strokeWidth={2} />
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
    </div>
  );
};

export default AdminComplaintsPage;
