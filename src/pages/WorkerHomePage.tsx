import ComplaintPhone from "@/components/ComplaintPhone";
import { PhotoAttachment } from "@/components/PhotoAttachment";
import PhotoUploadField from "@/components/PhotoUploadField";
import { ComplaintResourceDisclosure } from "@/components/ComplaintResourcesSection";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wrench,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Eye,
  Home,
  Users,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Logo from "@/components/Logo";
import UserNavProfile from "@/components/UserNavProfile";
import { NotificationBell } from "@/components/NotificationBell";
import PageSpinner from "@/components/PageSpinner";
import EmptyState from "@/components/EmptyState";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/StatusBadge";
import CommentSection from "@/components/CommentSection";
import ImagePreviewDialog from "@/components/ImagePreviewDialog";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import { isBlockComplaint, cleanComplaintDescription } from "@/lib/complaintUtils";
import { resolveImageUrl } from "@/services/imageUtils";
import { useUser } from "@/context/UserContext";
import {
  fetchWorkerJobs,
  workerComplaintAction,
  apiErrorText,
} from "@/services/problemsApi";
import type { Complaint } from "@/lib/types";
import {
  WorkerFiltersPopover,
  WorkerActiveFilterChips,
  FilterSearchInput,
  type WorkerStatusFilter,
} from "@/components/ComplaintFilters";

const UNDO_WINDOW_MS = 30_000;

const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const WorkerHomePage = () => {
  const { user: currentUser } = useUser();
  const [jobs, setJobs] = useState<Complaint[] | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<WorkerStatusFilter>("all");
  const [selectedPriority, setSelectedPriority] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [reworkOnly, setReworkOnly] = useState(false);
  const [sortByUrgency, setSortByUrgency] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [openComments, setOpenComments] = useState<Record<number, boolean>>({});
  const [liveCommentCounts, setLiveCommentCounts] = useState<Record<number, number>>({});
  const [liveForeignIds, setLiveForeignIds] = useState<Record<number, number | null>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const seenStorageKey = `dormwatch_worker_seen_comments_${currentUser?.user ?? "default"}`;
  const [seenForeignCommentIds, setSeenForeignCommentIds] = useState<Record<number, number>>(() => {
    try {
      const raw = localStorage.getItem(`dormwatch_worker_seen_comments_${currentUser?.user ?? "default"}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(seenStorageKey);
      if (raw) setSeenForeignCommentIds(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [seenStorageKey]);

  const markCommentsSeen = useCallback(
    (jobId: number, latestForeignId: number | null | undefined) => {
      if (latestForeignId == null) return;
      setSeenForeignCommentIds((prev) => {
        if ((prev[jobId] ?? 0) >= latestForeignId) return prev;
        const next = { ...prev, [jobId]: latestForeignId };
        try {
          localStorage.setItem(seenStorageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [seenStorageKey]
  );

  // Single-slot undo: the latest "Виконано" can be reverted for 30 s.
  const [undo, setUndo] = useState<{ id: number; title: string; until: number } | null>(null);
  const [tick, setTick] = useState(Date.now());

  // Finish completion dialog state
  const [finishTarget, setFinishTarget] = useState<Complaint | null>(null);
  const [finishNote, setFinishNote] = useState("");
  const [finishPhotoFile, setFinishPhotoFile] = useState<File | null>(null);
  const [finishPhotoPreview, setFinishPhotoPreview] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setLoadError("");
    try {
      const active = await fetchWorkerJobs();
      setJobs(active);
    } catch {
      setLoadError("Не вдалося завантажити завдання");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!undo) return;
    const timer = setInterval(() => {
      if (Date.now() >= undo.until) setUndo(null);
      else setTick(Date.now());
    }, 250);
    return () => clearInterval(timer);
  }, [undo]);

  const toggleComments = (job: Complaint) => {
    const id = job.id;
    const willOpen = !openComments[id];
    setOpenComments((prev) => ({
      ...prev,
      [id]: willOpen,
    }));
    if (willOpen) {
      const latestForeign = liveForeignIds[id] !== undefined ? liveForeignIds[id] : job.latestForeignCommentId;
      markCommentsSeen(id, latestForeign);
    }
  };

  const handleStartWork = async (complaint: Complaint) => {
    setBusyId(complaint.id);
    setError("");
    try {
      await workerComplaintAction(complaint.id, "start");
      await load();
    } catch (e) {
      setError(apiErrorText(e, "Не вдалося взяти в роботу"));
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const openFinishDialog = (complaint: Complaint) => {
    setFinishTarget(complaint);
    setFinishNote(complaint.workNote || "");
    setFinishPhotoFile(null);
    setFinishPhotoPreview(null);
  };

  const closeFinishDialog = () => {
    setFinishTarget(null);
    setFinishNote("");
    if (finishPhotoPreview) {
      URL.revokeObjectURL(finishPhotoPreview);
    }
    setFinishPhotoFile(null);
    setFinishPhotoPreview(null);
    setIsFinishing(false);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFinishPhotoFile(file);
      if (finishPhotoPreview) URL.revokeObjectURL(finishPhotoPreview);
      setFinishPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    if (finishPhotoPreview) URL.revokeObjectURL(finishPhotoPreview);
    setFinishPhotoFile(null);
    setFinishPhotoPreview(null);
  };

  const confirmFinish = async () => {
    if (!finishTarget) return;
    setIsFinishing(true);
    setError("");
    try {
      await workerComplaintAction(
        finishTarget.id,
        "finish",
        finishNote,
        finishPhotoFile
      );
      setUndo({
        id: finishTarget.id,
        title: finishTarget.title,
        until: Date.now() + UNDO_WINDOW_MS,
      });
      closeFinishDialog();
      await load();
    } catch (e) {
      setError(apiErrorText(e, "Не вдалося позначити як виконано"));
      await load();
    } finally {
      setIsFinishing(false);
    }
  };

  const handleUndo = async () => {
    if (!undo) return;
    const { id } = undo;
    setUndo(null);
    setBusyId(id);
    try {
      await workerComplaintAction(id, "finish_undo");
    } catch {
      setError("Не вдалося скасувати — час для скасування минув.");
    }
    await load();
    setBusyId(null);
  };

  const secondsLeft = undo ? Math.max(0, Math.ceil((undo.until - tick) / 1000)) : 0;

  // Counts by status
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      all: 0,
      in_progress: 0,
      review: 0,
      not_accepted: 0,
      resolved: 0,
    };
    if (!jobs) return map;
    map.all = jobs.length;
    for (const j of jobs) {
      if (j.status === "in_progress" || j.status === "approved") {
        map.in_progress += 1;
      } else if (j.status === "review") {
        map.review += 1;
      } else if (j.status === "not_accepted") {
        map.not_accepted += 1;
      } else if (j.status === "resolved") {
        map.resolved += 1;
      }
    }
    return map;
  }, [jobs]);

  const activeFilterCount =
    (selectedStatus !== "all" ? 1 : 0) +
    selectedPriority.length +
    (selectedDate ? 1 : 0) +
    (overdueOnly ? 1 : 0) +
    (reworkOnly ? 1 : 0) +
    (sortByUrgency ? 1 : 0);

  const resetFilters = () => {
    setSelectedStatus("all");
    setSelectedPriority([]);
    setSelectedDate(undefined);
    setOverdueOnly(false);
    setReworkOnly(false);
    setSortByUrgency(false);
    setSearchQuery("");
  };

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    const list = jobs.filter((job) => {
      // Status filter
      if (selectedStatus === "in_progress") {
        if (job.status !== "in_progress" && job.status !== "approved") return false;
      } else if (selectedStatus !== "all") {
        if (job.status !== selectedStatus) return false;
      }

      // Priority filter
      if (selectedPriority.length > 0 && (!job.priority || !selectedPriority.includes(job.priority))) {
        return false;
      }

      // Overdue filter
      if (overdueOnly && !job.isOverdue) {
        return false;
      }

      // Rework filter
      if (reworkOnly && !job.isRework) {
        return false;
      }

      // Assigned date filter
      const assignedDateRaw = job.assignedAt || job.startedAt || job.createdAt;
      if (selectedDate && assignedDateRaw) {
        const pDate = new Date(assignedDateRaw);
        if (
          pDate.getFullYear() !== selectedDate.getFullYear() ||
          pDate.getMonth() !== selectedDate.getMonth() ||
          pDate.getDate() !== selectedDate.getDate()
        ) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (job.title || "").toLowerCase().includes(q);
        const matchDesc = (job.description || "").toLowerCase().includes(q);
        const matchCategory = (job.category || "").toLowerCase().includes(q);
        const matchPlace = (job.placeName || "").toLowerCase().includes(q);
        const matchBuilding = (job.building || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCategory && !matchPlace && !matchBuilding) {
          return false;
        }
      }

      return true;
    });

    if (!sortByUrgency) return list;

    return [...list].sort((a, b) => {
      // 1. Actionable tasks (approved, in_progress, not_accepted) before review/resolved
      const aActionable = a.status === "approved" || a.status === "in_progress" || a.status === "not_accepted" ? 1 : 0;
      const bActionable = b.status === "approved" || b.status === "in_progress" || b.status === "not_accepted" ? 1 : 0;
      if (aActionable !== bActionable) return bActionable - aActionable;

      // 2. Overdue tasks first
      const aOverdue = a.isOverdue ? 1 : 0;
      const bOverdue = b.isOverdue ? 1 : 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;

      // 3. Priority weight descending (critical > high > medium > low)
      const aPrio = PRIORITY_WEIGHT[a.priority || ""] ?? 0;
      const bPrio = PRIORITY_WEIGHT[b.priority || ""] ?? 0;
      if (aPrio !== bPrio) return bPrio - aPrio;

      // 4. Rework tasks prioritized
      const aRework = a.isRework ? 1 : 0;
      const bRework = b.isRework ? 1 : 0;
      if (aRework !== bRework) return bRework - aRework;

      // 5. Earliest deadline first
      const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
      const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
      if (aDeadline !== bDeadline) return aDeadline - bDeadline;

      return 0;
    });
  }, [jobs, selectedStatus, selectedPriority, overdueOnly, reworkOnly, selectedDate, searchQuery, sortByUrgency]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Logo to="/worker" />
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            <UserNavProfile allowFullWidth />
            <NotificationBell />
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 pb-32 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Мої завдання
            </h1>
          </div>
          {jobs && (
            <div className="text-xs text-muted-foreground shrink-0">
              Всього завдань: <span className="font-semibold text-foreground">{jobs.length}</span>
            </div>
          )}
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-status-danger-bg border border-status-danger/30 text-xs text-status-danger">
            {error}
          </div>
        )}

        {/* Top Controls: Search + Popover Filter matching UserPage / DashboardPage style */}
        <div className="space-y-2.5 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <FilterSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Пошук за назвою, описом або місцем..."
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <WorkerFiltersPopover
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                statusCounts={counts}
                selectedPriority={selectedPriority}
                onPriorityChange={setSelectedPriority}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                overdueOnly={overdueOnly}
                onOverdueOnlyChange={setOverdueOnly}
                reworkOnly={reworkOnly}
                onReworkOnlyChange={setReworkOnly}
                sortByUrgency={sortByUrgency}
                onSortByUrgencyChange={setSortByUrgency}
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

          <WorkerActiveFilterChips
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            selectedPriority={selectedPriority}
            onPriorityChange={setSelectedPriority}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            overdueOnly={overdueOnly}
            onOverdueOnlyChange={setOverdueOnly}
            reworkOnly={reworkOnly}
            onReworkOnlyChange={setReworkOnly}
            sortByUrgency={sortByUrgency}
            onSortByUrgencyChange={setSortByUrgency}
            onResetAll={resetFilters}
          />
        </div>

        {loading ? (
          <PageSpinner />
        ) : loadError ? (
          <div role="alert" className="space-y-3"><p className="text-sm text-destructive">{loadError}</p>
            <Button variant="outline" onClick={load}>Спробувати ще раз</Button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Завдань не знайдено"
            subtitle={
              searchQuery || selectedStatus !== "all"
                ? "За вибраними критеріями фільтрації завдань немає."
                : "Нові завдання з'являться тут після призначення комендантом."
            }
          />
        ) : (
          <div className="flex flex-col gap-4 min-w-0">
            {filteredJobs.map((job) => {
              const hasBlock = isBlockComplaint(job.description);
              const cleanDescription = cleanComplaintDescription(job.description);
              const canAct = job.status === "approved" || job.status === "in_progress";
              const isNotAccepted = job.status === "not_accepted";
              const commentCount = liveCommentCounts[job.id] ?? job.commentsCount ?? 0;
              const latestForeignId =
                liveForeignIds[job.id] !== undefined ? liveForeignIds[job.id] : job.latestForeignCommentId;
              const hasUnreadComments =
                !openComments[job.id] &&
                latestForeignId != null &&
                latestForeignId > (seenForeignCommentIds[job.id] ?? 0);
              const assignedDateDisplay = job.assignedAt || job.startedAt || job.createdAt;

              return (
                <Card key={job.id} className="py-0 border-border shadow-none bg-card overflow-hidden w-full max-w-full min-w-0">
                  <CardContent className="p-5 sm:p-6 space-y-3 min-w-0">
                    {/* Header: Badges */}
                    <div className="flex flex-wrap gap-2 items-center min-w-0">
                      <StatusBadge status={job.status} />
                      <OverdueBadge complaint={job} />
                      {job.priority && <PriorityBadge priority={job.priority} />}
                      {job.isRework && (
                        <Badge
                          variant="outline"
                          className="bg-status-danger-bg text-status-danger border-status-danger/40 inline-flex items-center gap-1 font-semibold text-xs px-2 py-0.5"
                        >
                          Повторне опрацювання
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-semibold text-foreground leading-snug break-words [overflow-wrap:anywhere]">
                      {job.title}
                    </h3>

                    <ComplaintPhone phone={job.studentPhone} />

                    {/* Description */}
                    {cleanDescription && (
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere]">
                        {cleanDescription}
                      </p>
                    )}

                    {/* Block / Shared space indicator */}
                    {(hasBlock || job.isShared) && (
                      <div className="flex flex-wrap gap-2 items-center pt-1">
                        {hasBlock && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-status-info-bg text-status-info border border-status-info/40">
                            <Home className="size-3.5 shrink-0 text-status-info" strokeWidth={2} />
                            <span>Звернення стосується блоку</span>
                          </div>
                        )}
                        {job.isShared && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-status-warning-bg text-status-warning border border-status-warning/40">
                            <Users className="size-3.5 shrink-0 text-status-warning" strokeWidth={2} />
                            <span>Спільний простір</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Resident's initial complaint photo preview */}
                    {job.photoUrl && (
                      <div className="pt-1">
                        <PhotoAttachment aria-label="Переглянути фото проблеми" variant="ghost" size="content"
                          type="button"
                          onClick={() => setPreviewImage(resolveImageUrl(job.photoUrl as string))}
                          className="inline-flex items-center gap-2.5 px-3 py-1.5 text-xs border border-border bg-muted/30 hover:bg-muted text-foreground hover:border-primary/40 transition-all cursor-pointer group/attachment select-none max-w-full"
                          title="Натисніть для перегляду фото у повному розмірі"
                        >
                          <div className="relative size-7 shrink-0 overflow-hidden border border-border bg-card">
                            <img
                              src={resolveImageUrl(job.thumbnail || job.photoUrl) || ""}
                              alt=""
                              className="w-full h-full object-cover group-hover/attachment:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <ImageIcon className="size-3.5 text-muted-foreground group-hover/attachment:text-link transition-colors shrink-0" strokeWidth={2} />
                            <span className="font-semibold text-foreground group-hover/attachment:text-link transition-colors">
                              Фото проблеми
                            </span>
                            <span className="text-muted-foreground text-xs font-normal flex items-center gap-1">
                              · (переглянути)
                              <Eye className="size-3 ml-0.5 text-muted-foreground group-hover/attachment:text-link transition-colors" strokeWidth={2} />
                            </span>
                          </div>
                        </PhotoAttachment>
                      </div>
                    )}

                    {/* If status is not_accepted: show rework reason and resident's rework photo */}
                    {isNotAccepted && (
                      <div className="space-y-2 pt-1">
                        {job.reworkReason && (
                          <div className="p-3 bg-status-danger-bg border border-status-danger/40 text-xs">
                            <span className="font-bold text-status-danger block mb-1">
                              Причина повернення:
                            </span>
                            <p className="text-foreground leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere]">{job.reworkReason}</p>
                          </div>
                        )}
                        {job.reworkPhoto && (
                          <div>
                            <PhotoAttachment aria-label="Переглянути фото повторного звернення" variant="ghost" size="content"
                              type="button"
                              onClick={() => setPreviewImage(resolveImageUrl(job.reworkPhoto as string))}
                              className="inline-flex items-center gap-2.5 px-3 py-1.5 text-xs border border-status-danger/40 bg-status-danger-bg hover:bg-status-danger-bg text-status-danger transition-colors cursor-pointer select-none max-w-full"
                            >
                              <div className="relative size-6 shrink-0 overflow-hidden border border-status-danger/40 bg-card">
                                <img
                                  src={resolveImageUrl(job.reworkPhoto) || ""}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <ImageIcon className="size-3.5 text-status-danger shrink-0" />
                              <span className="font-semibold">Фото дефекту від мешканця</span>
                              <Eye className="size-3 ml-0.5 text-status-danger shrink-0" />
                            </PhotoAttachment>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metadata & Timestamps */}
                    <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-dashed border-border/60">
                      {assignedDateDisplay && (
                        <p>
                          Дата призначення:{" "}
                          <span className="font-medium text-foreground">
                            {formatDateTime(assignedDateDisplay)}
                          </span>
                        </p>
                      )}
                      {job.deadline && (
                        <p>
                          Дедлайн:{" "}
                          <span className="font-semibold text-foreground">
                            {formatDate(job.deadline)}
                          </span>
                        </p>
                      )}
                      {job.startedAt && <p>Почато: {formatDateTime(job.startedAt)}</p>}
                      {job.finishedAt && (
                        <p className="font-medium text-foreground">
                          Виконано: {formatDateTime(job.finishedAt)}
                        </p>
                      )}
                      {job.resolvedAt && (
                        <p className="font-medium text-status-success">
                          Прийнято мешканцем: {formatDateTime(job.resolvedAt)}
                        </p>
                      )}
                      {job.workNote && (
                        <p className="whitespace-pre-wrap break-all [overflow-wrap:anywhere]">
                          <span className="font-semibold text-foreground">Нотатка про виконання:</span>{" "}
                          {job.workNote}
                        </p>
                      )}
                      {job.completionPhoto && (
                        <div className="pt-1">
                          <PhotoAttachment aria-label="Переглянути фото виконаної роботи" variant="ghost" size="content"
                            type="button"
                            onClick={() => setPreviewImage(resolveImageUrl(job.completionPhoto as string))}
                            className="inline-flex items-center gap-2 px-2.5 py-1 text-xs border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
                          >
                            <ImageIcon className="size-3.5 text-muted-foreground" />
                            <span className="font-semibold">Фото виконаної роботи</span>
                            <Eye className="size-3 ml-0.5 text-muted-foreground" />
                          </PhotoAttachment>
                        </div>
                      )}
                    </div>

                    {/* Action buttons (only for approved / in_progress) */}
                    {canAct && (
                      <div className="pt-2 border-t border-dashed border-border">
                        {job.status === "approved" ? (
                          <Button
                            size="lg"
                            disabled={busyId === job.id}
                            onClick={() => handleStartWork(job)}
                            className="w-full cursor-pointer font-semibold"
                          >
                            Взято в роботу
                          </Button>
                        ) : (
                          <Button
                            size="lg"
                            disabled={busyId === job.id}
                            onClick={() => openFinishDialog(job)}
                            className="w-full cursor-pointer font-semibold bg-primary hover:bg-primary-hover text-primary-foreground"
                          >
                            <CheckCircle2 className="size-4 mr-1.5" />
                            Виконано
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Comments toggle & bottom-right location metadata */}
                    <div className="pt-2 border-t border-dashed border-border flex flex-wrap items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => toggleComments(job)}
                        aria-expanded={!!openComments[job.id]}
                        aria-controls={"comments-" + job.id}
                        className="text-link text-xs font-semibold hover:underline inline-flex items-center gap-1.5 h-auto p-0 cursor-pointer"
                      >
                        <MessageSquare className="size-3.5 shrink-0" />
                        <span>Коментарі ({commentCount}){hasUnreadComments ? " · нові" : ""}</span>
                        {openComments[job.id] ? (
                          <ChevronUp className="size-3.5 shrink-0" />
                        ) : (
                          <ChevronDown className="size-3.5 shrink-0" />
                        )}
                      </Button>

                      <div className="text-xs text-muted-foreground ml-auto text-right">
                        {job.category && (
                          <>
                            <span>{job.category}</span>
                            <span className="mx-1">·</span>
                          </>
                        )}
                        <span>
                          {job.building || "?"}
                          {job.placeName && ` · ${job.placeName}`}
                        </span>
                      </div>
                    </div>

                    <ComplaintResourceDisclosure complaintId={job.id} />

                    {openComments[job.id] && (
                      <div id={"comments-" + job.id} className="pt-3 border-t border-border">
                        <CommentSection
                          complaintId={job.id}
                          currentUserId={currentUser?.user}
                          complaintAuthorId={job.user_id}
                          hideHeader
                          onCommentsChange={(count, foreignId) => {
                            setLiveCommentCounts((prev) => ({ ...prev, [job.id]: count }));
                            setLiveForeignIds((prev) => ({ ...prev, [job.id]: foreignId }));
                            markCommentsSeen(job.id, foreignId);
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Completion Dialog with Note and Optional Photo */}
      <Dialog open={finishTarget !== null} onOpenChange={(open) => { if (!open) closeFinishDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Звітування про виконання</DialogTitle>
            <DialogDescription className="text-xs">
              Підтвердіть завершення роботи по зверненню «{finishTarget?.title}». Мешканець отримає сповіщення про необхідність перевірки.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label htmlFor="worker-completion-note" className="text-xs font-semibold block mb-1.5">
                Нотатка про виконану роботу <span className="text-muted-foreground font-normal">(опціонально)</span>
              </label>
              <Textarea
                id="worker-completion-note"
                placeholder="Опишіть, що саме було зроблено (наприклад: замінено прокладку у крані)..."
                value={finishNote}
                onChange={(e) => setFinishNote(e.target.value)}
                className="min-h-20 text-xs resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Фото виконаної роботи <span className="text-muted-foreground font-normal">(опціонально)</span>
              </label>

              {finishPhotoPreview ? (
                <div className="relative border border-border p-2 bg-muted/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={finishPhotoPreview}
                      alt="Прев'ю виконання"
                      className="size-12 object-cover border border-border"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {finishPhotoFile?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {((finishPhotoFile?.size || 0) / 1024).toFixed(1)} КБ
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Видалити фото виконання"
                    onClick={handleRemovePhoto}
                    className="text-muted-foreground hover:text-status-danger cursor-pointer"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <PhotoUploadField accept="image/*" label="Обрати фото виконаної роботи (необов’язково)" onChange={handlePhotoSelect} disabled={isFinishing} />
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeFinishDialog}
              disabled={isFinishing}
              className="text-xs cursor-pointer"
            >
              Скасувати
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirmFinish}
              disabled={isFinishing}
              className="text-xs font-semibold cursor-pointer bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              {isFinishing ? "Збереження..." : "Підтвердити виконання"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-size Image Zoom Modal */}
      <ImagePreviewDialog
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      {/* 30-second Undo Toast */}
      {undo && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border shadow-lg">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                «{undo.title}» — позначено як виконано
              </p>
              <p className="text-xs text-muted-foreground">
                Скасування доступне ще {secondsLeft} с
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={busyId === undo.id}
              className="shrink-0 cursor-pointer"
            >
              Скасувати
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerHomePage;
