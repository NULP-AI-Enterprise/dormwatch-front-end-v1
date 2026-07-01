import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  fetchApprovedComplaints,
  deleteProblem,
  voteComplaint,
  fetchBuildings,
} from "../services/problemsApi";
import { resolveImageUrl } from "../services/imageUtils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronUpIcon, ChevronDownIcon, Message01Icon, Cancel01Icon, SearchIcon, Delete01Icon, SearchIcon as SearchIcon2, AddIcon, Refresh01Icon } from "@hugeicons/core-free-icons";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "../components/ui/dialog";
import CommentSection from "../components/CommentSection";
import LoadingSpinner from "../components/LoadingSpinner";
import { Separator } from "../components/ui/separator";
import { statusBadgeClass, statusLabel, isAdminUser } from "../lib/complaintUtils";
import { useUser } from "../context/UserContext";
import type { Complaint } from "../lib/types";

const categories = [
  { id: "all", name: "Всі" },
  { id: "plumbing", name: "Сантехніка" },
  { id: "electricity", name: "Електрика" },
  { id: "furniture", name: "Меблі" },
  { id: "internet", name: "Інтернет" },
];

const DashboardPage = () => {
  const { user: currentUser } = useUser();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeCorps, setActiveCorps] = useState("all");
  const [activePriority, setActivePriority] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [problems, setProblems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [openCommentsId, setOpenCommentsId] = useState<number | null>(null);

  const [votedIds, setVotedIds] = useState<number[]>([]);
  const [buildings, setBuildings] = useState<Array<{building_id: number, name: string}>>([]);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchBuildings().then(setBuildings).catch(() => {});
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const complaintsData = await fetchApprovedComplaints("new", { corps: activeCorps, priority: activePriority }).catch(() => []);
        if (Array.isArray(complaintsData)) setProblems(complaintsData);
      } catch (error) {
        console.error("Critical dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeCorps, activePriority]);

  const handleDelete = async (id: number) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    try {
      await deleteProblem(deleteTarget);
      setProblems((prev) => prev.filter((p) => p.id !== deleteTarget));
    } catch {
      setErrorMessage("Помилка при видаленні");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleVote = async (id: number) => {
    if (votedIds.includes(id)) return;

    setProblems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, votesCount: p.votesCount + 1 } : p))
    );

    try {
      const res = await voteComplaint(id);
      setProblems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, votesCount: res.votesCount } : p))
      );
      setVotedIds((prev) => [...prev, id]);
    } catch {
      setVotedIds((prev) => [...prev, id]);
      setProblems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, votesCount: p.votesCount - 1 } : p))
      );
    }
  };

  const filteredProblems = problems.filter((p) => {
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const admin = isAdminUser(currentUser);

  const canManage = (problem: Complaint) =>
    admin || currentUser?.user === problem.user_id;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl bg-background/95 border-border p-0" showCloseButton={false}>
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

      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-8">
          Стрічка проблем
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <HugeiconsIcon icon={SearchIcon} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" strokeWidth={2} />
                <Input
                  placeholder="Пошук заявок..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={activeCorps} onValueChange={setActiveCorps}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Всі гуртожитки" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі гуртожитки</SelectItem>
                  {buildings.map((b) => (
                    <SelectItem key={b.building_id} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={activePriority} onValueChange={setActivePriority}>
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
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  size="xs"
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>

            <div className="bg-primary p-6 text-primary-foreground">
              <h4 className="text-xs font-semibold mb-4">
                Дії
              </h4>
              {admin ? (
                <Button
                  asChild
                  size="sm"
                  className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/80"
                >
                  <Link to="/admin">Перейти в комендант-центр</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/80"
                >
                  <Link to="/create-report"><HugeiconsIcon icon={AddIcon} className="size-4 mr-1.5" strokeWidth={2} />Створити нову заявку</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            {filteredProblems.map((problem) => {
              const hasVoted = votedIds.includes(problem.id);

              return (
                <Card
                  key={problem.id}
                  className="border-border shadow-none group relative"
                >
                  {canManage(problem) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(problem.id)}
                      className="absolute top-2 right-2 z-10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Видалити"
                    >
                      <HugeiconsIcon icon={Delete01Icon} className="size-3.5" strokeWidth={2} />
                    </Button>
                  )}

                  <div className="flex">
                    <div className="flex-shrink-0 p-5 flex flex-col items-center gap-0.5 min-w-16">
                      <Button
                        variant={hasVoted ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleVote(problem.id)}
                        disabled={hasVoted}
                        className={`flex flex-col items-center gap-0.5 p-2 ${
                          hasVoted
                            ? "cursor-default"
                            : ""
                        }`}
                      >
                        <HugeiconsIcon icon={ChevronUpIcon} className="size-4" strokeWidth={2} />
                        <span className="text-base font-bold leading-none">
                          {problem.votesCount || 0}
                        </span>
                        <span className="text-xs font-semibold">
                          {hasVoted ? "Ваш голос" : "Голос"}
                        </span>
                      </Button>
                    </div>
                    <div className="w-px bg-border" />

                    <div className="flex-1 p-5">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={statusBadgeClass(problem.status)}>
                            {statusLabel(problem.status)}
                          </Badge>
                        </div>
                        <span className="text-xs font-normal text-muted-foreground">
                          {categories.find((c) => c.id === problem.category)?.name || problem.category}<span className="w-1 h-1 bg-border inline-block mx-1" />{problem.building ? `Корпус ${problem.building}` : ""}<span className="w-1 h-1 bg-border inline-block mx-1" />{problem.placeName}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-foreground mb-2">
                        {problem.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                        {problem.description}
                      </p>

                      {problem.photoUrl && (
                        <div
                          className="w-full h-40 overflow-hidden border border-border mb-4 cursor-zoom-in"
                          onClick={() => setPreviewImage(resolveImageUrl(problem.photoUrl))}
                        >
                          <img
                            src={resolveImageUrl(problem.thumbnail || problem.photoUrl)}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            alt=""
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3">
                        <span className="text-xs font-normal text-muted-foreground">
                          Додано{" "}
                          {new Date(problem.createdAt).toLocaleDateString()}
                        </span>
                        {canManage(problem) && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() =>
                              setOpenCommentsId(openCommentsId === problem.id ? null : problem.id)
                            }
                            className="text-primary text-xs font-semibold hover:underline inline-flex items-center gap-1 p-0 h-auto"
                          >
                            <HugeiconsIcon icon={Message01Icon} className="size-3" strokeWidth={2} />
                            Коментарі {openCommentsId === problem.id ? <HugeiconsIcon icon={ChevronUpIcon} className="size-3 inline" strokeWidth={2} /> : <HugeiconsIcon icon={ChevronDownIcon} className="size-3 inline" strokeWidth={2} />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {openCommentsId === problem.id && (
                    <>
                      <Separator dashed />
                      <div className="p-4">
                      <CommentSection
                        complaintId={problem.id}
                        currentUserId={currentUser?.user}
                        isAdmin={admin}
                      />
                      </div>
                    </>
                  )}
                </Card>
              );
            })}

            {filteredProblems.length === 0 && (
              <div className="border border-dashed border-border p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 mb-4 border border-border bg-card flex items-center justify-center text-muted-foreground">
                  <HugeiconsIcon icon={SearchIcon2} className="size-5" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Немає заявок за вибраними фільтрами.
                </p>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setActiveCategory("all");
                    setActiveCorps("all");
                    setActivePriority("all");
                    setSearchQuery("");
                  }}
                >
                  <HugeiconsIcon icon={Refresh01Icon} className="size-3 mr-1" strokeWidth={2} />
                  Скинути фільтри
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити заявку?</AlertDialogTitle>
            <AlertDialogDescription>Цю дію не можна скасувати.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Видалити</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!errorMessage} onOpenChange={(open) => { if (!open) setErrorMessage(null); }}>
        <DialogContent>
          <DialogTitle>Помилка</DialogTitle>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <DialogClose asChild>
            <Button variant="outline" className="mt-2" onClick={() => setErrorMessage(null)}>OK</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardPage;
