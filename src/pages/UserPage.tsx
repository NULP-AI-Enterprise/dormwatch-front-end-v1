import { useEffect, useState } from "react";
import {
  fetchMyProblems,
  deleteProblem,
  fetchComments,
  deleteComment,
  fetchUserProfile,
  CATEGORY_LABELS,
} from "../services/problemsApi";
import { resolveImageUrl } from "../services/imageUtils";
import { Trash2, MessageSquare, X } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

const statusBadge = (status: string) => {
  const s = String(status || "new").toLowerCase();
  if (s === "urgent" || s === "rejected") return "badge-urgent";
  if (s === "pending") return "badge-pending";
  if (s === "resolved") return "badge-resolved";
  if (s === "approved") return "badge-progress";
  return "badge-status text-muted-foreground bg-muted border-border";
};

const statusText = (status: string) => {
  const s = String(status || "new").toLowerCase();
  if (s === "pending") return "Очікує";
  if (s === "approved") return "Активно";
  if (s === "rejected") return "Відхилено";
  if (s === "resolved") return "Вирішено";
  return status;
};

const UserPage = () => {
  const [activeTab, setActiveTab] = useState<"new" | "popular">("new");
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [openCommentsId, setOpenCommentsId] = useState<number | null>(null);
  const [commentsData, setCommentsData] = useState<Record<number, any[]>>({});

  useEffect(() => {
    let alive = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [data, user] = await Promise.all([
          fetchMyProblems(),
          fetchUserProfile().catch(() => null),
        ]);
        if (!alive) return;
        setProblems(Array.isArray(data) ? data : []);
        setCurrentUser(user);
      } catch (e) {
        console.error("Failed to fetch user problems", e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    loadData();
    return () => {
      alive = false;
    };
  }, []);

  const onDelete = async (id: number) => {
    if (!confirm("Видалити звернення?")) return;
    try {
      await deleteProblem(id);
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Не вдалось видалити");
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

  const handleDeleteComment = async (complaintId: number, commentId: number) => {
    if (!confirm("Видалити цей коментар?")) return;
    try {
      await deleteComment(commentId);
      setCommentsData((prev) => ({
        ...prev,
        [complaintId]: prev[complaintId].filter((c: any) => c.id !== commentId),
      }));
    } catch {
      alert("Помилка видалення коментаря");
    }
  };

  const visible = problems.slice().sort((a, b) => {
    if (activeTab === "popular") {
      return (b.votesCount || 0) - (a.votesCount || 0);
    }
    return (
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Мої звернення
        </h1>
        <div className="flex p-0.5 border border-border">
          <button
            onClick={() => setActiveTab("new")}
            className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "new"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Усі
          </button>
          <button
            onClick={() => setActiveTab("popular")}
            className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "popular"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Популярні
          </button>
        </div>
      </div>

      {visible.length === 0 && (
        <div className="empty-state">
          <p className="text-sm font-bold text-foreground mb-1">
            Немає звернень
          </p>
        </div>
      )}

      <div className="space-y-4">
        {visible.map((p) => {
          const cmts = commentsData[p.id] || [];
          return (
            <Card key={p.id} className="border-border shadow-none">
              <div className="flex">
                <div className="flex-shrink-0 p-5 border-r border-dashed border-border flex flex-col items-center gap-0.5 min-w-[72px]">
                  <span className="text-base font-bold text-foreground leading-none">
                    {p.votesCount || 0}
                  </span>
                  <span className="text-[8px] font-semibold uppercase text-muted-foreground">
                    голосів
                  </span>
                </div>
                <div className="flex-1 p-5">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={statusBadge(p.status)}>
                        {statusText(p.status)}
                      </Badge>
                      <Badge variant="outline" className="text-muted-foreground border-border bg-muted">
                        {CATEGORY_LABELS[p.category as string as keyof typeof CATEGORY_LABELS] || p.category || "Інше"}
                      </Badge>
                    </div>
                    <span className="micro-label shrink-0">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {p.title || "Звернення"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {p.description || "—"}
                  </p>

                  {p.photoUrl && (
                    <div className="w-full h-48 overflow-hidden border border-border mb-4">
                      <img
                        src={resolveImageUrl(p.thumbnail || p.photoUrl)}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-dashed border-border">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-semibold text-foreground">
                        {typeof p.votesCount === "number"
                          ? `${p.votesCount} голосів`
                          : "0 голосів"}
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
                    <button
                      onClick={() => onDelete(p.id)}
                      className="p-1.5 text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>

              {openCommentsId === p.id && (
                <div className="bg-muted/30 border-t border-dashed border-border p-4">
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {cmts.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground font-medium">
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
                              {new Date(c.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {c.text}
                          </p>
                          {(currentUser?.user === c.author_id ||
                            currentUser?.is_admin) && (
                            <button
                              onClick={() => handleDeleteComment(p.id, c.id)}
                              className="absolute top-1 right-1 text-destructive opacity-0 group-hover/comment:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" strokeWidth={2} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default UserPage;
