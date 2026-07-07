import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  fetchMyProblems,
  deleteProblem,
  fetchCategories,
} from "../services/problemsApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { TicketCard } from "../components/TicketCard";
import ComplaintCard from "../components/ComplaintCard";
import CommunityBoard from "../components/CommunityBoard";
import CommentSection from "../components/CommentSection";
import ComplaintSidePanel from "../components/ComplaintSidePanel";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import LoadingSpinner from "../components/LoadingSpinner";
import { isAdminUser } from "../lib/complaintUtils";
import { useUser } from "../context/UserContext";
import type { Complaint } from "../lib/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MapPinIcon,
  InboxIcon,
  File01Icon,
  AddIcon,
  SearchIcon,
} from "@hugeicons/core-free-icons";

const UserPage = () => {
  const { user: currentUser } = useUser();
  const [problems, setProblems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const [openCommentsId, setOpenCommentsId] = useState<number | null>(null);

  const [selectedProblem, setSelectedProblem] = useState<Complaint | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [categories, setCategories] = useState<Array<{ category_id: number; name: string }>>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterSearch, setFilterSearch] = useState("");

  const fetchProblems = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchMyProblems();
      setProblems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch user data", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  const filteredProblems = problems.filter((p) => {
    const matchesSearch = !filterSearch ||
      (p.title || "").toLowerCase().includes(filterSearch.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(filterSearch.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    const matchesPriority = filterPriority === "all" || p.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const selectedProblemRef = useRef(selectedProblem);
  selectedProblemRef.current = selectedProblem;

  useEffect(() => {
    const handler = async () => {
      const data = await fetchMyProblems();
      const fresh = Array.isArray(data) ? data : [];
      setProblems(fresh);
      const current = selectedProblemRef.current;
      if (current) {
        const updated = fresh.find((c) => c.id === current.id);
        if (updated) setSelectedProblem(updated);
      }
    };
    window.addEventListener("complaintUpdated", handler);
    return () => window.removeEventListener("complaintUpdated", handler);
  }, []);

  const onDelete = async (id: number) => {
    try {
      await deleteProblem(id);
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.warn('Failed to delete problem', err);
    }
  };

  const firstName = currentUser?.first_name || "User";
  const building = currentUser?.building || "";
  const room = currentUser?.room || "";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <><div className="max-w-5xl mx-auto px-4 py-10">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList variant="line" className="mb-8">
            <TabsTrigger value="dashboard" className="text-xs font-semibold">
              Панель
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs font-semibold">
              Мої заявки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">Вітаємо, {firstName}!</h1>
                  <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                    <HugeiconsIcon icon={MapPinIcon} className="size-4 text-muted-foreground" strokeWidth={1.5} />
                    {building}<span className="w-1 h-1 bg-border inline-block mx-1.5" />Кімната {room}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-card border border-border p-5">
                    <p className="text-2xl font-bold text-foreground">{problems.length}</p>
                    <p className="text-xs text-muted-foreground font-semibold mt-1">Всього заявок</p>
                  </div>
                  <div className="bg-card border border-border p-5">
                    <p className="text-2xl font-bold text-green-400">
                      {problems.filter((p) => p.status === "resolved").length}
                    </p>
                    <p className="text-xs text-muted-foreground font-semibold mt-1">Вирішено</p>
                  </div>
                  <div className="bg-card border border-border p-5">
                    <p className="text-2xl font-bold text-yellow-400">
                      {problems.filter((p) => p.status !== "resolved").length}
                    </p>
                    <p className="text-xs text-muted-foreground font-semibold mt-1">Активні</p>
                  </div>
                </div>

                <Button asChild className="w-full">
                  <Link to="/create-report">
                    <HugeiconsIcon icon={AddIcon} className="size-4 mr-2" strokeWidth={2} />
                    Створити заявку
                  </Link>
                </Button>
              </div>

              <div className="md:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Активні заявки</h2>
                  <Link to="/dashboard" className="text-sm font-semibold text-primary hover:underline">
                    Історія
                  </Link>
                </div>
                <div className="space-y-3">
                  {problems.length === 0 ? (
                    <div className="border border-dashed border-border p-8 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 mb-4 border border-border bg-card flex items-center justify-center text-muted-foreground">
                        <HugeiconsIcon icon={InboxIcon} className="size-5" strokeWidth={1.5} />
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Немає активних заявок.</p>
                      <Button asChild size="xs">
                        <Link to="/create-report"><HugeiconsIcon icon={AddIcon} className="size-4 mr-1.5" strokeWidth={2} />Створити першу заявку</Link>
                      </Button>
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
                        categoryLabel={p.category}
                      />
                    ))
                  )}
                </div>

                <CommunityBoard />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-border shadow-none bg-card">
                  <CardContent className="p-4 space-y-4">
                    <div className="relative">
                      <HugeiconsIcon icon={SearchIcon} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" strokeWidth={2} />
                      <Input
                        placeholder="Пошук заявок..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue placeholder="Статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Всі</SelectItem>
                        <SelectItem value="pending">Очікує</SelectItem>
                        <SelectItem value="approved">Активно</SelectItem>
                        <SelectItem value="rejected">Відхилено</SelectItem>
                        <SelectItem value="resolved">Вирішено</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue placeholder="Всі пріоритети" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Всі пріоритети</SelectItem>
                        <SelectItem value="low">Низький</SelectItem>
                        <SelectItem value="medium">Середній</SelectItem>
                        <SelectItem value="high">Високий</SelectItem>
                        <SelectItem value="critical">Критичний</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={filterCategory === "all" ? "default" : "outline"}
                        size="xs"
                        onClick={() => setFilterCategory("all")}
                      >
                        Всі
                      </Button>
                      {categories.map((cat) => (
                        <Button
                          key={cat.category_id}
                          variant={filterCategory === cat.name ? "default" : "outline"}
                          size="xs"
                          onClick={() => setFilterCategory(filterCategory === cat.name ? "all" : cat.name)}
                        >
                          {cat.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3 space-y-4">
              {problems.length === 0 && (
                <div className="border border-dashed border-border p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 mb-4 border border-border bg-card flex items-center justify-center text-muted-foreground">
                    <HugeiconsIcon icon={File01Icon} className="size-5" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-bold text-foreground mb-1">Ще немає звернень</p>
                </div>
              )}

              {problems.length > 0 && filteredProblems.length === 0 && (
                <div className="border border-dashed border-border p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 mb-4 border border-border bg-card flex items-center justify-center text-muted-foreground">
                    <HugeiconsIcon icon={InboxIcon} className="size-5" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs text-muted-foreground">Немає заявок за вибраними фільтрами.</p>
                </div>
              )}

              {filteredProblems.map((p) => (
                <ComplaintCard
                  key={p.id}
                  complaint={p}
                  bodyPadding="p-5"
                  titleClass="text-sm font-semibold"
                  metaVariant="date"
                  descriptionFallback={"\u2014"}
                  onTitleClick={() => { setSelectedProblem(p); setSheetOpen(true); }}
                  showPhoto
                  photoHeight="h-48"
                  footerClassName="flex items-center justify-between pt-4"
                  commentsMode="inline"
                  commentsSide="left"
                  commentsOpen={openCommentsId === p.id}
                  onCommentToggle={() =>
                    setOpenCommentsId(openCommentsId === p.id ? null : p.id)
                  }
                  commentsContent={
                    <CommentSection
                      complaintId={p.id}
                      currentUserId={currentUser?.user}
                      isAdmin={isAdminUser(currentUser)}
                      complaintAuthorId={p.user_id}
                    />
                  }
                  showDelete
                  onDelete={onDelete}
                />
              ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

        {selectedProblem && (
          <ComplaintSidePanel
            complaint={selectedProblem}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            onStatusChange={() => {
              fetchProblems();
            }}
            currentUserId={currentUser?.user}
            isAdmin={isAdminUser(currentUser)}
          />
        )}
    </>
  );
};

export default UserPage;
