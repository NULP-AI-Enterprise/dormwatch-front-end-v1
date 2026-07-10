import { useState } from "react";
import { Link } from "react-router-dom";
import ComplaintCard from "@/components/ComplaintCard";
import { TicketCard } from "@/components/TicketCard";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import { StatCard } from "@/components/StatCard";
import PageSpinner from "@/components/PageSpinner";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { isAdminUser, isActiveStatus, lifecycleStage } from "@/lib/complaintUtils";
import { useMyComplaintsAndTickets } from "@/hooks/useMyComplaintsAndTickets";
import { useUser } from "@/context/UserContext";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MapPinIcon,
  File01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  ArrowRight02Icon,
  Wrench01Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons";

const UserPage = () => {
  const { user: currentUser } = useUser();
  const { problems, loading, reload, complaintById, ticketByComplaint } =
    useMyComplaintsAndTickets();

  // Select by id so the open sheet always reflects the freshest complaint from
  // the hook (no stale snapshot, no manual re-sync ref).
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (loading) return <PageSpinner />;

  const firstName = currentUser?.first_name || "Користувач";
  const building = currentUser?.place?.building?.name || "";
  const room = currentUser?.place?.place_name || "";

  const resolvedCount = problems.filter((p) => p.status === "resolved").length;
  const activeCount = problems.filter((p) => isActiveStatus(p.status)).length;

  const recent = problems.slice(0, 4);

  // Active work orders for the right-column glance: resolve each ticket to its
  // complaint FIRST, drop any that don't resolve or aren't in progress, THEN
  // cap — so the cap never yields blank slots.
  const activeTickets = ticketByComplaint.size
    ? [...ticketByComplaint.values()]
        .map((t) => ({ ticket: t, complaint: complaintById.get(t.complaint) }))
        .filter(
          (r): r is { ticket: (typeof r)["ticket"]; complaint: NonNullable<(typeof r)["complaint"]> } =>
            !!r.complaint && lifecycleStage(r.complaint.status) === "in_progress"
        )
        .slice(0, 3)
    : [];

  const selectedProblem = selectedId != null ? complaintById.get(selectedId) ?? null : null;
  const selectedTicket = selectedId != null ? ticketByComplaint.get(selectedId) ?? null : null;

  const openSheet = (id: number) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  return (
    <>
      {/* greeting */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Вітаємо, {firstName}!
        </h1>
        {(building || room) && (
          <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
            <HugeiconsIcon icon={MapPinIcon} className="size-4" strokeWidth={1.5} />
            {building}
            {building && room && <span className="w-1 h-1 bg-border inline-block mx-1.5" />}
            {room && `Кімната ${room}`}
          </p>
        )}
      </div>

      {/* front-and-center CTA — big button with right arrow */}
      <Button
        asChild
        className="group h-auto w-full justify-between gap-4 px-8 py-6 mb-10 text-base"
      >
        <Link to="/create-report">
        <span className="flex items-center gap-4">
          <span className="inline-flex size-12 items-center justify-center border border-white/20 bg-white/10 shrink-0">
            <HugeiconsIcon icon={Wrench01Icon} className="size-6" strokeWidth={2} />
          </span>
          <span className="text-left">
            <span className="block text-lg md:text-xl font-semibold">Створити звернення</span>
            <span className="block text-sm text-primary-foreground/80 mt-0.5">
              Опишіть несправність — комендант побачить її одразу.
            </span>
          </span>
        </span>
        <HugeiconsIcon
          icon={ArrowRight02Icon}
          className="size-7 shrink-0 group-hover:translate-x-1 transition-transform"
          strokeWidth={2}
        />
        </Link>
      </Button>

      {/* stat row — same grid/gap and icon stroke as AdminPage's StatCard row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <StatCard
          icon={<HugeiconsIcon icon={File01Icon} className="size-4" strokeWidth={1.5} />}
          label="Всього звернень"
          value={problems.length}
        />
        <StatCard
          icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" strokeWidth={1.5} />}
          label="Вирішено"
          value={resolvedCount}
        />
        <StatCard
          icon={<HugeiconsIcon icon={Clock01Icon} className="size-4" strokeWidth={1.5} />}
          label="Активні"
          value={activeCount}
        />
      </div>

      {/* two columns: recent requests + active tickets glance */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">Останні звернення</h2>
            <Link to="/my-complaints" className="text-sm font-semibold text-primary hover:underline">
              Усі мої звернення →
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={CheckmarkCircle02Icon}
              title="Тут поки порожньо"
              subtitle="Щось зламалося? Створіть перше звернення — комендант одразу його побачить."
            />
          ) : (
            recent.map((p) => (
              <ComplaintCard
                key={p.id}
                complaint={p}
                metaVariant="date"
                descriptionFallback="—"
                showProgress
                footerLeft="id"
                ticket={ticketByComplaint.get(p.id) ?? null}
                showTicketTracking
                onCardClick={() => openSheet(p.id)}
              />
            ))
          )}
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">У роботі</h2>
            <Link to="/my-tickets" className="text-sm font-semibold text-primary hover:underline">
              Мої тікети →
            </Link>
          </div>

          {activeTickets.length === 0 ? (
            <EmptyState
              icon={Ticket01Icon}
              title="Поки нічого в роботі"
              subtitle="Щойно комендант візьме звернення в роботу, воно з’явиться тут."
            />
          ) : (
            activeTickets.map(({ ticket, complaint }) => (
              <TicketCard
                key={ticket.ticket_id}
                ticket={ticket}
                complaint={complaint}
                onOpen={() => openSheet(complaint.id)}
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

export default UserPage;
