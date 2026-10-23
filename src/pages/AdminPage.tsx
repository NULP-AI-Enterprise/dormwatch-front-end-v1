import { useEffect, useState, useMemo } from "react";
import {
  fetchAllComplaints,
} from "@/services/problemsApi";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import { StatCard, StatCardSkeleton } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Clock, UserCheck, Wrench, Eye, CircleCheck, CircleX, BarChart3, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { priorityBadgeClass, priorityLabel, cleanComplaintDescription } from "@/lib/complaintUtils";
import { useUser } from "@/context/UserContext";
import { AdminAnalyticsModal, type AnalyticsTimeframe } from "@/components/AdminAnalyticsModal";
import { cn } from "@/lib/utils";
import type { Complaint } from "@/lib/types";

const TIMEFRAME_OPTIONS: { value: AnalyticsTimeframe; label: string }[] = [
  { value: "week", label: "За тиждень" },
  { value: "month", label: "За місяць" },
  { value: "year", label: "За рік" },
  { value: "all", label: "За весь час" },
];

const AdminPage = () => {
  const { user: currentUser } = useUser();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>("week");
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const init = async () => {
    const data = await fetchAllComplaints();
    setComplaints(data);
    setSelectedComplaint((prev) =>
      prev ? data.find((c) => c.id === prev.id) || prev : prev
    );
    setLoading(false);
  };

  useEffect(() => {
    init();

    window.addEventListener("adminComplaintUpdated", init);
    return () => window.removeEventListener("adminComplaintUpdated", init);
  }, []);

  const filteredByTimeframe = useMemo(() => {
    if (timeframe === "all") return complaints;
    const now = Date.now();
    const days = timeframe === "week" ? 7 : timeframe === "month" ? 30 : 365;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return complaints.filter((c) => {
      // Check if complaint was created or had any lifecycle activity within the window
      const dates = [
        c.createdAt ? new Date(c.createdAt).getTime() : 0,
        c.startedAt ? new Date(c.startedAt).getTime() : 0,
        c.finishedAt ? new Date(c.finishedAt).getTime() : 0,
        c.resolvedAt ? new Date(c.resolvedAt).getTime() : 0,
      ].filter((t) => !isNaN(t) && t > 0);
      if (dates.length === 0) return false;
      const latestActivity = Math.max(...dates);
      return latestActivity >= cutoff;
    });
  }, [complaints, timeframe]);

  const pendingCount = filteredByTimeframe.filter((c) => c.status === "pending").length;
  const urgentPendingCount = filteredByTimeframe.filter(
    (c) => c.status === "pending" && (c.priority === "urgent" || c.priority === "high")
  ).length;
  const approvedCount = filteredByTimeframe.filter((c) => c.status === "approved").length;
  const inProgressCount = filteredByTimeframe.filter((c) => c.status === "in_progress").length;
  const reviewCount = filteredByTimeframe.filter((c) => c.status === "review").length;
  const resolvedCount = filteredByTimeframe.filter((c) => c.status === "resolved").length;
  const notAcceptedCount = filteredByTimeframe.filter((c) => c.status === "not_accepted").length;

  const recentComplaints = [...complaints]
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : -Infinity;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : -Infinity;
      return tb - ta;
    })
    .slice(0, 10);

  const handleRowClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setSheetOpen(true);
  };

  const handleRefresh = async () => {
    const data = await fetchAllComplaints();
    setComplaints(data);
    setSelectedComplaint((prev) =>
      prev ? data.find((c) => c.id === prev.id) || prev : prev
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-muted/60 p-1 border border-border">
              {TIMEFRAME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTimeframe(opt.value)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                    timeframe === opt.value
                      ? "bg-card text-foreground shadow-2xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnalyticsOpen(true)}
              className="text-xs h-9 cursor-pointer gap-2"
            >
              <BarChart3 className="size-4 text-primary" />
              <span>Розширена аналітика</span>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
              <StatCard
                icon={<Clock className="size-4 text-amber-500" strokeWidth={1.5} />}
                label="Очікують"
                value={pendingCount}
                subtitle={urgentPendingCount > 0 ? `з них ${urgentPendingCount} термінових` : "без затримок"}
              />
              <StatCard
                icon={<UserCheck className="size-4 text-sky-500" strokeWidth={1.5} />}
                label="Схвалено"
                value={approvedCount}
                subtitle="очікують майстра"
              />
              <StatCard
                icon={<Wrench className="size-4 text-blue-500" strokeWidth={1.5} />}
                label="В роботі"
                value={inProgressCount}
                subtitle="активні ремонти"
              />
              <StatCard
                icon={<Eye className="size-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />}
                label="На перевірці"
                value={reviewCount}
                subtitle="очікують оцінки"
              />
              <StatCard
                icon={<CircleCheck className="size-4 text-emerald-500" strokeWidth={1.5} />}
                label="Вирішено"
                value={resolvedCount}
                subtitle="успішно закриті"
              />
              <StatCard
                icon={<CircleX className="size-4 text-red-500" strokeWidth={1.5} />}
                label="Не прийнято"
                value={notAcceptedCount}
                subtitle="потребують уваги"
              />
            </div>
          )}

          <div className="bg-card border border-border overflow-hidden">
            <div className="px-6 py-4">
              <h2 className="text-xl font-semibold text-foreground">Останні звернення</h2>
            </div>
            <Separator />
            <Table className="text-left border-collapse">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b border-border text-sm text-muted-foreground">
                  <TableHead className="px-6 py-3 font-semibold">Проблема</TableHead>
                  <TableHead className="px-6 py-3 font-semibold">Категорія</TableHead>
                  <TableHead className="px-6 py-3 font-semibold">Дата подання</TableHead>
                  <TableHead className="px-6 py-3 font-semibold">Пріоритет</TableHead>
                  <TableHead className="px-6 py-3 font-semibold">Статус</TableHead>
                  <TableHead className="px-4 py-3 font-semibold sr-only">Дія</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-base divide-y divide-border">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell className="px-6 py-4">
                        <div className="h-5 w-3/4 bg-muted/50 mb-1" />
                        <div className="h-4 w-1/2 bg-muted/30" />
                      </TableCell>
                      <TableCell className="px-6 py-4"><div className="h-5 w-1/3 bg-muted/50" /></TableCell>
                      <TableCell className="px-6 py-4"><div className="h-5 w-1/2 bg-muted/50" /></TableCell>
                      <TableCell className="px-6 py-4"><div className="h-5 w-1/3 bg-muted/50" /></TableCell>
                      <TableCell className="px-6 py-4"><div className="h-6 w-1/4 bg-muted/50" /></TableCell>
                    </TableRow>
                  ))
                ) : recentComplaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-8 text-center">
                      <p className="text-sm text-muted-foreground">Звернень поки немає.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentComplaints.map((c) => (
                    <TableRow
                      key={c.id}
                      className="group relative bg-card hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="px-6 py-4 truncate max-w-xs">
                        <p className="font-semibold text-foreground truncate">
                          {c.title}
                        </p>
                        {cleanComplaintDescription(c.description) && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {cleanComplaintDescription(c.description)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-muted-foreground font-normal">
                        {c.category}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className={priorityBadgeClass(c.priority)}>
                          {priorityLabel(c.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRowClick(c)}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 text-primary hover:text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 rounded-none transition-all cursor-pointer group/details select-none"
                          title="Переглянути деталі звернення"
                        >
                          <span>Деталі</span>
                          <ChevronRight className="size-3 text-primary/70 group-hover/details:text-primary group-hover/details:translate-x-0.5 transition-all" strokeWidth={2} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {selectedComplaint && (
        <ComplaintSidePanel
          complaint={selectedComplaint}
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open);
          }}
          onStatusChange={handleRefresh}
          currentUserId={currentUser?.user}
          isAdmin={true}
        />
      )}

      <AdminAnalyticsModal
        open={analyticsOpen}
        onOpenChange={setAnalyticsOpen}
        complaints={complaints}
        currentTimeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />
    </div>
  );
};

export default AdminPage;
