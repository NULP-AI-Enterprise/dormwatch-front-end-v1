import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  fetchApprovedComplaints,
  deleteProblem,
  fetchCategories,
} from "@/services/problemsApi";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, SearchIcon as SearchIcon2, AddIcon, Refresh01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  FilterSearchInput,
  BuildingFilterSelect,
  PriorityFilterSelect,
  CategoryFilterButtons,
} from "@/components/ComplaintFilters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import CommentSection from "@/components/CommentSection";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import ComplaintCard from "@/components/ComplaintCard";
import PageSpinner from "@/components/PageSpinner";
import EmptyState from "@/components/EmptyState";
import { isAdminUser } from "@/lib/complaintUtils";
import { useBuildings } from "@/hooks/useBuildings";
import { useCommentToggle } from "@/hooks/useCommentToggle";
import { useUser } from "@/context/UserContext";
import type { Complaint, CategoryOption } from "@/lib/types";

const DashboardPage = () => {
  const { user: currentUser } = useUser();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeCorps, setActiveCorps] = useState("all");
  const [activePriority, setActivePriority] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [problems, setProblems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const comments = useCommentToggle();

  const buildings = useBuildings();
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedProblem, setSelectedProblem] = useState<Complaint | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const complaintsData = await fetchApprovedComplaints({ corps: activeCorps, priority: activePriority }).catch(() => []);
        if (Array.isArray(complaintsData)) setProblems(complaintsData);
      } catch (error) {
        console.error("Critical dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeCorps, activePriority]);

  const selectedProblemRef = useRef(selectedProblem);
  selectedProblemRef.current = selectedProblem;

  useEffect(() => {
    const handler = () => {
      fetchApprovedComplaints({ corps: activeCorps, priority: activePriority }).then((data) => {
        const fresh = data.filter(Boolean) as Complaint[];
        setProblems(fresh);
        const current = selectedProblemRef.current;
        if (current) {
          const updated = fresh.find((c) => c.id === current.id);
          if (updated) setSelectedProblem(updated);
        }
      }).catch(() => {});
    };
    window.addEventListener("complaintUpdated", handler);
    return () => window.removeEventListener("complaintUpdated", handler);
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
    return <PageSpinner />;
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
              <FilterSearchInput value={searchQuery} onChange={setSearchQuery} />
              <BuildingFilterSelect
                value={activeCorps}
                onValueChange={setActiveCorps}
                buildings={buildings}
              />
              <PriorityFilterSelect value={activePriority} onValueChange={setActivePriority} />
            </div>
            <CategoryFilterButtons
              value={activeCategory}
              onChange={setActiveCategory}
              categories={categories}
            />

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
              const manage = canManage(problem);
              return (
                <ComplaintCard
                  key={problem.id}
                  complaint={problem}
                  bodyPadding="p-5"
                  footerClassName="flex items-center justify-between pt-3"
                  onCardClick={() => { setSelectedProblem(problem); setSheetOpen(true); }}
                  showPhoto
                  photoZoom
                  photoHeight="h-40"
                  onPhotoPreview={setPreviewImage}
                  footerLeft="added-date"
                  commentsMode={manage ? "inline" : "hidden"}
                  commentsOpen={comments.isOpen(problem.id)}
                  commentsSeparator
                  onCommentToggle={() => comments.toggle(problem.id)}
                  commentsContent={
                    <CommentSection
                      complaintId={problem.id}
                      currentUserId={currentUser?.user}
                      isAdmin={admin}
                      complaintAuthorId={problem.user_id}
                    />
                  }
                  showDelete={manage}
                  deleteHoverReveal
                  onDelete={handleDelete}
                />
              );
            })}

            {filteredProblems.length === 0 && (
              <EmptyState
                icon={SearchIcon2}
                title="Немає заявок за вибраними фільтрами."
                action={
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
                }
              />
            )}
          </div>
        </div>
      </main>

      {selectedProblem && (
        <ComplaintSidePanel
          complaint={selectedProblem}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onStatusChange={() => {
            fetchApprovedComplaints({ corps: activeCorps, priority: activePriority }).then((data) => {
              const fresh = data.filter(Boolean) as Complaint[];
              setProblems(fresh);
              const updated = fresh.find((c) => c.id === selectedProblem.id);
              if (updated) setSelectedProblem(updated);
            }).catch(() => {});
          }}
          currentUserId={currentUser?.user}
          isAdmin={admin}
        />
      )}

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
