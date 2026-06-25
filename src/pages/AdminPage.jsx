import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  updateTicket
} from "../services/problemsApi";
import Preloader from "../components/Preloader";

const SERVER_URL = "http://127.0.0.1:8000";

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("requests"); // "requests" | "tickets"
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("pending");

  const [ticketCategory, setTicketCategory] = useState("all");
  const [ticketStatus, setTicketStatus] = useState("all");

  const [items, setItems] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [approvedForTickets, setApprovedForTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedComplaintForTicket, setSelectedComplaintForTicket] = useState(null);
  const [ticketDeadline, setTicketDeadline] = useState("");
  const [employees, setEmployees] = useState([]);
  const [ticketEmployee, setTicketEmployee] = useState("");
  const [ticketToEdit, setTicketToEdit] = useState(null); // stores ticket_id if editing
  const [complaintSearchQuery, setComplaintSearchQuery] = useState("");
  const [ticketSearchQuery, setTicketSearchQuery] = useState("");
  const navigate = useNavigate();

  // Перевірка авторизації
  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await fetchUserProfile();
        if (!user) {
          navigate("/");
          return;
        }
        const isAdmin = user.role && ["admin", "адміністратор"].includes((user.role.role_name || "").toLowerCase());
        if (!isAdmin) {
          navigate("/");
        }
      } catch (e) {
        console.warn(e);
      }
    }
    checkAuth();
  }, [navigate]);

  const [openCommentsId, setOpenCommentsId] = useState(null);
  const [commentsData, setCommentsData] = useState({});
  const [commentInput, setCommentInput] = useState("");

  const categoryOptions = useMemo(() => [
      { id: "all", name: "Всі" },
      { id: "plumbing", name: "Сантехніка" },
      { id: "electricity", name: "Електрика" },
      { id: "furniture", name: "Меблі" },
      { id: "internet", name: "Інтернет" },
  ], []);

  const statusOptions = useMemo(() => [
      { id: "pending", name: "Очікують розгляду" },
      { id: "approved", name: "Підтверджені" },
      { id: "rejected", name: "Відхилені" },
      { id: "resolved", name: "Вирішені" }
  ], []);

  const loadItems = async () => {
    setLoading(true);
    setErr("");
    setItems([]);
    
    try {
      let data = [];
      if (selectedStatus === "pending") data = await fetchPendingComplaints();
      else if (selectedStatus === "approved") data = await fetchApprovedComplaints("new");
      else if (selectedStatus === "rejected") data = await fetchRejectedComplaints();
      else if (selectedStatus === "resolved") data = await fetchComplaintsByStatus("resolved");
      
      setItems(data);
      
      const user = await fetchUserProfile().catch(() => null);
      setCurrentUser(user);
    } catch (e) {
      setErr("Не вдалося завантажити заявки.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, [selectedStatus]);

  useEffect(() => {
    if (activeTab === "tickets") {
      fetchTickets().then(setTickets);
      fetchApprovedComplaints("new").then(setApprovedForTickets);
      fetchEmployees().then(setEmployees);
    }
  }, [activeTab]);

  const openTicketModal = (complaint) => {
    setSelectedComplaintForTicket(complaint);
    setTicketDeadline("");
    setTicketEmployee("");
    setTicketToEdit(null);
    setIsTicketModalOpen(true);
  };

  const openEditTicketModal = (complaint, ticket) => {
    setSelectedComplaintForTicket(complaint);
    setTicketDeadline(ticket.deadline ? ticket.deadline.split("T")[0] : "");
    setTicketEmployee(ticket.user?.user || "");
    setTicketToEdit(ticket.ticket_id);
    setIsTicketModalOpen(true);
  };

  const handleConfirmCreateTicket = async () => {
    if (!selectedComplaintForTicket) return;
    try {
      if (ticketToEdit) {
        await updateTicket(ticketToEdit, ticketEmployee || "", ticketDeadline || "");
        alert("Тікет оновлено!");
      } else {
        await createTicket(selectedComplaintForTicket.id, ticketEmployee || null, ticketDeadline || null);
        alert("Тікет створено!");
      }
      const newTickets = await fetchTickets();
      setTickets(newTickets);
      setIsTicketModalOpen(false);
      setSelectedComplaintForTicket(null);
    } catch (e) {
      alert("Помилка збереження тікета");
    }
  };

  const handleChangeStatus = async (id, newStatus) => {
    const ok = confirm("Оновити статус заявки?");
    if (!ok) return;

    try {
      await updateComplaintStatus(id, newStatus);
      loadItems();
    } catch (error) {
      console.error(error);
      alert(`Помилка при оновленні статусу`);
    }
  };

  const handleRemove = async (id) => {
    const ok = confirm("Видалити цю заявку назавжди?");
    if (!ok) return;
    try {
      await deleteProblem(id);
      setItems((prev) => prev.filter((p) => String(p.id) !== String(id)));
    } catch (error) {
      alert("Помилка при видаленні");
    }
  };

  const toggleComments = async (id) => {
    if (openCommentsId === id) {
        setOpenCommentsId(null);
    } else {
        setOpenCommentsId(id);
        if (!commentsData[id]) {
            const comms = await fetchComments(id);
            setCommentsData(prev => ({ ...prev, [id]: comms }));
        }
    }
  };

  const handleSendComment = async (id) => {
    if (!commentInput.trim()) return;
    
    const tempId = Date.now();
    const newComment = { 
        id: tempId, 
        text: commentInput, 
        author: currentUser ? `${currentUser.first_name} ${currentUser.last_name}`.trim() : "Адмін", 
        date: new Date().toISOString() 
    };
    
    setCommentsData(prev => ({ ...prev, [id]: [...(prev[id] || []), newComment] }));
    setCommentInput("");

    try {
        await postComment(id, newComment.text);
        const realComments = await fetchComments(id);
        setCommentsData(prev => ({ ...prev, [id]: realComments }));
    } catch(err) {
        alert("Не вдалось відправити коментар");
    }
  };

  const handleDeleteComment = async (complaintId, commentId) => {
      if (!confirm("Видалити цей коментар?")) return;
      try {
          await deleteComment(commentId);
          setCommentsData(prev => ({
              ...prev,
              [complaintId]: prev[complaintId].filter(c => c.id !== commentId)
          }));
      } catch (e) {
          alert("Помилка видалення коментаря");
      }
  };

  const filtered = useMemo(() => {
    return items.filter((p) => {
      const categoryOk = selectedCategory === "all" ? true : String(p.category) === String(selectedCategory);
      const searchOk = complaintSearchQuery === "" || 
        (p.title || "").toLowerCase().includes(complaintSearchQuery.toLowerCase()) || 
        (p.description || "").toLowerCase().includes(complaintSearchQuery.toLowerCase());
      return categoryOk && searchOk;
    });
  }, [items, selectedCategory, complaintSearchQuery]);

  const filteredTicketsList = useMemo(() => {
    return approvedForTickets.filter((p) => {
      const categoryOk = ticketCategory === "all" ? true : String(p.category) === String(ticketCategory);
      const hasTicket = tickets.some(t => t.complaint === p.id);
      const statusOk = ticketStatus === "all" ? true : 
                       ticketStatus === "created" ? hasTicket : 
                       !hasTicket;
      const searchOk = ticketSearchQuery === "" || 
        (p.title || "").toLowerCase().includes(ticketSearchQuery.toLowerCase()) || 
        (p.description || "").toLowerCase().includes(ticketSearchQuery.toLowerCase());
      return categoryOk && statusOk && searchOk;
    });
  }, [approvedForTickets, tickets, ticketCategory, ticketStatus, ticketSearchQuery]);

  const humanLocation = (p) => {
    const b = p.building ? `Корпус №${p.building}` : "Корпус ?";
    const place = p.placeName ? `${p.placeName}` : "Місце ?";
    return `${b} • ${place}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-6 lg:mb-8 gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Адміністрування</h2>
          <p className="text-sm sm:text-base text-slate-500 mt-1">Комендант-центр</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 mb-6 sm:mb-8">
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-3 px-1 text-sm sm:text-base font-bold border-b-2 transition-colors ${
            activeTab === "requests"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          Керування заявками
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`pb-3 px-1 text-sm sm:text-base font-bold border-b-2 transition-colors ${
            activeTab === "tickets"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          Керування тікетами
        </button>
      </div>

      {activeTab === "requests" && (
        <div className="grid lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm">
              <input 
                type="text" 
                placeholder="Пошук заявок..." 
                value={complaintSearchQuery}
                onChange={e => setComplaintSearchQuery(e.target.value)}
                className="w-full px-4 py-2 mb-4 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <h4 className="text-sm sm:text-base font-bold mb-3 sm:mb-4">Статус</h4>
            <div className="space-y-2">
              {statusOptions.map((s) => (
                <label key={s.id} className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer ${selectedStatus === s.id ? "bg-indigo-50" : "hover:bg-slate-50"}`}>
                  <input type="radio" checked={selectedStatus === s.id} onChange={() => setSelectedStatus(s.id)} className="w-4 h-4 text-indigo-600" />
                  <span className={`text-xs sm:text-sm ${ selectedStatus === s.id ? "font-bold text-indigo-900" : "font-medium text-slate-600" }`}>
                    {s.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm">
            <h4 className="text-sm sm:text-base font-bold mb-3 sm:mb-4">Категорії</h4>
            <div className="space-y-2">
              {categoryOptions.map((cat) => (
                <label key={cat.id} className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer ${selectedCategory === cat.id ? "bg-indigo-50" : "hover:bg-slate-50"}`}>
                  <input type="radio" checked={selectedCategory === cat.id} onChange={() => setSelectedCategory(cat.id)} className="w-4 h-4 text-indigo-600" />
                  <span className={`text-xs sm:text-sm ${ selectedCategory === cat.id ? "font-bold text-indigo-900" : "font-medium text-slate-600" }`}>
                    {cat.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-3 sm:space-y-4">
          {loading && <Preloader />}
          {!loading && err && <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl font-bold">{err}</div>}
          
          {/* Слово Архів прибрано */}
          {!loading && !err && filtered.length === 0 && (
            <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center">
              <p className="text-slate-900 font-black text-lg mb-2">
                 {selectedStatus === 'pending' ? "Черга пуста! 😎" : "Пусто"}
              </p>
              <p className="text-slate-500 text-sm">Немає заявок з вибраними параметрами.</p>
            </div>
          )}

          {!loading && !err && filtered.map((p) => {
              const isPending = selectedStatus === 'pending';
              const isApproved = selectedStatus === 'approved';
              
              return (
                <div key={p.id} className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start hover:shadow-md transition-shadow">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                      <div className="min-w-0">
                        <h4 className="text-lg sm:text-xl font-black text-slate-900 truncate">{p.title || "Без заголовку"}</h4>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mt-1">{humanLocation(p)}</p>
                      </div>
                      
                      {/* Динамічний бейдж статусу */}
                      <span className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-black rounded-lg uppercase tracking-widest w-fit ${
                          p.status === "pending" ? "bg-amber-100 text-amber-700" :
                          p.status === "rejected" ? "bg-red-100 text-red-700" : 
                          p.status === "resolved" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {p.status === "pending" ? "Очікує" : p.status === "rejected" ? "Відхилено" : p.status === "resolved" ? "Вирішено" : "Підтверджено"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-md uppercase">
                        {CATEGORY_LABELS[p.category] || p.category || "Категорія"}
                      </span>
                      <span className={`px-2 py-1 text-[10px] font-black rounded-md uppercase ${p.priority === 'high' ? 'bg-red-100 text-red-700' : p.priority === 'low' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        Пріоритет: {p.priority === 'high' ? 'Високий' : p.priority === 'low' ? 'Низький' : 'Середній'}
                      </span>
                      {p.createdAt && <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-md uppercase">{new Date(p.createdAt).toLocaleString()}</span>}
                    </div>

                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-4">{p.description || "—"}</p>

                    {p.photoUrl && (
                      <div className="w-full h-44 sm:h-56 rounded-2xl overflow-hidden bg-slate-100 mb-4">
                        <img src={ p.photoUrl.startsWith("http") || p.photoUrl.startsWith("blob:") ? p.photoUrl : `${SERVER_URL}/api${p.photoUrl}` } alt="problem" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between border-t border-slate-50 pt-3 sm:pt-4 gap-4">
                      <div className="flex items-center gap-4">
                          <span className="text-[10px] sm:text-xs text-slate-400 font-medium">ID: {p.id}</span>
                          <button onClick={() => toggleComments(p.id)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                            💬 Коментарі {openCommentsId === p.id ? '▲' : '▼'}
                          </button>
                      </div>

                      {/* Кнопки дій Адміна */}
                      <div className="flex flex-wrap gap-2">
                        {isPending && (
                          <>
                            <button onClick={() => handleChangeStatus(p.id, 'approved')} className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold bg-indigo-600 text-white rounded-lg sm:rounded-xl hover:bg-indigo-700">Підтвердити</button>
                            <button onClick={() => handleChangeStatus(p.id, 'rejected')} className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold bg-amber-50 text-amber-600 rounded-lg sm:rounded-xl hover:bg-amber-100">Відхилити</button>
                          </>
                        )}
                        {isApproved && (
                            <button onClick={() => handleChangeStatus(p.id, 'resolved')} className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold bg-emerald-100 text-emerald-700 rounded-lg sm:rounded-xl hover:bg-emerald-200">Вирішено</button>
                        )}
                        
                        <button onClick={() => handleRemove(p.id)} className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold bg-red-50 text-red-600 rounded-lg sm:rounded-xl hover:bg-red-100 transition-colors">
                          Видалити
                        </button>
                      </div>
                    </div>

                    {/* Секція коментарів для Адміна */}
                    {openCommentsId === p.id && (
                      <div className="bg-slate-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 mt-4 w-full">
                          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                              {(commentsData[p.id] || []).length === 0 ? (
                                  <p className="text-center text-xs text-slate-400 font-medium">Поки немає коментарів.</p>
                              ) : (
                                  (commentsData[p.id] || []).map(c => (
                                      <div key={c.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 relative group">
                                          <div className="flex justify-between items-baseline mb-1">
                                              <span className="text-xs font-bold text-slate-800">{c.author}</span>
                                              <span className="text-[9px] text-slate-400 font-bold">{new Date(c.date).toLocaleDateString()}</span>
                                          </div>
                                          <p className="text-xs text-slate-600">{c.text}</p>
                                          <button onClick={() => handleDeleteComment(p.id, c.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Видалити коментар">
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                          </button>
                                      </div>
                                  ))
                              )}
                          </div>
                          <div className="flex gap-2">
                              <input value={commentInput} onChange={e => setCommentInput(e.target.value)} placeholder="Відповісти..." className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500" onKeyDown={(e) => e.key === 'Enter' && handleSendComment(p.id)} />
                              <button onClick={() => handleSendComment(p.id)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                                  Відправити
                              </button>
                          </div>
                      </div>
                    )}
                  </div>
                </div>
              );
          })}
        </div>
        </div>
      )}

      {activeTab === "tickets" && (
        <div className="grid lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm">
              <input 
                type="text" 
                placeholder="Пошук тікетів..." 
                value={ticketSearchQuery}
                onChange={e => setTicketSearchQuery(e.target.value)}
                className="w-full px-4 py-2 mb-4 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <h4 className="text-sm sm:text-base font-bold mb-3 sm:mb-4">Наявність тікета</h4>
              <div className="space-y-2">
                {[
                  { id: "all", name: "Всі" },
                  { id: "not_created", name: "Без тікета" },
                  { id: "created", name: "З тікетом" }
                ].map((s) => (
                  <label key={s.id} className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer ${ticketStatus === s.id ? "bg-indigo-50" : "hover:bg-slate-50"}`}>
                    <input type="radio" checked={ticketStatus === s.id} onChange={() => setTicketStatus(s.id)} className="w-4 h-4 text-indigo-600" />
                    <span className={`text-xs sm:text-sm ${ ticketStatus === s.id ? "font-bold text-indigo-900" : "font-medium text-slate-600" }`}>
                      {s.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm">
              <h4 className="text-sm sm:text-base font-bold mb-3 sm:mb-4">Категорії</h4>
              <div className="space-y-2">
                {categoryOptions.map((cat) => (
                  <label key={cat.id} className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer ${ticketCategory === cat.id ? "bg-indigo-50" : "hover:bg-slate-50"}`}>
                    <input type="radio" checked={ticketCategory === cat.id} onChange={() => setTicketCategory(cat.id)} className="w-4 h-4 text-indigo-600" />
                    <span className={`text-xs sm:text-sm ${ ticketCategory === cat.id ? "font-bold text-indigo-900" : "font-medium text-slate-600" }`}>
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Тікети для підтверджених заявок</h3>
            {filteredTicketsList.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center">
                <p className="text-slate-500 text-sm">Немає заявок з вибраними параметрами.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredTicketsList.map(p => {
                  const ticket = tickets.find(t => t.complaint === p.id);
                  return (
                    <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-black text-slate-900">{p.title || "Без заголовку"}</h4>
                          <span className={`px-2 py-1 text-[10px] font-black rounded-md uppercase whitespace-nowrap ${p.priority === 'high' ? 'bg-red-100 text-red-700' : p.priority === 'low' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {p.priority === 'high' ? 'Високий' : p.priority === 'low' ? 'Низький' : 'Середній'}
                          </span>
                        </div>
                        <div className="flex gap-2 mb-3 items-center">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-md uppercase">
                            {CATEGORY_LABELS[p.category] || p.category || "Категорія"}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{humanLocation(p)}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-4 line-clamp-3">{p.description}</p>
                      </div>
                      <div>
                        {ticket ? (
                          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 relative group">
                            <p className="text-xs font-bold text-indigo-900">Тікет створено (ID: {ticket.ticket_id})</p>
                            {ticket.user && <p className="text-xs text-indigo-800 mt-1">Виконавець: {ticket.user.first_name} {ticket.user.last_name}</p>}
                            {ticket.deadline && <p className="text-xs text-indigo-700 mt-1">Дедлайн: {new Date(ticket.deadline).toLocaleDateString()}</p>}
                            <button 
                              onClick={() => openEditTicketModal(p, ticket)} 
                              className="absolute top-3 right-3 text-indigo-600 hover:text-indigo-800 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Редагувати тікет"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => openTicketModal(p)}
                            className="w-full px-4 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors"
                          >
                            Створити тікет
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for creating ticket */}
      {isTicketModalOpen && selectedComplaintForTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-black text-slate-900">Створити тікет</h2>
              <button onClick={() => setIsTicketModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Complaint info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-900">{selectedComplaintForTicket.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{humanLocation(selectedComplaintForTicket)}</p>
                <div className="mt-2 flex gap-2">
                  <span className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] font-black rounded-md uppercase">
                    {CATEGORY_LABELS[selectedComplaintForTicket.category] || selectedComplaintForTicket.category}
                  </span>
                  <span className={`px-2 py-1 text-[10px] font-black rounded-md uppercase ${selectedComplaintForTicket.priority === 'high' ? 'bg-red-100 text-red-700' : selectedComplaintForTicket.priority === 'low' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    Пріоритет: {selectedComplaintForTicket.priority === 'high' ? 'Високий' : selectedComplaintForTicket.priority === 'low' ? 'Низький' : 'Середній'}
                  </span>
                </div>
                {selectedComplaintForTicket.photoUrl && (
                  <div className="mt-4 w-full h-40 rounded-lg overflow-hidden bg-slate-200">
                    <img src={selectedComplaintForTicket.photoUrl.startsWith("http") || selectedComplaintForTicket.photoUrl.startsWith("blob:") ? selectedComplaintForTicket.photoUrl : `${SERVER_URL}/api${selectedComplaintForTicket.photoUrl}`} alt="problem" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Form fields */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Виконавець</label>
                <select
                  value={ticketEmployee}
                  onChange={(e) => setTicketEmployee(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                >
                  <option value="">-- Не призначено --</option>
                  {employees.map(emp => (
                    <option key={emp.user} value={emp.user}>
                      {emp.first_name} {emp.last_name} (ID: {emp.user})
                    </option>
                  ))}
                </select>

                <label className="block text-sm font-bold text-slate-700 mb-2">Дедлайн виконання</label>
                <input 
                  type="date" 
                  value={ticketDeadline}
                  onChange={(e) => setTicketDeadline(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsTicketModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200">
                  Скасувати
                </button>
                <button onClick={handleConfirmCreateTicket} className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">
                  Зберегти тікет
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;