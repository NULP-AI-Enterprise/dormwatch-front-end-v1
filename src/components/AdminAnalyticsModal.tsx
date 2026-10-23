import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  Clock,
  UserCheck,
  Wrench,
  Eye,
  CheckCircle2,
  CircleX,
  AlertCircle,
  Building2,
  Layers,
  Home,
  ArrowRight,
} from "lucide-react";
import { isBlockComplaint } from "@/lib/complaintUtils";
import { cn } from "@/lib/utils";
import type { Complaint } from "@/lib/types";

export type AnalyticsTimeframe = "week" | "month" | "year" | "all";

export interface AdminAnalyticsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaints: Complaint[];
  currentTimeframe: AnalyticsTimeframe;
  onTimeframeChange?: (tf: AnalyticsTimeframe) => void;
}

const TIMEFRAME_LABELS: Record<AnalyticsTimeframe, string> = {
  week: "За тиждень",
  month: "За місяць",
  year: "За рік",
  all: "За весь час",
};

export const AdminAnalyticsSheet = ({
  open,
  onOpenChange,
  complaints,
  currentTimeframe,
  onTimeframeChange,
}: AdminAnalyticsSheetProps) => {
  const navigate = useNavigate();
  const [selectedTf, setSelectedTf] = useState<AnalyticsTimeframe>(currentTimeframe);

  // Keep internal state in sync with parent prop
  useEffect(() => {
    setSelectedTf(currentTimeframe);
  }, [currentTimeframe]);

  const timeframe = selectedTf;

  const handleTfClick = (tf: AnalyticsTimeframe) => {
    setSelectedTf(tf);
    onTimeframeChange?.(tf);
  };

  const filteredComplaints = useMemo(() => {
    if (timeframe === "all") return complaints;
    const now = Date.now();
    const days = timeframe === "week" ? 7 : timeframe === "month" ? 30 : 365;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return complaints.filter((c) => {
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

  const total = filteredComplaints.length;
  const pending = filteredComplaints.filter((c) => c.status === "pending").length;
  const urgentPending = filteredComplaints.filter(
    (c) => c.status === "pending" && (c.priority === "urgent" || c.priority === "high")
  ).length;
  const approved = filteredComplaints.filter((c) => c.status === "approved").length;
  const inProgress = filteredComplaints.filter((c) => c.status === "in_progress").length;
  const review = filteredComplaints.filter((c) => c.status === "review").length;
  const resolved = filteredComplaints.filter((c) => c.status === "resolved").length;
  const notAccepted = filteredComplaints.filter((c) => c.status === "not_accepted").length;
  const rejected = filteredComplaints.filter((c) => c.status === "rejected").length;
  const withdrawn = filteredComplaints.filter((c) => c.status === "withdrawn").length;
  const closedOther = rejected + withdrawn;

  const calcRate = (cnt: number) => (total > 0 ? Math.round((cnt / total) * 100) : 0);
  const resolutionRate = calcRate(resolved);
  const inProgressRate = calcRate(inProgress);
  const reviewRate = calcRate(review);
  const approvedRate = calcRate(approved);
  const pendingRate = calcRate(pending);
  const notAcceptedRate = calcRate(notAccepted);
  const closedOtherRate = calcRate(closedOther);

  // Breakdown by category
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    filteredComplaints.forEach((c) => {
      const cat = c.category?.trim() || "Без категорії";
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({
        name,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredComplaints, total]);

  // Breakdown by building
  const buildings = useMemo(() => {
    const map = new Map<string, number>();
    filteredComplaints.forEach((c) => {
      const b = c.building?.trim() || "Не вказано";
      map.set(b, (map.get(b) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({
        name,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredComplaints, total]);

  // Breakdown by priority
  const priorities = useMemo(() => {
    const counts = { urgent: 0, high: 0, medium: 0, low: 0, other: 0 };
    filteredComplaints.forEach((c) => {
      const p = (c.priority || "").toLowerCase();
      if (p === "urgent") counts.urgent += 1;
      else if (p === "high") counts.high += 1;
      else if (p === "medium") counts.medium += 1;
      else if (p === "low") counts.low += 1;
      else counts.other += 1;
    });
    return [
      { label: "Критичний", count: counts.urgent, color: "bg-red-500", textColor: "text-red-500" },
      { label: "Високий", count: counts.high, color: "bg-amber-500", textColor: "text-amber-500" },
      { label: "Середній", count: counts.medium, color: "bg-blue-500", textColor: "text-blue-500" },
      { label: "Низький", count: counts.low, color: "bg-slate-400", textColor: "text-muted-foreground" },
    ].filter((item) => item.count > 0 || total === 0);
  }, [filteredComplaints, total]);

  // Location breakdown: shared space vs living rooms (with block complaints inside rooms)
  const sharedCount = filteredComplaints.filter((c) => c.isShared).length;
  const roomCount = total - sharedCount;
  const blockCount = filteredComplaints.filter((c) => !c.isShared && isBlockComplaint(c.description)).length;
  const sharedPercent = total > 0 ? Math.round((sharedCount / total) * 100) : 0;
  const roomPercent = total > 0 ? Math.round((roomCount / total) * 100) : 0;
  const blockPercentOfTotal = total > 0 ? Math.round((blockCount / total) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 border-l border-border bg-card flex flex-col h-full shadow-2xl"
      >
        {/* Sticky Header with Title and Segmented Timeframe Switcher */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border p-6 pr-14 space-y-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 border border-primary/20 text-primary">
                <BarChart3 className="size-4" />
              </div>
              <SheetTitle className="text-base font-bold text-foreground">
                Розширена аналітика звернень
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-muted-foreground">
              Аналітичний зріз активності, ефективність вирішення та статистика по гуртожитках
            </SheetDescription>
          </div>

          {/* Timeframe selector: responsive 4-column grid, no clipping */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-muted/60 border border-border">
            {(["week", "month", "year", "all"] as AnalyticsTimeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => handleTfClick(tf)}
                className={cn(
                  "py-1.5 px-2 text-xs font-semibold transition-all cursor-pointer text-center truncate",
                  timeframe === tf
                    ? "bg-card text-foreground shadow-2xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {TIMEFRAME_LABELS[tf]}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Analytics Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Key KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-muted/20 border border-border">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Всього подано
              </span>
              <span className="text-2xl font-bold text-foreground mt-1 block">{total}</span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                {TIMEFRAME_LABELS[timeframe].toLowerCase()}
              </span>
            </div>

            <div className="p-3.5 bg-muted/20 border border-border">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <Clock className="size-3.5 text-amber-500" />
                <span>Очікують</span>
              </div>
              <span className="text-2xl font-bold text-foreground mt-1 block">{pending}</span>
              <span
                className={cn(
                  "text-[11px] font-medium block mt-0.5",
                  urgentPending > 0 ? "text-amber-500" : "text-muted-foreground"
                )}
              >
                {urgentPending > 0 ? `${urgentPending} термінових` : "без затримок"}
              </span>
            </div>

            <div className="p-3.5 bg-muted/20 border border-border">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <UserCheck className="size-3.5 text-sky-500" />
                <span>Схвалено</span>
              </div>
              <span className="text-2xl font-bold text-foreground mt-1 block">{approved}</span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                очікують майстра
              </span>
            </div>

            <div className="p-3.5 bg-muted/20 border border-border">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <Wrench className="size-3.5 text-blue-500" />
                <span>В роботі</span>
              </div>
              <span className="text-2xl font-bold text-foreground mt-1 block">{inProgress}</span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                активні ремонти
              </span>
            </div>

            <div className="p-3.5 bg-muted/20 border border-border">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <Eye className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span>На перевірці</span>
              </div>
              <span className="text-2xl font-bold text-foreground mt-1 block">{review}</span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                очікують оцінки
              </span>
            </div>

            <div className="p-3.5 bg-muted/20 border border-border">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>Вирішено</span>
              </div>
              <span className="text-2xl font-bold text-foreground mt-1 block">{resolved}</span>
              <span className="text-[11px] text-emerald-500 font-medium block mt-0.5">
                {resolutionRate}% успішності
              </span>
            </div>

            <div className="p-3.5 bg-muted/20 border border-border">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <CircleX className="size-3.5 text-red-500" />
                <span>Не прийнято</span>
              </div>
              <span className="text-2xl font-bold text-foreground mt-1 block">{notAccepted}</span>
              <span className="text-[11px] text-red-500 font-medium block mt-0.5">
                {notAcceptedRate}% на доопрацюванні
              </span>
            </div>

            <div className="p-3.5 bg-muted/20 border border-border">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <AlertCircle className="size-3.5 text-slate-400" />
                <span>Інші закриті</span>
              </div>
              <span className="text-2xl font-bold text-foreground mt-1 block">{closedOther}</span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                {rejected} відхил. · {withdrawn} скасов.
              </span>
            </div>
          </div>

          {/* Processing Status Distribution */}
          <div className="p-5 bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Загальний стан обробки
              </h4>
              <span className="text-xs font-semibold text-emerald-500">
                {resolutionRate}% вирішено
              </span>
            </div>

            <div className="w-full h-3 bg-muted/60 overflow-hidden flex border border-border">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${resolutionRate}%` }}
                title={`Вирішено: ${resolved}`}
              />
              <div
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${inProgressRate}%` }}
                title={`В роботі: ${inProgress}`}
              />
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${reviewRate}%` }}
                title={`На перевірці: ${review}`}
              />
              <div
                className="bg-sky-500 h-full transition-all duration-500"
                style={{ width: `${approvedRate}%` }}
                title={`Схвалено: ${approved}`}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${pendingRate}%` }}
                title={`Очікують: ${pending}`}
              />
              <div
                className="bg-red-500 h-full transition-all duration-500"
                style={{ width: `${notAcceptedRate}%` }}
                title={`Не прийнято: ${notAccepted}`}
              />
              <div
                className="bg-slate-500 h-full transition-all duration-500"
                style={{ width: `${closedOtherRate}%` }}
                title={`Відхилено/Скасовано: ${closedOther}`}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div className="flex items-center gap-1.5">
                <div className="size-2 bg-emerald-500 shrink-0" />
                <span className="text-muted-foreground truncate">
                  Вирішено: <span className="font-semibold text-foreground">{resolved}</span> ({resolutionRate}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="size-2 bg-blue-500 shrink-0" />
                <span className="text-muted-foreground truncate">
                  В роботі: <span className="font-semibold text-foreground">{inProgress}</span> ({inProgressRate}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="size-2 bg-blue-600 dark:bg-blue-500 shrink-0" />
                <span className="text-muted-foreground truncate">
                  На перевірці: <span className="font-semibold text-foreground">{review}</span> ({reviewRate}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="size-2 bg-sky-500 shrink-0" />
                <span className="text-muted-foreground truncate">
                  Схвалено: <span className="font-semibold text-foreground">{approved}</span> ({approvedRate}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="size-2 bg-amber-500 shrink-0" />
                <span className="text-muted-foreground truncate">
                  Очікують: <span className="font-semibold text-foreground">{pending}</span> ({pendingRate}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="size-2 bg-red-500 shrink-0" />
                <span className="text-muted-foreground truncate">
                  Не прийнято: <span className="font-semibold text-foreground">{notAccepted}</span> ({notAcceptedRate}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="size-2 bg-slate-500 shrink-0" />
                <span className="text-muted-foreground truncate">
                  Інші: <span className="font-semibold text-foreground">{closedOther}</span> ({closedOtherRate}%)
                </span>
              </div>
            </div>
          </div>

          {/* Categories breakdown */}
          <div className="p-5 bg-card border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <span>Категорії звернень</span>
              </h4>
              <span className="text-xs text-muted-foreground">
                {categories.length} {categories.length === 1 ? "категорія" : "категорій"}
              </span>
            </div>

            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">
                Немає звернень за обраний період.
              </p>
            ) : (
              <div className="space-y-3">
                {categories.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-foreground">{cat.name}</span>
                      <span className="text-muted-foreground">
                        <span className="font-bold text-foreground">{cat.count}</span>{" "}
                        <span className="text-[11px]">({cat.percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted/60 overflow-hidden border border-border">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${cat.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buildings & Priorities in 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buildings */}
            <div className="p-5 bg-card border border-border space-y-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                <span>Гуртожитки</span>
              </h4>

              {buildings.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Даних немає.</p>
              ) : (
                <div className="space-y-3">
                  {buildings.map((b) => (
                    <div key={b.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-foreground">{b.name}</span>
                        <span className="text-muted-foreground">
                          <span className="font-bold text-foreground">{b.count}</span> ({b.percent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted/60 overflow-hidden border border-border">
                        <div
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${b.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Priorities */}
            <div className="p-5 bg-card border border-border space-y-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="size-4 text-primary" />
                <span>Рівень пріоритету</span>
              </h4>

              <div className="space-y-3">
                {priorities.map((item) => {
                  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className={cn("font-medium", item.textColor)}>{item.label}</span>
                        <span className="text-muted-foreground">
                          <span className="font-bold text-foreground">{item.count}</span> ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted/60 overflow-hidden border border-border">
                        <div
                          className={cn("h-full transition-all duration-500", item.color)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Location Type: Shared space vs Living Rooms */}
          <div className="p-5 bg-card border border-border space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Home className="size-4 text-primary" />
              <span>Тип локації звернення</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-muted/20 border border-border">
                <span className="text-muted-foreground text-[11px] block">
                  Спільний простір (кухні, коридори, санвузли)
                </span>
                <p className="text-xl font-bold text-foreground mt-1">
                  {sharedCount}{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    ({sharedPercent}%)
                  </span>
                </p>
              </div>

              <div className="p-3 bg-muted/20 border border-border">
                <span className="text-muted-foreground text-[11px] block">
                  Житлові кімнати
                </span>
                <p className="text-xl font-bold text-foreground mt-1">
                  {roomCount}{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    ({roomPercent}%)
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  з них звернень по блоку: <span className="font-semibold text-foreground">{blockCount}</span> ({blockPercentOfTotal}% від загальної к-сті)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action buttons at bottom */}
          <div className="pb-6 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                navigate("/admin/complaints");
              }}
              className="cursor-pointer gap-2 text-xs"
            >
              <span>Перейти до всіх звернень</span>
              <ArrowRight className="size-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer text-xs"
            >
              Закрити
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Aliases for clean backward compatibility
export const AdminAnalyticsModal = AdminAnalyticsSheet;
export default AdminAnalyticsSheet;
