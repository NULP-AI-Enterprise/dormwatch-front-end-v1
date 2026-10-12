import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ComplaintCard from "@/components/ComplaintCard";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import AnnouncementsWidget from "@/components/AnnouncementsWidget";
import PhoneNumbersWidget from "@/components/PhoneNumbersWidget";
import ArrowLinkButton from "@/components/ArrowLinkButton";
import { Button } from "@/components/ui/button";
import PageSpinner from "@/components/PageSpinner";
import EmptyState from "@/components/EmptyState";
import { isAdminUser, groupByChain } from "@/lib/complaintUtils";
import { useMyComplaints } from "@/hooks/useMyComplaints";
import { useUser } from "@/context/UserContext";
import { Inbox, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import ImagePreviewDialog from "@/components/ImagePreviewDialog";
import { FilterSearchInput, ComplaintFiltersPopover } from "@/components/ComplaintFilters";
import DormInfoWidget from "@/components/DormInfoWidget";
import { fetchCategories } from "@/services/problemsApi";
import type { CategoryOption } from "@/lib/types";

const ITEMS_PER_PAGE = 8;

const UserPage = () => {
  const location = useLocation();
  const openComplaintId = (location.state as { openComplaintId?: number } | null)?.openComplaintId;
  const { user: currentUser } = useUser();
  const { problems, loading, reload, complaintById } = useMyComplaints();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  // Deep link: open the side panel for a specific complaint (e.g. right after
  // filing one from /create-report) once its record has loaded.
  useEffect(() => {
    if (openComplaintId != null && complaintById.has(openComplaintId)) {
      setSelectedId(openComplaintId);
      setSheetOpen(true);
    }
  }, [openComplaintId, complaintById]);

  const resetFilters = () => {
    setSelectedStatus([]);
    setSelectedPriority([]);
    setSelectedCategories([]);
    setSelectedDate(undefined);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const activeFilterCount =
    selectedStatus.length +
    selectedPriority.length +
    selectedCategories.length +
    (selectedDate ? 1 : 0);

  const filtered = useMemo(() => {
    const scoped = problems.filter((p) => {
      if (selectedStatus.length > 0 && !selectedStatus.includes(p.status)) {
        return false;
      }
      if (selectedPriority.length > 0 && (!p.priority || !selectedPriority.includes(p.priority))) {
        return false;
      }
      if (selectedCategories.length > 0) {
        if (!p.category || !selectedCategories.includes(p.category)) {
          return false;
        }
      }
      if (selectedDate && p.createdAt) {
        const pDate = new Date(p.createdAt);
        if (
          pDate.getFullYear() !== selectedDate.getFullYear() ||
          pDate.getMonth() !== selectedDate.getMonth() ||
          pDate.getDate() !== selectedDate.getDate()
        ) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        const matchCat = p.category?.toLowerCase().includes(q);
        const matchPlace = p.placeName?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat && !matchPlace) {
          return false;
        }
      }
      return true;
    });
    return groupByChain(scoped);
  }, [problems, selectedStatus, selectedPriority, selectedCategories, selectedDate, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedProblems = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, safeCurrentPage]);

  if (loading) return <PageSpinner />;

  const firstName = currentUser?.first_name || "Користувач";
  const building = currentUser?.place?.building?.name || "";
  const room = currentUser?.place?.place_name || "";
  const subtitle = [firstName && `Вітаємо, ${firstName}!`, building, room && `Кімната ${room}`]
    .filter(Boolean)
    .join(" · ");

  const selectedProblem = selectedId != null ? complaintById.get(selectedId) ?? null : null;

  const openSheet = (id: number) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  return (
    <>
      {/* Greeting line shifted up; title Головна removed per design request */}
      {subtitle && (
        <div className="mb-4">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">{subtitle}</p>
        </div>
      )}

      {/* two columns: the full complaint list + sticky contact sidebar */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {/* Section title styled elegantly */}
          <div className="flex items-center justify-between pb-1.5 border-b border-border h-8">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                Мої звернення
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 border border-border bg-muted/60 text-muted-foreground select-none">
                {filtered.length}
              </span>
            </div>
          </div>

          {/* Filter controls strictly constrained to the complaints column */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <FilterSearchInput
                value={searchQuery}
                onChange={(v) => {
                  setSearchQuery(v);
                  setCurrentPage(1);
                }}
                placeholder="Пошук моїх звернень..."
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ComplaintFiltersPopover
                selectedStatus={selectedStatus}
                onStatusChange={(v) => {
                  setSelectedStatus(v);
                  setCurrentPage(1);
                }}
                selectedPriority={selectedPriority}
                onPriorityChange={(v) => {
                  setSelectedPriority(v);
                  setCurrentPage(1);
                }}
                selectedCategories={selectedCategories}
                onCategoriesChange={(v) => {
                  setSelectedCategories(v);
                  setCurrentPage(1);
                }}
                categories={categories}
                selectedDate={selectedDate}
                onDateChange={(v) => {
                  setSelectedDate(v);
                  setCurrentPage(1);
                }}
                onReset={resetFilters}
                activeCount={activeFilterCount}
              />
              {(activeFilterCount > 0 || searchQuery.trim()) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-xs text-muted-foreground hover:text-foreground h-9 px-2.5 cursor-pointer shrink-0"
                >
                  <X className="size-3.5 mr-1" strokeWidth={2} />
                  Скинути
                </Button>
              )}
            </div>
          </div>
          {problems.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Тут поки порожньо"
              subtitle="Створіть перше звернення. Комендант побачить його одразу."
              action={
                <ArrowLinkButton to="/create-report" size="sm">
                  Створити звернення
                </ArrowLinkButton>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Нічого не знайшли за цим фільтром."
            />
          ) : (
            paginatedProblems.map((p) => (
              <ComplaintCard
                key={p.id}
                complaint={p}
                showOwnerBadge={false}
                footerClassName="flex items-center justify-between pt-4"
                onCardClick={() => openSheet(p.id)}
                showPhoto
                photoZoom
                photoHeight="h-44"
                onPhotoPreview={setPreviewImage}
                footerLeft="added-date"
                commentsMode="hidden"
              />
            ))
          )}

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border bg-card p-4">
              <span className="text-xs text-muted-foreground font-normal order-2 sm:order-1">
                Показано {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeCurrentPage * ITEMS_PER_PAGE, filtered.length)} з {filtered.length} звернень
              </span>
              <div className="flex items-center gap-1.5 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage === 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="h-8 px-2.5 text-xs cursor-pointer"
                >
                  <ChevronLeft className="size-3.5 mr-1" strokeWidth={2} />
                  <span>Попередня</span>
                </Button>
                <span className="text-xs font-semibold px-2 text-foreground">
                  {safeCurrentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="h-8 px-2.5 text-xs cursor-pointer"
                >
                  <span>Наступна</span>
                  <ChevronRight className="size-3.5 ml-1" strokeWidth={2} />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden lg:block lg:col-span-1 lg:sticky lg:top-20 self-start space-y-4">
          <div>
            <div className="hidden lg:block h-8 pb-1.5 border-b border-border select-none text-transparent">&nbsp;</div>
            <div className="pt-4 lg:pt-4">
              <ArrowLinkButton
                to="/create-report"
                className="w-full h-9 justify-center font-semibold"
              >
                Створити звернення
              </ArrowLinkButton>
            </div>
          </div>

          <AnnouncementsWidget />
          <DormInfoWidget />
          <PhoneNumbersWidget />
        </div>
      </div>

      {selectedProblem && (
        <ComplaintSidePanel
          complaint={selectedProblem}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onStatusChange={reload}
          currentUserId={currentUser?.user}
          isAdmin={isAdminUser(currentUser)}
        />
      )}

      {/* Модальне вікно перегляду фото */}
      <ImagePreviewDialog
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
};

export default UserPage;