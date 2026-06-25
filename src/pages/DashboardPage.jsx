import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  fetchApprovedComplaints, 
  fetchUserProfile, 
  deleteProblem,
  voteComplaint,    
  fetchComments,    
  postComment,
  deleteComment
} from "../services/problemsApi"; 
import Preloader from "../components/Preloader";

const SERVER_URL = "http://127.0.0.1:8000";

const PhotoModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out" onClick={onClose}>
          <img src={src} className="max-w-full max-h-[90vh] rounded-xl shadow-2xl" alt="Full size" />
          <button className="absolute top-5 right-5 text-white text-4xl font-bold">&times;</button>
      </div>
  );
};

const DashboardPage = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [openCommentsId, setOpenCommentsId] = useState(null);
  const [commentsData, setCommentsData] = useState({});
  const [commentInput, setCommentInput] = useState("");
  

  const [votedIds, setVotedIds] = useState([]);

  const categories = [
    { id: "all", name: "Всі", emoji: "" },
    { id: "plumbing", name: "Сантехніка", emoji: "🚿" },
    { id: "electricity", name: "Електрика", emoji: "💡" },
    { id: "furniture", name: "Меблі", emoji: "🪑" },
    { id: "internet", name: "Інтернет", emoji: "🌐" },
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [complaintsData, userData] = await Promise.all([
            fetchApprovedComplaints("new").catch(() => []),
            fetchUserProfile().catch(() => null)
        ]);
        if (Array.isArray(complaintsData)) setProblems(complaintsData);
        setCurrentUser(userData);
      } catch (error) {
        console.error("Critical dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault(); 
    if (!window.confirm("Ви впевнені, що хочете видалити цю заявку?")) return;
    try {
        await deleteProblem(id);
        setProblems(prev => prev.filter(p => p.id !== id));
    } catch (error) {
        alert("Помилка при видаленні");
    }
  };

  const handleVote = async (id, e) => {
    e.preventDefault(); e.stopPropagation();
    
    if (votedIds.includes(id)) return;

    // Тимчасово +1
    setProblems(prev => prev.map(p => 
        p.id === id ? { ...p, votesCount: p.votesCount + 1 } : p
    ));

    try {
        const res = await voteComplaint(id);
        setProblems(prev => prev.map(p => 
            p.id === id ? { ...p, votesCount: res.votesCount } : p
        ));
        setVotedIds(prev => [...prev, id]); // Блокуємо успішний голос
    } catch (error) {
        // Якщо сервер повернув 400 (вже голосував)
        setVotedIds(prev => [...prev, id]); // Просто блокуємо кнопку
        // Відкочуємо лічильник назад
        setProblems(prev => prev.map(p => 
            p.id === id ? { ...p, votesCount: p.votesCount - 1 } : p
        ));
    }
  };

  const toggleComments = async (id, e) => {
    e.preventDefault(); e.stopPropagation();
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

  const handleSendComment = async (id, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!commentInput.trim()) return;
    
    try {
        const newCommentData = await postComment(id, commentInput);
        setCommentsData(prev => ({ ...prev, [id]: [...(prev[id] || []), newCommentData] }));
        setCommentInput("");
    } catch(err) {
        alert("Не вдалось відправити коментар");
    }
  };

  const handleDeleteComment = async (complaintId, commentId, e) => {
      e.preventDefault(); e.stopPropagation();
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

  const filteredProblems = problems.filter(p => {
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    const matchesSearch = searchQuery === "" || 
      (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch(status) {
        case 'urgent': return "bg-red-100 text-red-700";
        case 'resolved': return "bg-emerald-100 text-emerald-700";
        case 'approved': return "bg-blue-100 text-blue-700"; 
        default: return "bg-amber-100 text-amber-700"; 
    }
  };

  const isAdmin = currentUser?.role && ["admin", "адміністратор"].includes((currentUser.role.role_name || "").toLowerCase());

  if (loading) return <Preloader />;

  return (
    <>
    {previewImage && <PhotoModal src={previewImage} onClose={() => setPreviewImage(null)} />}

    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Стрічка проблем
          </h1>
        </div>

        <div className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Пошук заявок..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
          />
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 border rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
                  activeCategory === category.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                {category.emoji && `${category.emoji} `}{category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {filteredProblems.map((problem) => {
            const hasVoted = votedIds.includes(problem.id);
            
            return (
              <div
                key={problem.id}
                className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow relative group"
              >
                {currentUser && (isAdmin || currentUser.user === problem.user_id) && (
                    <button 
                      onClick={(e) => handleDelete(problem.id, e)}
                      className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur text-red-500 rounded-full hover:bg-red-100 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                      title="Видалити"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                )}

                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <button 
                      onClick={(e) => handleVote(problem.id, e)}
                      disabled={hasVoted}
                      className={`flex-shrink-0 flex flex-row sm:flex-col items-center sm:items-center gap-2 sm:gap-1 p-2 sm:p-3 rounded-xl sm:rounded-2xl border h-fit w-fit sm:w-auto transition-all ${
                        hasVoted 
                            ? "bg-indigo-600 text-white border-indigo-600 cursor-default shadow-md"
                            : "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white cursor-pointer group" 
                      }`}
                    >
                      <span className={`text-base sm:text-lg font-black leading-none ${!hasVoted && "group-hover:scale-110 transition-transform"}`}>
                        {problem.votesCount || 0}
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-tighter opacity-80 hidden sm:block">
                        {hasVoted ? "Ваш голос" : "Голосувати"}
                      </span>
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4 gap-2">
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${getStatusColor(problem.status)}`}>
                            {problem.status === 'resolved' ? 'Вирішено' : 'Активно'}
                          </span>
                          <span className="px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                            {categories.find(c => c.id === problem.category)?.name || problem.category}
                          </span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">
                          Корпус {problem.building} • {problem.placeName}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">
                        {problem.title}
                      </h3>
                      <p className="text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed">
                        {problem.description}
                      </p>

                      {problem.photoUrl && (
                        <div 
                          className="w-full h-40 sm:h-48 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 mb-4 sm:mb-6 cursor-zoom-in group-hover:shadow-md transition-shadow"
                          onClick={() => setPreviewImage(
                              problem.photoUrl.startsWith("blob:") || problem.photoUrl.startsWith("http")
                              ? problem.photoUrl
                              : `${SERVER_URL}/api${problem.photoUrl}`
                          )}
                        >
                          <img src={problem.photoUrl.startsWith("blob:") || problem.photoUrl.startsWith("http") ? problem.photoUrl : `${SERVER_URL}/api${problem.photoUrl}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.style.display = 'none'; }} />
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-slate-50 gap-2">
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">
                          Додано {new Date(problem.createdAt).toLocaleDateString()}
                        </span>
                        
                        {currentUser && (isAdmin || currentUser.user === problem.user_id) && (
                          <button onClick={(e) => toggleComments(problem.id, e)} className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                            💬 Коментарі {openCommentsId === problem.id ? '▲' : '▼'}
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                </div>

                {openCommentsId === problem.id && currentUser && (isAdmin || currentUser.user === problem.user_id) && (
                  <div className="bg-slate-50 p-4 sm:p-6 border-t border-slate-100 animate-in slide-in-from-top-2">
                      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {(commentsData[problem.id] || []).length === 0 ? (
                              <p className="text-center text-xs text-slate-400 font-medium">Поки немає коментарів. Будьте першим!</p>
                          ) : (
                              (commentsData[problem.id] || []).map(c => (
                                  <div key={c.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 relative group">
                                      <div className="flex justify-between items-baseline mb-1">
                                          <span className="text-xs font-bold text-slate-800">{c.author}</span>
                                          <span className="text-[9px] text-slate-400 font-bold">{new Date(c.date).toLocaleDateString()}</span>
                                      </div>
                                      <p className="text-xs text-slate-600">{c.text}</p>
                                      
                                      {/* ПЕРЕВІРКА АВТОРА КОМЕНТАРЯ ЧЕРЕЗ ID */}
                                      {(currentUser?.user === c.author_id || isAdmin) && (
                                          <button 
                                              onClick={(e) => handleDeleteComment(problem.id, c.id, e)}
                                              className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                              title="Видалити"
                                          >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                          </button>
                                      )}
                                  </div>
                              ))
                          )}
                      </div>
                      <div className="flex gap-2">
                          <input 
                              value={commentInput} 
                              onChange={e => setCommentInput(e.target.value)} 
                              placeholder="Написати коментар..." 
                              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              onKeyDown={(e) => e.key === 'Enter' && handleSendComment(problem.id, e)} 
                          />
                          <button 
                              onClick={(e) => handleSendComment(problem.id, e)} 
                              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                          >
                              Відправити
                          </button>
                      </div>
                  </div>
                )}

              </div>
            );
          })}

          {filteredProblems.length === 0 && (
             <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
                Заявок поки немає.
             </div>
          )}
        </div>
        
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
             <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 shadow-sm sticky top-24">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="block w-full py-3 sm:py-4 bg-indigo-600 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold hover:bg-indigo-700 transition-all text-center shadow-lg shadow-indigo-200"
                  >
                    Перейти в комендант-центр
                  </Link>
                ) : (
                  <Link
                    to="/create-report"
                    className="block w-full py-3 sm:py-4 bg-slate-900 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold hover:bg-slate-800 transition-all text-center shadow-lg shadow-slate-200"
                  >
                    Створити нову заявку
                  </Link>
                )}
             </div>
        </div>
      </div>
    </main>
    </>
  );
};

export default DashboardPage;