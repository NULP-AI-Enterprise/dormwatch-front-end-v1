import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wrench,
  Search,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Eye,
  Home,
  Users,
  Upload,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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

// Undo window on "Виконано" — mirrors the server's TRANSITION_UNDO_WINDOW:
// the resident-facing notice materializes only after this passes.
const UNDO_WINDOW_MS = 30_000;

type WorkerStatusFilter = "all" | "in_progress" | "review" | "not_accepted" | "resolved";

const WORKER_STATUS_OPTIONS: { id: WorkerStatusFilter; label: string }[] = [
  { id: "all", label: "Усі" },
  { id: "in_progress", label: "У роботі" },
  { id: "review", label: "На перевірці" },
  { id: "not_accepted", label: "Не прийнято" },
  { id: "resolved", label: "Вирішено" },
];

const WorkerHomePage = () => {
  const { user: currentUser } = useUser();
  const [jobs, setJobs] = useState<Complaint[] | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<WorkerStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [openComments, setOpenComments] = useState<Record<number, boolean>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
    try {
      const active = await fetchWorkerJobs();
      setJobs(active);
    } catch {
      setError("Не вдалося завантажити завдання");
    }
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

  const toggleComments = (id: number) => {
    setOpenComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((job) => {
      // Status filter
      if (selectedStatus === "in_progress") {
        if (job.status !== "in_progress" && job.status !== "approved") return false;
      } else if (selectedStatus !== "all") {
        if (job.status !== selectedStatus) return false;
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
  }, [jobs, selectedStatus, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo to="/worker" />
          <div className="flex items-center gap-1.5 sm:gap-3">
            <NotificationBell />
            <UserNavProfile />
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 pb-32">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Мої завдання
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Керування призначеними завданнями та звітування про виконання
            </p>
          </div>
          {jobs && (
            <div className="text-xs text-muted-foreground shrink-0">
              Всього завдань: <span className="font-semibold text-foreground">{jobs.length}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-sky-500/10 border border-sky-500/25 text-xs font-semibold text-sky-600 dark:text-sky-400">
            {error}
          </div>
        )}

        {/* Top Controls: Search + Status Filters */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" strokeWidth={2} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук за назвою, описом або місцем..."
              className="pl-8 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {WORKER_STATUS_OPTIONS.map((opt) => {
              const active = selectedStatus === opt.id;
              const count = counts[opt.id] ?? 0;
              return (
                <Button
                  key={opt.id}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus(opt.id)}
                  className={`h-8 text-xs font-medium cursor-pointer transition-all shrink-0 ${
                    active ? "font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{opt.label}</span>
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 text-[10px] font-bold border ${
                      active
                        ? "bg-background text-foreground border-border"
                        : "bg-muted/60 text-muted-foreground border-border"
                    }`}
                  >
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {jobs === null ? (
          <PageSpinner />
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
          <div className="flex flex-col gap-4">
            {filteredJobs.map((job) => {
              const hasBlock = isBlockComplaint(job.description);
              const cleanDescription = cleanComplaintDescription(job.description);
              const canAct = job.status === "approved" || job.status === "in_progress";
              const isNotAccepted = job.status === "not_accepted";

              return (
                <Card key={job.id} className="py-0 border-border shadow-none bg-card overflow-hidden">
                  <CardContent className="p-5 sm:p-6 space-y-3">
                    {/* Header: Badges & Location */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <StatusBadge status={job.status} />
                        <OverdueBadge complaint={job} />
                        {job.priority && <PriorityBadge priority={job.priority} />}
                        {job.isRework && (
                          <Badge
                            variant="outline"
                            className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5"
                          >
                            Повторне опрацювання
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground shrink-0">
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

                    {/* Title */}
                    <h3 className="text-base font-semibold text-foreground leading-snug">
                      {job.title}
                    </h3>

                    {/* Description */}
                    {cleanDescription && (
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-all">
                        {cleanDescription}
                      </p>
                    )}

                    {/* Block / Shared space indicator */}
                    {(hasBlock || job.isShared) && (
                      <div className="flex flex-wrap gap-2 items-center pt-1">
                        {hasBlock && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                            <Home className="size-3.5 shrink-0 text-blue-500" strokeWidth={2} />
                            <span>Звернення стосується блоку</span>
                          </div>
                        )}
                        {job.isShared && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                            <Users className="size-3.5 shrink-0 text-amber-500" strokeWidth={2} />
                            <span>Спільний простір</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Resident's initial complaint photo preview */}
                    {job.photoUrl && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(resolveImageUrl(job.photoUrl as string))}
                          className="inline-flex items-center gap-2.5 px-3 py-1.5 text-xs border border-border bg-muted/30 hover:bg-muted text-foreground hover:border-primary/40 transition-all cursor-pointer group/attachment select-none"
                          title="Натисніть для перегляду фото у повному розмірі"
                        >
                          <div className="relative size-7 shrink-0 overflow-hidden border border-border bg-card">
                            <img
                              src={resolveImageUrl(job.thumbnail || job.photoUrl) || ""}
                              alt=""
                              className="w-full h-full object-cover group-hover/attachment:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ImageIcon className="size-3.5 text-muted-foreground group-hover/attachment:text-primary transition-colors shrink-0" strokeWidth={2} />
                            <span className="font-semibold text-foreground group-hover/attachment:text-primary transition-colors">
                              Фото проблеми
                            </span>
                            <span className="text-muted-foreground text-[11px] font-normal flex items-center gap-1">
                              · (переглянути)
                              <Eye className="size-3 ml-0.5 text-muted-foreground group-hover/attachment:text-primary transition-colors" strokeWidth={2} />
                            </span>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* If status is not_accepted: show rework reason and resident's rework photo */}
                    {isNotAccepted && (
                      <div className="space-y-2 pt-1">
                        {job.reworkReason && (
                          <div className="p-3 bg-red-500/10 border border-red-500/25 text-xs">
                            <span className="font-bold text-red-600 dark:text-red-400 block mb-1">
                              Причина повернення на доопрацювання від мешканця:
                            </span>
                            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{job.reworkReason}</p>
                          </div>
                        )}
                        {job.reworkPhoto && (
                          <div>
                            <button
                              type="button"
                              onClick={() => setPreviewImage(resolveImageUrl(job.reworkPhoto as string))}
                              className="inline-flex items-center gap-2.5 px-3 py-1.5 text-xs border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-700 dark:text-red-300 transition-colors cursor-pointer select-none"
                            >
                              <div className="relative size-6 shrink-0 overflow-hidden border border-red-500/40 bg-card">
                                <img
                                  src={resolveImageUrl(job.reworkPhoto) || ""}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <ImageIcon className="size-3.5 text-red-600 dark:text-red-400" />
                              <span className="font-semibold">Фото дефекту від мешканця</span>
                              <Eye className="size-3 ml-0.5 text-red-500" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metadata & Timestamps */}
                    <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border/60">
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
                        <p className="font-medium text-emerald-600 dark:text-emerald-400">
                          Прийнято мешканцем: {formatDateTime(job.resolvedAt)}
                        </p>
                      )}
                      {job.workNote && (
                        <p className="whitespace-pre-wrap break-all">
                          <span className="font-semibold text-foreground">Нотатка про виконання:</span>{" "}
                          {job.workNote}
                        </p>
                      )}
                      {job.completionPhoto && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setPreviewImage(resolveImageUrl(job.completionPhoto as string))}
                            className="inline-flex items-center gap-2 px-2.5 py-1 text-xs border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
                          >
                            <ImageIcon className="size-3.5 text-muted-foreground" />
                            <span className="font-semibold">Фото виконаної роботи</span>
                            <Eye className="size-3 ml-0.5 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action buttons (only for approved / in_progress) */}
                    {canAct && (
                      <div className="pt-2 border-t border-border">
                        {job.status === "approved" ? (
                          <Button
                            size="sm"
                            disabled={busyId === job.id}
                            onClick={() => handleStartWork(job)}
                            className="w-full cursor-pointer font-semibold"
                          >
                            Взято в роботу
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={busyId === job.id}
                            onClick={() => openFinishDialog(job)}
                            className="w-full cursor-pointer font-semibold bg-sky-500 hover:bg-sky-600 text-white"
                          >
                            <CheckCircle2 className="size-4 mr-1.5" />
                            Виконано
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Comments toggle & inline comment section */}
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => toggleComments(job.id)}
                        className="text-primary text-xs font-semibold hover:underline inline-flex items-center gap-1.5 p-0 h-auto cursor-pointer"
                      >
                        <MessageSquare className="size-3.5" />
                        Коментарі
                        {openComments[job.id] ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )}
                      </Button>

                      <span className="text-[11px] text-muted-foreground font-normal">
                        №{job.id}
                      </span>
                    </div>

                    {openComments[job.id] && (
                      <div className="pt-3 border-t border-border">
                        <CommentSection
                          complaintId={job.id}
                          currentUserId={currentUser?.user}
                          complaintAuthorId={job.user_id}
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
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Нотатка про виконану роботу <span className="text-muted-foreground font-normal">(опціонально)</span>
              </label>
              <Textarea
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
                      <p className="text-[11px] text-muted-foreground">
                        {((finishPhotoFile?.size || 0) / 1024).toFixed(1)} КБ
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleRemovePhoto}
                    className="text-muted-foreground hover:text-red-500 cursor-pointer"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <label className="border border-dashed border-border hover:border-primary/50 bg-muted/10 hover:bg-muted/20 p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-center">
                  <Upload className="size-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">
                    Обрати або перетягнути фото
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    PNG, JPG або WEBP
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="sr-only"
                  />
                </label>
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
              className="text-xs font-semibold cursor-pointer bg-sky-500 hover:bg-sky-600 text-white"
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
