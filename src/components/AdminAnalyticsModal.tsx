import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { isUrgentPriority, priorityBreakdown, statusChartColor } from "@/lib/complaintUtils";
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
    (c) => c.status === "pending" && isUrgentPriority(c.priority)
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
    return priorityBreakdown(filteredComplaints).map((item) => ({
      ...item, color: "bg-foreground", textColor: "text-foreground",
    })).filter((item) => item.count > 0 || total === 0);
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
              <div className="p-1.5 bg-primary/10 border border-primary/20 text-link">
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
          <ToggleGroup type="single" value={timeframe} onValueChange={(value) => { if (value) handleTfClick(value as AnalyticsTimeframe); }}
              aria-label="Період аналітики" variant="outline" className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-4 gap-1">
              {(["week", "month", "year", "all"] as AnalyticsTimeframe[]).map((tf) => <ToggleGroupItem key={tf} value={tf} className="min-w-0 whitespace-normal h-auto min-h-8 py-1.5">{TIMEFRAME_LABELS[tf]}</ToggleGroupItem>)}
            </ToggleGroup>
        </div>

        {/* Scrollable Analytics Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Key KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-muted/20 border border-border">
              <span className="text-xs font-semibold text-muted-foreground  block">
                Всього подано
              </span>
              <span className="text-2xl font-bold text-foreground mt-1 block">{total}</span>
              <span className="text-xs text-muted-foreground block mt-0.5">
                {TIMEFRAME_LABELS[timeframe].toLowerCase()}
              </span>
            </div>

            <div className="p-3.5 bg-muted/20 border border-border">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground ">
                <Clock className="size-3.5 text-status-warning" />
                <span>Очікують</span>
              </div>
              <span className="text-2xl font-bold text-foreground mt-1 block">{pending}</span>
              <span
                className={cn(
                  "text-xs font-medium block mt-0.5",
                  urgentPending > 0 ? "text-status-warning" : "text-muted-foreground"
                )}
              >
                {urgentPending > 0 ? `${urgentPending} термінових` : "без затримок"}
              </span>
            </div>

            <div className="p-3.5 bg-muted/20 border border-border">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground ">
                <UserCheck className="size-3.5 text-status-info" />
                <span>Схвалено</span>
              </div>
              <span className="text-2xl font-bold text-foreground mt-1 block">{approved}</span>
              <span className="text-xs text-muted-foreground block mt-0.5">
                очікують майстра
              </span>
            </div>

            <div className="p-3.5 bg-muted/20 border border-border">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground ">
                <Wrench className="size-3.5 text-status-info" />
                <span>В роботі</span>
              </div>
              <span className="text-2xl font-bold text-foreground mt-1 block">{inProgress}</span>
              <span className="text-xs text-muted-foreground block mt-0.5">
                активні ремонти
              </span>
            </div>

            <div className="p-3.5 bg-muted/20 border border-border">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground ">
                <Eye className="size-3.5 text-status-info" />
                <span>На перевірці</span>
              </div>
              <span className="text-2xl font-bold text-foreground mt-1 block">{review}</span>
              <span className="text-xs text-muted-foreground block mt-0.5">
                очікують оцінки
              </span>
            </div>

            <div className="p-3.5 bg-muted/20 border border-border">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground ">
                <CheckCircle2 className="size-3.5 text-status-success" />
                <span>Вирішено</span>
              </div>
              <span className="text-2xl font-bold text-foreground mt-1 block">{resolved}</span>
              <span className="text-xs text-status-success font-medium block mt-0.5">
                {resolutionRate}% успішності
              </span>
            </div>

            <div className="p-3.5 bg-muted/20 border border-border">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground ">
                <CircleX className="size-3.5 text-status-danger" />
                <span>Не прийнято</span>
              </div>
              <span className="text-2xl font-bold text-foreground mt-1 block">{notAccepted}</span>
              <span className="text-xs text-status-danger font-medium block mt-0.5">
                {notAcceptedRate}% на доопрацюванні
              </span>
            </div>

            <div className="p-3.5 bg-muted/20 border border-border">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground ">
                <AlertCircle className="size-3.5 text-slate-400" />
                <span>Інші закриті</span>
              </div>
              <span className="text-2xl font-bold text-foreground mt-1 block">{closedOther}</span>
              <span className="text-xs text-muted-foreground block mt-0.5">
                {rejected} відхил. · {withdrawn} скасов.
              </span>
            </div>
          </div>

          {/* Processing Status Distribution */}
          <div className="p-5 bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground ">
                Загальний стан обробки
              </h4>
              <span className="text-xs font-semibold text-status-success">
                {resolutionRate}% вирішено
              </span>
            </div>

            <div className="w-full h-3 bg-muted/60 overflow-hidden flex border border-border">
              <div
                className={cn("h-full transition-all duration-500", statusChartColor("resolved"))}
                style={{ width: `${resolutionRate}%` }}
                title={`Вирішено: ${resolved}`}
              />
              <div
                className={cn("h-full transition-all duration-500", statusChartColor("in_progress"))}
                style={{ width: `${inProgressRate}%` }}
                title={`В роботі: ${inProgress}`}
              />
              <div
                className={cn("h-full transition-all duration-500", statusChartColor("review"))}
                style={{ width: `${reviewRate}%` }}
                title={`На перевірці: ${review}`}
              />
              <div
                className={cn("h-full transition-all duration-500", statusChartColor("approved"))}
                style={{ width: `${approvedRate}%` }}
                title={`Схвалено: ${approved}`}
              />
              <div
                className={cn("h-full transition-all duration-500", statusChartColor("pending"))}
                style={{ width: `${pendingRate}%` }}
                title={`Очікують: ${pending}`}
              />
              <div
                className={cn("h-full transition-all duration-500", statusChartColor("not_accepted"))}
                style={{ width: `${notAcceptedRate}%` }}
                title={`Не прийнято: ${notAccepted}`}
              />
              <div
                className={cn("h-full transition-all duration-500", statusChartColor("closed_other"))}
                style={{ width: `${closedOtherRate}%` }}
                title={`Відхилено/Скасовано: ${closedOther}`}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div className="flex items-center gap-1.5">
                <div className={cn("size-2 shrink-0", statusChartColor("resolved"))} />
                <span className="text-muted-foreground truncate">
                  Вирішено: <span className="font-semibold text-foreground">{resolved}</span> ({resolutionRate}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className={cn("size-2 shrink-0", statusChartColor("in_progress"))} />
                <span className="text-muted-foreground truncate">
                  В роботі: <span className="font-semibold text-foreground">{inProgress}</span> ({inProgressRate}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className={cn("size-2 shrink-0", statusChartColor("review"))} />
                <span className="text-muted-foreground truncate">
                  На перевірці: <span className="font-semibold text-foreground">{review}</span> ({reviewRate}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className={cn("size-2 shrink-0", statusChartColor("approved"))} />
                <span className="text-muted-foreground truncate">
                  Схвалено: <span className="font-semibold text-foreground">{approved}</span> ({approvedRate}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className={cn("size-2 shrink-0", statusChartColor("pending"))} />
                <span className="text-muted-foreground truncate">
                  Очікують: <span className="font-semibold text-foreground">{pending}</span> ({pendingRate}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className={cn("size-2 shrink-0", statusChartColor("not_accepted"))} />
                <span className="text-muted-foreground truncate">
                  Не прийнято: <span className="font-semibold text-foreground">{notAccepted}</span> ({notAcceptedRate}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className={cn("size-2 shrink-0", statusChartColor("closed_other"))} />
                <span className="text-muted-foreground truncate">
                  Інші: <span className="font-semibold text-foreground">{closedOther}</span> ({closedOtherRate}%)
                </span>
              </div>
            </div>
          </div>

          {/* Categories breakdown */}
          <div className="p-5 bg-card border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground  flex items-center gap-2">
                <Layers className="size-4 text-link" />
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
                        <span className="text-xs">({cat.percent}%)</span>
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
              <h4 className="text-xs font-bold text-foreground  flex items-center gap-2">
                <Building2 className="size-4 text-link" />
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
                          className="h-full bg-foreground/80 transition-all duration-500"
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
              <h4 className="text-xs font-bold text-foreground  flex items-center gap-2">
                <AlertCircle className="size-4 text-link" />
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
            <h4 className="text-xs font-bold text-foreground  flex items-center gap-2">
              <Home className="size-4 text-link" />
              <span>Тип локації звернення</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-muted/20 border border-border">
                <span className="text-muted-foreground text-xs block">
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
                <span className="text-muted-foreground text-xs block">
                  Житлові кімнати
                </span>
                <p className="text-xl font-bold text-foreground mt-1">
                  {roomCount}{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    ({roomPercent}%)
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
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
