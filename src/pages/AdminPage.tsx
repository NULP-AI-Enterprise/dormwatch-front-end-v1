import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  fetchPendingComplaints,
  fetchApprovedComplaints,
  fetchRejectedComplaints,
  fetchComplaintsByStatus,
  updateComplaintStatus,
  deleteProblem,
  fetchComments,
  postComment,
  deleteComment,
  fetchUserProfile,
  CATEGORY_LABELS,
  fetchTickets,
  createTicket,
  fetchEmployees,
  updateTicket,
} from "../services/problemsApi";
import { resolveImageUrl } from "../services/imageUtils";
import { Search, X, Send, Trash2, Edit3, Loader2, MessageSquare } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const categoryOptions = [
  { id: "all", name: "Всі" },
  { id: "plumbing", name: "Сантехніка" },
  { id: "electricity", name: "Електрика" },
  { id: "furniture", name: "Меблі" },
  { id: "internet", name: "Інтернет" },
];

const statusOptions = [
  { id: "pending", name: "Очікують розгляду" },
  { id: "approved", name: "Підтверджені" },
  { id: "rejected", name: "Відхилені" },
  { id: "resolved", name: "Вирішені" },
];

const statusBadgeClass = (status: string) => {
  if (status === "pending") return "badge-pending";
  if (status === "rejected") return "badge-urgent";
  if (status === "resolved") return "badge-resolved";
  if (status === "approved") return "badge-progress";
  return "badge-status text-muted-foreground bg-muted border-border";
};

const statusLabel = (status: string) => {
  if (status === "pending") return "Очікує";
  if (status === "rejected") return "Відхилено";
  if (status === "resolved") return "Вирішено";
  if (status === "approved") return "Підтверджено";
  return status;
};

const humanLocation = (p: any) => {
  const b = p.building ? `Корпус №${p.building}` : "Корпус ?";
  const place = p.placeName ? `${p.placeName}` : "Місце ?";
  return `${b} • ${place}`;
};

const AdminPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("requests");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState(location.state?.selectedStatus || "pending");

  const [ticketCategory, setTicketCategory] = useState("all");
  const [ticketStatus, setTicketStatus] = useState("all");

  const [items, setItems] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [approvedForTickets, setApprovedForTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [, setCurrentUser] = useState<any>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedComplaintForTicket, setSelectedComplaintForTicket] = useState<any>(null);
  const [ticketDeadline, setTicketDeadline] = useState("");
  const [employees, setEmployees] = useState<any[]>([]);
  const [ticketEmployee, setTicketEmployee] = useState("");
  const [ticketToEdit, setTicketToEdit] = useState<number | null>(null);
  const [complaintSearchQuery, setComplaintSearchQuery] = useState("");
  const [complaintCorps, setComplaintCorps] = useState("all");
  const [complaintPriority, setComplaintPriority] = useState("all");
  const [ticketSearchQuery, setTicketSearchQuery] = useState("");
  const [ticketWorker, setTicketWorker] = useState("all");
  const [ticketPriority, setTicketPriority] = useState("all");
  const [ticketDateFrom, setTicketDateFrom] = useState("");
  const [ticketDateTo, setTicketDateTo] = useState("");

  const [openCommentsId, setOpenCommentsId] = useState<number | null>(null);
  const [commentsData, setCommentsData] = useState<Record<number, any[]>>({});
  const [commentInput, setCommentInput] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await fetchUserProfile();
        if (!user) {
          navigate("/");
          return;
        }
        const isAdmin =
          user.role &&
          ["admin", "адміністратор"].includes(
            (user.role.role_name || "").toLowerCase()
          );
        if (!isAdmin) navigate("/");
      } catch {
        console.warn("Auth check failed");
      }
    };
    checkAuth();
  }, [navigate]);

  const loadItems = async () => {
    setLoading(true);
    setErr("");
    setItems([]);
    try {
      const filters = { corps: complaintCorps, priority: complaintPriority };
      let data: any[] = [];
      if (selectedStatus === "pending")
        data = await fetchPendingComplaints(filters);
      else if (selectedStatus === "approved")
        data = await fetchApprovedComplaints("new", filters);
      else if (selectedStatus === "rejected")
        data = await fetchRejectedComplaints(filters);
      else if (selectedStatus === "resolved")
        data = await fetchComplaintsByStatus("resolved", filters);
      setItems(data);
      const user = await fetchUserProfile().catch(() => null);
      setCurrentUser(user);
    } catch {
      setErr("Не вдалося завантажити заявки.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [selectedStatus, complaintCorps, complaintPriority]);

  const loadTickets = async () => {
    const filters: Record<string, string> = {};
    if (ticketWorker !== "all") filters.worker = ticketWorker;
    if (ticketPriority !== "all") filters.priority = ticketPriority;
    if (ticketDateFrom) filters.date_from = ticketDateFrom;
    if (ticketDateTo) filters.date_to = ticketDateTo;
    fetchTickets(filters).then(setTickets);
  };

  useEffect(() => {
    if (activeTab === "tickets") loadTickets();
  }, [activeTab, ticketWorker, ticketPriority, ticketDateFrom, ticketDateTo]);

  useEffect(() => {
    if (activeTab === "tickets") {
      fetchApprovedComplaints("new").then(setApprovedForTickets);
      fetchEmployees().then(setEmployees);
    }
  }, [activeTab]);

  const openTicketModal = (complaint: any) => {
    setSelectedComplaintForTicket(complaint);
    setTicketDeadline("");
    setTicketEmployee("");
    setTicketToEdit(null);
    setIsTicketModalOpen(true);
  };

  const openEditTicketModal = (complaint: any, ticket: any) => {
    setSelectedComplaintForTicket(complaint);
    setTicketDeadline(
      ticket.deadline ? ticket.deadline.split("T")[0] : ""
    );
    setTicketEmployee(ticket.user?.user || "");
    setTicketToEdit(ticket.ticket_id);
    setIsTicketModalOpen(true);
  };

  const handleConfirmCreateTicket = async () => {
    if (!selectedComplaintForTicket) return;
    try {
      if (ticketToEdit) {
        await updateTicket(
          ticketToEdit,
          ticketEmployee || "",
          ticketDeadline || null as any
        );
      } else {
        await createTicket(
          selectedComplaintForTicket.id,
          ticketEmployee || null,
          ticketDeadline || null as any
        );
      }
      const newTickets = await fetchTickets();
      setTickets(newTickets);
      setIsTicketModalOpen(false);
      setSelectedComplaintForTicket(null);
    } catch {
      alert("Помилка збереження тікета");
    }
  };

  const handleChangeStatus = async (id: number, newStatus: string) => {
    if (!confirm("Оновити статус заявки?")) return;
    try {
      await updateComplaintStatus(id, newStatus);
      loadItems();
    } catch {
      alert("Помилка при оновленні статусу");
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm("Видалити цю заявку назавжди?")) return;
    try {
      await deleteProblem(id);
      setItems((prev) => prev.filter((p) => String(p.id) !== String(id)));
    } catch {
      alert("Помилка при видаленні");
    }
  };

  const toggleComments = async (id: number) => {
    if (openCommentsId === id) {
      setOpenCommentsId(null);
    } else {
      setOpenCommentsId(id);
      if (!commentsData[id]) {
        const comms = await fetchComments(id);
        setCommentsData((prev) => ({ ...prev, [id]: comms }));
      }
    }
  };

  const handleSendComment = async (id: number) => {
    if (!commentInput.trim()) return;
    try {
      await postComment(id, commentInput);
      const realComments = await fetchComments(id);
      setCommentsData((prev) => ({ ...prev, [id]: realComments }));
      setCommentInput("");
    } catch {
      alert("Не вдалось відправити коментар");
    }
  };

  const handleDeleteComment = async (complaintId: number, commentId: number) => {
    if (!confirm("Видалити цей коментар?")) return;
    try {
      await deleteComment(commentId);
      setCommentsData((prev) => ({
        ...prev,
        [complaintId]: prev[complaintId].filter(
          (c: any) => c.id !== commentId
        ),
      }));
    } catch {
      alert("Помилка видалення коментаря");
    }
  };

  const filtered = useMemo(
    () =>
      items.filter((p) => {
        const categoryOk =
          selectedCategory === "all" ||
          String(p.category) === String(selectedCategory);
        const searchOk =
          complaintSearchQuery === "" ||
          (p.title || "")
            .toLowerCase()
            .includes(complaintSearchQuery.toLowerCase()) ||
          (p.description || "")
            .toLowerCase()
            .includes(complaintSearchQuery.toLowerCase());
        return categoryOk && searchOk;
      }),
    [items, selectedCategory, complaintSearchQuery]
  );

  const filteredTicketsList = useMemo(
    () =>
      approvedForTickets.filter((p) => {
        const categoryOk =
          ticketCategory === "all" ||
          String(p.category) === String(ticketCategory);
        const priorityOk =
          ticketPriority === "all" || p.priority === ticketPriority;
        const hasTicket = tickets.some((t: any) => t.complaint === p.id);
        const hasActiveTicketFilter =
          ticketWorker !== "all" ||
          ticketDateFrom !== "" ||
          ticketDateTo !== "";
        let statusOk = true;
        if (hasActiveTicketFilter) {
          statusOk = hasTicket;
        } else {
          statusOk =
            ticketStatus === "all"
              ? true
              : ticketStatus === "created"
              ? hasTicket
              : !hasTicket;
        }
        const searchOk =
          ticketSearchQuery === "" ||
          (p.title || "")
            .toLowerCase()
            .includes(ticketSearchQuery.toLowerCase()) ||
          (p.description || "")
            .toLowerCase()
            .includes(ticketSearchQuery.toLowerCase());
        return categoryOk && priorityOk && statusOk && searchOk;
      }),
    [
      approvedForTickets,
      tickets,
      ticketCategory,
      ticketStatus,
      ticketSearchQuery,
      ticketPriority,
      ticketWorker,
      ticketDateFrom,
      ticketDateTo,
    ]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Адміністрування
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Комендант-центр
          </p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-border mb-8">
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "requests"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Керування заявками
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "tickets"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Керування тікетами
        </button>
      </div>

      {activeTab === "requests" && (
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-border shadow-none">
              <CardContent className="p-4 pt-4">
                <div className="relative mb-4">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" strokeWidth={2} />
                  <Input
                    placeholder="Пошук заявок..."
                    value={complaintSearchQuery}
                    onChange={(e) => setComplaintSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3">
                  Статус
                </h4>
                <div className="space-y-1">
                  {statusOptions.map((s) => (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors border-l-4 ${
                        selectedStatus === s.id
                          ? "border-l-primary bg-primary/5 text-foreground"
                          : "border-l-transparent text-muted-foreground hover:border-l-primary hover:bg-primary/5 hover:text-foreground hover:translate-x-1"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={selectedStatus === s.id}
                        onChange={() => setSelectedStatus(s.id)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      <span className="text-xs font-semibold">{s.name}</span>
                    </label>
                  ))}
                </div>

                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 mt-4">
                  Категорії
                </h4>
                <div className="space-y-1">
                  {categoryOptions.map((cat) => (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors border-l-4 ${
                        selectedCategory === cat.id
                          ? "border-l-primary bg-primary/5 text-foreground"
                          : "border-l-transparent text-muted-foreground hover:border-l-primary hover:bg-primary/5 hover:text-foreground hover:translate-x-1"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={selectedCategory === cat.id}
                        onChange={() => setSelectedCategory(cat.id)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      <span className="text-xs font-semibold">{cat.name}</span>
                    </label>
                  ))}
                </div>

                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 mt-4">
                  Гуртожитки
                </h4>
                <select
                  value={complaintCorps}
                  onChange={(e) => setComplaintCorps(e.target.value)}
                  className="w-full h-8 border border-input bg-transparent px-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                >
                  <option value="all">Всі гуртожитки</option>
                  <option value="Гуртожиток 1">Гуртожиток 1</option>
                  <option value="Гуртожиток 2">Гуртожиток 2</option>
                  <option value="Гуртожиток 3">Гуртожиток 3</option>
                  <option value="Гуртожиток 4">Гуртожиток 4</option>
                  <option value="Гуртожиток 5">Гуртожиток 5</option>
                  <option value="Гуртожиток 6">Гуртожиток 6</option>
                </select>

                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 mt-4">
                  Пріоритет
                </h4>
                <select
                  value={complaintPriority}
                  onChange={(e) => setComplaintPriority(e.target.value)}
                  className="w-full h-8 border border-input bg-transparent px-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                >
                  <option value="all">Всі пріоритети</option>
                  <option value="low">Низький</option>
                  <option value="medium">Середній</option>
                  <option value="high">Високий</option>
                  <option value="critical">Критичний</option>
                </select>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" strokeWidth={2} />
              </div>
            )}
            {!loading && err && (
              <div className="border border-destructive/30 bg-destructive/10 text-destructive p-4 text-sm font-bold">
                {err}
              </div>
            )}

            {!loading && !err && filtered.length === 0 && (
              <div className="empty-state">
                <p className="text-sm font-bold text-foreground mb-1">
                  {selectedStatus === "pending"
                    ? "Черга пуста!"
                    : "Пусто"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Немає заявок з вибраними параметрами.
                </p>
              </div>
            )}

            {!loading &&
              !err &&
              filtered.map((p) => {
                const isPending = selectedStatus === "pending";
                const isApproved = selectedStatus === "approved";
                const cmts = commentsData[p.id] || [];

                return (
                  <Card
                    key={p.id}
                    className="border-border shadow-none group"
                  >
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-foreground truncate max-w-xl">
                            {p.title || "Без заголовку"}
                          </h3>
                          <p className="micro-label mt-1">
                            {humanLocation(p)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={statusBadgeClass(p.status)}
                        >
                          {statusLabel(p.status)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge
                          variant="outline"
                          className="text-muted-foreground border-border bg-muted"
                        >
                          {CATEGORY_LABELS[p.category as string as keyof typeof CATEGORY_LABELS] || p.category || "Категорія"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`badge-status ${
                            p.priority === "high"
                              ? "badge-urgent"
                              : p.priority === "low"
                              ? "badge-resolved"
                              : "badge-pending"
                          }`}
                        >
                          Пріоритет:{" "}
                          {p.priority === "high"
                            ? "Високий"
                            : p.priority === "low"
                            ? "Низький"
                            : "Середній"}
                        </Badge>
                        {p.createdAt && (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground border-border bg-muted"
                          >
                            {new Date(p.createdAt).toLocaleString()}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                        {p.description || "—"}
                      </p>

                      {p.photoUrl && (
                        <div className="w-full h-44 overflow-hidden border border-border mb-4">
                          <img
                            src={resolveImageUrl(
                              p.thumbnail || p.photoUrl
                            )}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex flex-col md:flex-row md:items-center justify-between border-t border-dashed border-border pt-4 gap-4">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] text-muted-foreground font-medium">
                            ID: {p.id}
                          </span>
                          <button
                            onClick={() => toggleComments(p.id)}
                            className="text-primary text-xs font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" strokeWidth={2} />
                            Коментарі{" "}
                            {openCommentsId === p.id ? "▲" : "▼"}
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {isPending && (
                            <>
                              <Button
                                size="xs"
                                onClick={() =>
                                  handleChangeStatus(p.id, "approved")
                                }
                                className="text-[10px] font-bold uppercase tracking-wider"
                              >
                                Підтвердити
                              </Button>
                              <Button
                                size="xs"
                                variant="destructive"
                                onClick={() =>
                                  handleChangeStatus(p.id, "rejected")
                                }
                                className="text-[10px] font-bold uppercase tracking-wider"
                              >
                                Відхилити
                              </Button>
                            </>
                          )}
                          {isApproved && (
                            <Button
                              size="xs"
                              onClick={() =>
                                handleChangeStatus(p.id, "resolved")
                              }
                              className="text-[10px] font-bold uppercase tracking-wider"
                            >
                              Вирішено
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
                        <div className="bg-muted/30 border-t border-dashed border-border mt-4 p-4">
                          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                            {cmts.length === 0 ? (
                              <p className="text-center text-xs text-muted-foreground">
                                Поки немає коментарів.
                              </p>
                            ) : (
                              cmts.map((c: any) => (
                                <div
                                  key={c.id}
                                  className="bg-card p-3 border border-border relative group/comment"
                                >
                                  <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-xs font-bold text-foreground">
                                      {c.author}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground">
                                      {new Date(
                                        c.date
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {c.text}
                                  </p>
                                  <button
                                    onClick={() =>
                                      handleDeleteComment(p.id, c.id)
                                    }
                                    className="absolute top-1 right-1 text-destructive opacity-0 group-hover/comment:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" strokeWidth={2} />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={commentInput}
                              onChange={(e) =>
                                setCommentInput(e.target.value)
                              }
                              placeholder="Відповісти..."
                              className="flex-1"
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                handleSendComment(p.id)
                              }
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSendComment(p.id)}
                            >
                              <Send
                                className="w-3 h-3 mr-1"
                                strokeWidth={2}
                              />
                              Відправити
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {activeTab === "tickets" && (
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-border shadow-none">
              <CardContent className="p-4 pt-4">
                <div className="relative mb-4">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" strokeWidth={2} />
                  <Input
                    placeholder="Пошук тікетів..."
                    value={ticketSearchQuery}
                    onChange={(e) =>
                      setTicketSearchQuery(e.target.value)
                    }
                    className="pl-8"
                  />
                </div>

                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3">
                  Наявність тікета
                </h4>
                <div className="space-y-1">
                  {[
                    { id: "all", name: "Всі" },
                    { id: "not_created", name: "Без тікета" },
                    { id: "created", name: "З тікетом" },
                  ].map((s) => (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors border-l-4 ${
                        ticketStatus === s.id
                          ? "border-l-primary bg-primary/5 text-foreground"
                          : "border-l-transparent text-muted-foreground hover:border-l-primary hover:bg-primary/5 hover:text-foreground hover:translate-x-1"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={ticketStatus === s.id}
                        onChange={() => setTicketStatus(s.id)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      <span className="text-xs font-semibold">
                        {s.name}
                      </span>
                    </label>
                  ))}
                </div>

                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 mt-4">
                  Категорії
                </h4>
                <div className="space-y-1">
                  {categoryOptions.map((cat) => (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors border-l-4 ${
                        ticketCategory === cat.id
                          ? "border-l-primary bg-primary/5 text-foreground"
                          : "border-l-transparent text-muted-foreground hover:border-l-primary hover:bg-primary/5 hover:text-foreground hover:translate-x-1"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={ticketCategory === cat.id}
                        onChange={() => setTicketCategory(cat.id)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      <span className="text-xs font-semibold">
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>

                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 mt-4">
                  Працівник
                </h4>
                <select
                  value={ticketWorker}
                  onChange={(e) => setTicketWorker(e.target.value)}
                  className="w-full h-8 border border-input bg-transparent px-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                >
                  <option value="all">Всі працівники</option>
                  {employees.map((emp: any) => (
                    <option key={emp.user} value={emp.user}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>

                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 mt-4">
                  Пріоритет
                </h4>
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value)}
                  className="w-full h-8 border border-input bg-transparent px-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                >
                  <option value="all">Всі</option>
                  <option value="low">Низький</option>
                  <option value="medium">Середній</option>
                  <option value="high">Високий</option>
                  <option value="critical">Критичний</option>
                </select>

                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 mt-4">
                  Дати дедлайну
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                      З:
                    </label>
                    <input
                      type="date"
                      value={ticketDateFrom}
                      onChange={(e) =>
                        setTicketDateFrom(e.target.value)
                      }
                      className="w-full h-8 border border-input bg-transparent px-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                      По:
                    </label>
                    <input
                      type="date"
                      value={ticketDateTo}
                      onChange={(e) =>
                        setTicketDateTo(e.target.value)
                      }
                      className="w-full h-8 border border-input bg-transparent px-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-lg font-bold text-foreground">
              Тікети для підтверджених заявок
            </h3>
            {filteredTicketsList.length === 0 ? (
              <div className="empty-state">
                <p className="text-xs text-muted-foreground">
                  Немає заявок з вибраними параметрами.
                </p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-4">
                {filteredTicketsList.map((p) => {
                  const ticket = tickets.find(
                    (t: any) => t.complaint === p.id
                  );
                  return (
                    <Card
                      key={p.id}
                      className="border-border shadow-none"
                    >
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-base font-bold text-foreground">
                            {p.title || "Без заголовку"}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`badge-status ${
                              p.priority === "high"
                                ? "badge-urgent"
                                : p.priority === "low"
                                ? "badge-resolved"
                                : "badge-pending"
                            }`}
                          >
                            {p.priority === "high"
                              ? "Високий"
                              : p.priority === "low"
                              ? "Низький"
                              : "Середній"}
                          </Badge>
                        </div>
                        <div className="flex gap-2 mb-3 items-center">
                          <Badge
                            variant="outline"
                            className="text-muted-foreground border-border bg-muted"
                          >
                            {CATEGORY_LABELS[p.category as string as keyof typeof CATEGORY_LABELS] ||
                              p.category ||
                              "Категорія"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {humanLocation(p)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4 line-clamp-3">
                          {p.description}
                        </p>

                        {ticket ? (
                          <div className="bg-primary/5 p-3 border border-primary/10 relative group/ticket">
                            <p className="text-xs font-bold text-primary">
                              Тікет створено (ID: {ticket.ticket_id})
                            </p>
                            {ticket.user && (
                              <p className="text-xs text-primary/80 mt-1">
                                Виконавець:{" "}
                                {ticket.user.first_name}{" "}
                                {ticket.user.last_name}
                              </p>
                            )}
                            {ticket.deadline && (
                              <p className="text-xs text-primary/70 mt-1">
                                Дедлайн:{" "}
                                {new Date(
                                  ticket.deadline
                                ).toLocaleDateString()}
                              </p>
                            )}
                            <button
                              onClick={() =>
                                openEditTicketModal(p, ticket)
                              }
                              className="absolute top-2 right-2 text-primary hover:text-primary/80 opacity-0 group-hover/ticket:opacity-100 transition-opacity"
                            >
                              <Edit3
                                className="w-3.5 h-3.5"
                                strokeWidth={2}
                              />
                            </button>
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
      )}

      {isTicketModalOpen && selectedComplaintForTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border shadow-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-lg font-bold text-foreground">
                {ticketToEdit ? "Редагувати тікет" : "Створити тікет"}
              </h2>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="bg-muted/30 p-4 border border-border">
                <h4 className="text-sm font-bold text-foreground">
                  {selectedComplaintForTicket.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {humanLocation(selectedComplaintForTicket)}
                </p>
                <div className="mt-2 flex gap-2">
                  <Badge
                    variant="outline"
                    className="text-muted-foreground border-border bg-muted"
                  >
                    {CATEGORY_LABELS[
                      selectedComplaintForTicket.category as keyof typeof CATEGORY_LABELS
                    ] || selectedComplaintForTicket.category}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block">
                  Виконавець
                </label>
                <select
                  value={ticketEmployee}
                  onChange={(e) => setTicketEmployee(e.target.value)}
                  className="w-full h-8 border border-input bg-transparent px-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                >
                  <option value="">-- Не призначено --</option>
                  {employees.map((emp: any) => (
                    <option key={emp.user} value={emp.user}>
                      {emp.first_name} {emp.last_name} (ID: {emp.user})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block">
                  Дедлайн виконання
                </label>
                <input
                  type="date"
                  value={ticketDeadline}
                  onChange={(e) => setTicketDeadline(e.target.value)}
                  className="w-full h-8 border border-input bg-transparent px-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 text-[10px] font-bold uppercase tracking-wider"
                  onClick={() => setIsTicketModalOpen(false)}
                >
                  Скасувати
                </Button>
                <Button
                  className="flex-1 text-[10px] font-bold uppercase tracking-wider"
                  onClick={handleConfirmCreateTicket}
                >
                  Зберегти тікет
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
