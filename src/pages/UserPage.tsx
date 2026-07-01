import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMyProblems,
  deleteProblem,
  CATEGORY_LABELS,
} from "../services/problemsApi";
import { resolveImageUrl } from "../services/imageUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { TicketCard } from "../components/TicketCard";
import CommunityBoard from "../components/CommunityBoard";
import CommentSection from "../components/CommentSection";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import LoadingSpinner from "../components/LoadingSpinner";
import { Separator } from "../components/ui/separator";
import { statusBadgeClass, statusLabel, isAdminUser } from "../lib/complaintUtils";
import { useUser } from "../context/UserContext";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  MessageSquare,
  MapPin,
} from "lucide-react";

const UserPage = () => {
  const { user: currentUser } = useUser();
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openCommentsId, setOpenCommentsId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchMyProblems();
        if (!alive) return;
        setProblems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to fetch user data", e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    loadData();
    return () => { alive = false; };
  }, []);

  const onDelete = async (id: number) => {
    try {
      await deleteProblem(id);
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // silently fail
    }
  };

  const firstName = currentUser?.first_name || "User";
  const building = currentUser?.building || "";
  const room = currentUser?.room || "";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" className="border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList variant="line" className="mb-8">
            <TabsTrigger value="dashboard" className="text-xs font-bold">
              Панель
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs font-bold">
              Мої заявки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-stone-50 tracking-tight">Hello, {firstName}!</h1>
                  <p className="text-stone-400 mt-1 flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
                    {building} &bull; Room {room}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-stone-800 border border-stone-700 p-4">
                    <p className="text-2xl font-bold text-stone-50">{problems.length}</p>
                    <p className="text-xs text-stone-400 font-semibold mt-1">Всього заявок</p>
                  </div>
                  <div className="bg-stone-800 border border-stone-700 p-4">
                    <p className="text-2xl font-bold text-green-400">
                      {problems.filter((p) => p.status === "resolved").length}
                    </p>
                    <p className="text-xs text-stone-400 font-semibold mt-1">Вирішено</p>
                  </div>
                  <div className="bg-stone-800 border border-stone-700 p-4">
                    <p className="text-2xl font-bold text-yellow-400">
                      {problems.filter((p) => p.status !== "resolved").length}
                    </p>
                    <p className="text-xs text-stone-400 font-semibold mt-1">Активні</p>
                  </div>
                </div>

                <Link
                  to="/create-report"
                  className="block w-full bg-primary p-4 text-center text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  + Створити заявку
                </Link>
              </div>

              <div className="md:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-stone-50">Активні заявки</h2>
                  <Link to="/dashboard" className="text-sm font-semibold text-primary hover:underline">
                    Історія
                  </Link>
                </div>
                <div className="space-y-3">
                  {problems.length === 0 ? (
                    <div className="border border-dashed border-border p-8 text-center">
                      <p className="text-xs text-stone-400 mb-3">Немає активних заявок.</p>
                      <Link
                        to="/create-report"
                        className="inline-flex items-center px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
                      >
                        Створити першу заявку
                      </Link>
                    </div>
                  ) : (
                    problems.slice(0, 5).map((p) => (
                      <TicketCard
                        key={p.id}
                        id={p.id}
                        title={p.title}
                        description={p.description}
                        category={p.category}
                        date={new Date(p.createdAt).toLocaleDateString()}
                        status={p.status}
                        categoryLabel={CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS]}
                      />
                    ))
                  )}
                </div>

                <CommunityBoard />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-4">
              {problems.length === 0 && (
                <div className="border border-dashed border-border p-8 text-center">
                  <p className="text-sm font-bold text-stone-50 mb-1">Ще немає звернень</p>
                </div>
              )}

              {problems.map((p) => (
                <Card key={p.id} className="border-stone-700 shadow-none bg-stone-800">
                  <div className="flex">
                    <div className="flex-shrink-0 p-5 flex flex-col items-center gap-0.5 min-w-16">
                      <span className="text-base font-bold text-stone-50 leading-none">
                        {p.votesCount || 0}
                      </span>
                      <span className="text-xs font-semibold text-stone-400">
                        голосів
                      </span>
                    </div>
                    <div className="w-px bg-stone-700" />
                    <div className="flex-1 p-5">
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={statusBadgeClass(p.status)}>
                            {statusLabel(p.status)}
                          </Badge>
                        </div>
                        <span className="text-xs font-normal text-muted-foreground shrink-0">
                          {CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS] || p.category || "Other"} &middot; {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-stone-50 mb-2">
                        {p.title || "Complaint"}
                      </h3>
                      <p className="text-xs text-stone-400 leading-relaxed mb-4">
                        {p.description || "\u2014"}
                      </p>

                      {p.photoUrl && (
                        <div className="w-full h-48 overflow-hidden border border-stone-700 mb-4">
                          <img
                            src={resolveImageUrl(p.thumbnail || p.photoUrl)}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-semibold text-stone-50">
                            {typeof p.votesCount === "number"
                              ? `${p.votesCount} голосів`
                              : "0 голосів"}
                          </span>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() =>
                              setOpenCommentsId(openCommentsId === p.id ? null : p.id)
                            }
                            className="text-blue-400 text-xs font-semibold hover:underline inline-flex items-center gap-1 p-0 h-auto"
                          >
                            <MessageSquare className="w-3 h-3" strokeWidth={2} />
                            Коментарі {openCommentsId === p.id ? <ChevronUp className="w-3 h-3 inline" strokeWidth={2} /> : <ChevronDown className="w-3 h-3 inline" strokeWidth={2} />}
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDelete(p.id)}
                          className="text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {openCommentsId === p.id && (
                    <div className="bg-stone-900/30 p-4">
                      <CommentSection
                        complaintId={p.id}
                        currentUserId={currentUser?.user}
                        isAdmin={isAdminUser(currentUser)}
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default UserPage;
