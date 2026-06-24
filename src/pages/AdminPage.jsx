import { useEffect, useMemo, useState } from "react";
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
  CATEGORY_LABELS 
} from "../services/problemsApi";
import Preloader from "../components/Preloader";

const SERVER_URL = "http://127.0.0.1:8000";

const AdminPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("pending");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

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
      return categoryOk;
    });
  }, [items, selectedCategory]);

  const humanLocation = (p) => {
    const b = p.building ? `Корпус №${p.building}` : "Корпус ?";
    const place = p.placeName ? `${p.placeName}` : "Місце ?";
    return `${b} • ${place}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 lg:mb-10 gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Адміністрування</h2>
          <p className="text-sm sm:text-base text-slate-500 mt-1">Керування заявками</p>
        </div>


      </div>

      <div className="grid lg:grid-cols-4 gap-6 sm:gap-8">
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm">
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

                    <div className="flex gap-2 mb-3">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-md uppercase">
                        {CATEGORY_LABELS[p.category] || p.category || "Категорія"}
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
    </div>
  );
};

export default AdminPage;