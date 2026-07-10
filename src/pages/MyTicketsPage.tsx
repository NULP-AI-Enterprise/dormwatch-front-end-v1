import { useEffect, useMemo, useState } from "react";
import { isSameLocalDay } from "@/lib/dateUtils";
import { fetchCategories } from "@/services/problemsApi";
import { TicketCard } from "@/components/TicketCard";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FilterSearchInput,
  CategoryFilterCombobox,
} from "@/components/ComplaintFilters";
import PageSpinner from "@/components/PageSpinner";
import EmptyState from "@/components/EmptyState";
import { isAdminUser, lifecycleStage } from "@/lib/complaintUtils";
import { useMyComplaintsAndTickets } from "@/hooks/useMyComplaintsAndTickets";
import { useUser } from "@/context/UserContext";
import type { CategoryOption } from "@/lib/types";
import { Ticket01Icon, Search01Icon } from "@hugeicons/core-free-icons";

const MyTicketsPage = () => {
  const { user: currentUser } = useUser();
  const { tickets, loading, reload, complaintById } = useMyComplaintsAndTickets();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  // Track the selected TICKET (not just the complaint) so a complaint with more
  // than one ticket opens the exact one the user clicked.
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [state, setState] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  // One row per ticket (not deduped) whose complaint we can resolve.
  const rows = useMemo(
    () =>
      tickets
        .map((t) => ({ ticket: t, complaint: complaintById.get(t.complaint) }))
        .filter((r): r is { ticket: (typeof r)["ticket"]; complaint: NonNullable<(typeof r)["complaint"]> } =>
          !!r.complaint
        ),
    [tickets, complaintById]
  );

  const filtered = useMemo(
    () =>
      rows.filter(({ ticket, complaint }) => {
        const searchOk =
          search === "" ||
          (complaint.title || "").toLowerCase().includes(search.toLowerCase()) ||
          (complaint.description || "").toLowerCase().includes(search.toLowerCase());
        // "Стан" derives from the shared lifecycle stage so a rejected complaint's
        // ticket is never miscounted as "В роботі".
        const stage = lifecycleStage(complaint.status);
        const stateOk = state === "all" || stage === state;
        const categoryOk =
          selectedCategories.length === 0 ||
          (complaint.category != null && selectedCategories.includes(complaint.category));
        const deadlineOk = !deadline || isSameLocalDay(ticket.deadline, deadline);
        return searchOk && stateOk && categoryOk && deadlineOk;
      }),
    [rows, search, state, selectedCategories, deadline]
  );

  if (loading) return <PageSpinner />;

  const selectedTicket =
    selectedTicketId != null ? tickets.find((t) => t.ticket_id === selectedTicketId) ?? null : null;
  const selectedProblem = selectedTicket ? complaintById.get(selectedTicket.complaint) ?? null : null;

  const openSheet = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setSheetOpen(true);
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Мої тікети
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Звернення, які комендант взяв у роботу — виконавець, дедлайн і стан.
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* filter sidebar (admin-style) */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-border shadow-none bg-card">
            <CardContent>
              <div className="mb-4">
                <FilterSearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Пошук тікетів..."
                />
              </div>

              <h4 className="text-xs font-semibold text-muted-foreground mb-3">Стан</h4>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Всі" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі</SelectItem>
                  <SelectItem value="in_progress">В роботі</SelectItem>
                  <SelectItem value="resolved">Вирішено</SelectItem>
                </SelectContent>
              </Select>

              <Separator className="my-4" />

              <h4 className="text-xs font-semibold text-muted-foreground mb-3">Категорії</h4>
              <CategoryFilterCombobox
                value={selectedCategories}
                onChange={setSelectedCategories}
                categories={categories}
              />

              <Separator className="my-4" />

              <h4 className="text-xs font-semibold text-muted-foreground mb-3">Дедлайн до</h4>
              <DatePicker date={deadline} setDate={setDeadline} placeholder="Оберіть дату" />
            </CardContent>
          </Card>
        </div>

        {/* ticket list (read-only work orders) */}
        <div className="lg:col-span-3">
          {rows.length === 0 ? (
            <EmptyState
              icon={Ticket01Icon}
              title="Поки нічого в роботі"
              subtitle="Щойно комендант призначить виконавця, тут з’явиться тікет із дедлайном і прогресом."
            />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Search01Icon} title="Нічого не знайшли за цими фільтрами." />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map(({ ticket, complaint }) => (
                <TicketCard
                  key={ticket.ticket_id}
                  ticket={ticket}
                  complaint={complaint}
                  onOpen={() => openSheet(ticket.ticket_id)}
                />
              ))}
            </div>
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

export default MyTicketsPage;
