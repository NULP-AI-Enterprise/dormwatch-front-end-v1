import { useEffect, useMemo, useState } from "react";
import { deleteProblem, fetchCategories } from "@/services/problemsApi";
import ComplaintCard from "@/components/ComplaintCard";
import CommentSection from "@/components/CommentSection";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import ArrowLinkButton from "@/components/ArrowLinkButton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import {
  FilterSearchInput,
  StatusFilterSelect,
  PriorityFilterSelect,
  CategoryFilterCombobox,
} from "@/components/ComplaintFilters";
import PageSpinner from "@/components/PageSpinner";
import EmptyState from "@/components/EmptyState";
import { isAdminUser } from "@/lib/complaintUtils";
import { isSameLocalDay } from "@/lib/dateUtils";
import { useCommentToggle } from "@/hooks/useCommentToggle";
import { useMyComplaintsAndTickets } from "@/hooks/useMyComplaintsAndTickets";
import { useUser } from "@/context/UserContext";
import type { CategoryOption } from "@/lib/types";
import { CheckmarkCircle02Icon, Search01Icon } from "@hugeicons/core-free-icons";

const MyComplaintsPage = () => {
  const { user: currentUser } = useUser();
  const comments = useCommentToggle();
  const { problems, loading, reload, ticketByComplaint } = useMyComplaintsAndTickets();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string[]>([]);
  const [priority, setPriority] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  const onDelete = async (id: number) => {
    try {
      await deleteProblem(id);
      reload();
    } catch (err) {
      console.warn("Failed to delete problem", err);
    }
  };

  const filtered = useMemo(
    () =>
      problems.filter((p) => {
        const searchOk =
          search === "" ||
          (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(search.toLowerCase());
        const statusOk = status.length === 0 || status.includes(p.status);
        const priorityOk =
          priority.length === 0 || (p.priority != null && priority.includes(p.priority));
        const categoryOk =
          selectedCategories.length === 0 ||
          (p.category != null && selectedCategories.includes(p.category));
        const dateOk = !date || isSameLocalDay(p.createdAt, date);
        return searchOk && statusOk && priorityOk && categoryOk && dateOk;
      }),
    [problems, search, status, priority, selectedCategories, date]
  );

  if (loading) return <PageSpinner />;

  const selectedProblem = selectedId != null ? problems.find((p) => p.id === selectedId) ?? null : null;
  const selectedTicket = selectedId != null ? ticketByComplaint.get(selectedId) ?? null : null;

  const openSheet = (id: number) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  return (
    <>
      {/* header + front-and-center CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Мої звернення
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Усі ваші звернення та що з ними зараз відбувається.
          </p>
        </div>
        <ArrowLinkButton to="/create-report">Створити звернення</ArrowLinkButton>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* filter sidebar (mirrors AdminComplaintsPage) */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-border shadow-none bg-card">
            <CardContent>
              <div className="mb-4">
                <FilterSearchInput value={search} onChange={setSearch} />
              </div>

              <h4 className="text-xs font-semibold text-muted-foreground mb-3">Статус</h4>
              <StatusFilterSelect value={status} onChange={setStatus} />

              <Separator className="my-4" />

              <h4 className="text-xs font-semibold text-muted-foreground mb-3">Пріоритет</h4>
              <PriorityFilterSelect value={priority} onChange={setPriority} />

              <Separator className="my-4" />

              <h4 className="text-xs font-semibold text-muted-foreground mb-3">Категорії</h4>
              <CategoryFilterCombobox
                value={selectedCategories}
                onChange={setSelectedCategories}
                categories={categories}
              />

              <Separator className="my-4" />

              <h4 className="text-xs font-semibold text-muted-foreground mb-3">Дата подання</h4>
              <DatePicker date={date} setDate={setDate} placeholder="Оберіть дату" />
            </CardContent>
          </Card>
        </div>

        {/* request list */}
        <div className="lg:col-span-3 space-y-4">
          {problems.length === 0 ? (
            <EmptyState
              icon={CheckmarkCircle02Icon}
              title="Тут поки порожньо"
              subtitle="Щось зламалося? Створіть перше звернення — комендант одразу його побачить."
              action={
                <ArrowLinkButton to="/create-report" size="sm">
                  Створити звернення
                </ArrowLinkButton>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Search01Icon} title="Нічого не знайшли за цими фільтрами." />
          ) : (
            filtered.map((p) => (
              <ComplaintCard
                key={p.id}
                complaint={p}
                metaVariant="date"
                descriptionFallback="—"
                onCardClick={() => openSheet(p.id)}
                showProgress
                ticket={ticketByComplaint.get(p.id) ?? null}
                showTicketTracking
                showPhoto
                photoHeight="h-44"
                footerClassName="flex items-center justify-between pt-4"
                commentsMode="inline"
                commentsSide="left"
                commentsOpen={comments.isOpen(p.id)}
                onCommentToggle={() => comments.toggle(p.id)}
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
            ))
          )}
        </div>
      </div>

      {selectedProblem && (
        <ComplaintSidePanel
          complaint={selectedProblem}
          ticket={selectedTicket}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onStatusChange={reload}
          currentUserId={currentUser?.user}
          isAdmin={isAdminUser(currentUser)}
        />
      )}
    </>
  );
};

export default MyComplaintsPage;
