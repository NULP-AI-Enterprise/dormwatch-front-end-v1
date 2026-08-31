import { useCallback, useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Logout01Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import UserAvatar from "@/components/UserAvatar";
import { NotificationBell } from "@/components/NotificationBell";
import PageSpinner from "@/components/PageSpinner";
import { StatusBadge, OverdueBadge } from "@/components/StatusBadge";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import {
  fetchWorkerJobs,
  fetchWorkerHistory,
  workerComplaintAction,
  logoutUser,
} from "@/services/problemsApi";
import type { Complaint } from "@/lib/types";

// Undo window on "Виконано" — mirrors the server's TRANSITION_UNDO_WINDOW:
// the resident-facing notice materializes only after this passes.
const UNDO_WINDOW_MS = 30_000;

// The whole panel is one actor standing in a hallway on a phone: a single
// narrow column, big one-tap targets, no filters/tabs/desktop chrome. If it
// sprouts any of those, it has drifted away from the cohort it serves.
const WorkerHomePage = () => {
  const { user } = useUser();
  const [jobs, setJobs] = useState<Complaint[] | null>(null);
  const [history, setHistory] = useState<Complaint[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  // Single-slot undo: the latest "Виконано" can be reverted for 30 s.
  const [undo, setUndo] = useState<{ id: number; title: string; until: number } | null>(null);
  const [tick, setTick] = useState(Date.now());

  const load = useCallback(async () => {
    try {
      const [active, past] = await Promise.all([
        fetchWorkerJobs(),
        fetchWorkerHistory(),
      ]);
      setJobs(active);
      setHistory(past);
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

  const act = async (
    complaint: Complaint,
    action: "start" | "finish" | "finish_undo"
  ) => {
    setBusyId(complaint.id);
    setError("");
    try {
      await workerComplaintAction(complaint.id, action, notes[complaint.id]);
      await load();
      if (action === "finish") {
        setUndo({ id: complaint.id, title: complaint.title, until: Date.now() + UNDO_WINDOW_MS });
      }
    } catch (e) {
      let message = "Дію не виконано";
      try {
        const body = JSON.parse((e as Error).message);
        message = body.status || body.detail || message;
      } catch {
        /* non-JSON error body */
      }
      setError(message);
      await load();
    } finally {
      setBusyId(null);
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
      setError("Не вдалося скасувати — можливо, час вийшов");
    }
    await load();
    setBusyId(null);
  };

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/auth";
  };

  const secondsLeft = undo ? Math.max(0, Math.ceil((undo.until - tick) / 1000)) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Logo to="/worker" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto gap-2 py-1.5 cursor-pointer">
                  <UserAvatar user={user} size="sm" fallback="П" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleLogout} variant="destructive" className="cursor-pointer">
                  <HugeiconsIcon icon={Logout01Icon} className="size-4" />
                  <span>Вийти</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6 pb-32">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-6">
          Мої завдання
        </h1>

        {error && (
          <p className="text-xs font-semibold text-destructive mb-4">{error}</p>
        )}

        {jobs === null ? (
          <PageSpinner />
        ) : jobs.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Wrench01Icon} className="size-5" />
              </EmptyMedia>
              <EmptyTitle>Завдань немає</EmptyTitle>
              <EmptyDescription>
                Нові роботи з’являться тут після призначення.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="py-0 border-border shadow-none bg-card">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <StatusBadge status={job.status} />
                    <OverdueBadge complaint={job} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs font-normal text-muted-foreground mb-2">
                    {job.followUpOf != null && (
                      <>
                        <span className="font-semibold text-foreground">
                          Повторне до №{job.followUpOf}
                        </span>
                        <span>·</span>
                      </>
                    )}
                    {job.category && (
                      <>
                        <span>{job.category}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>
                      {job.building || "?"} · {job.placeName || "?"}
                      {job.isShared && <span className="ml-0.5">(спільна)</span>}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    {job.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-all mb-3">
                    {job.description}
                  </p>

                  <div className="text-xs text-muted-foreground space-y-1">
                    {job.deadline && (
                      <p>
                        Дедлайн:{" "}
                        <span className="font-semibold text-foreground">
                          {formatDate(job.deadline)}
                        </span>
                      </p>
                    )}
                    {job.startedAt && (
                      <p>Почато: {formatDateTime(job.startedAt)}</p>
                    )}
                    {job.workNote && (
                      <p className="whitespace-pre-wrap break-all">Нотатка: {job.workNote}</p>
                    )}
                  </div>

                  {(job.status === "approved" || job.status === "in_progress") && (
                    <>
                      <Separator dashed className="my-4" />
                      <div className="flex flex-col gap-3">
                        {job.status === "in_progress" && (
                          <Textarea
                            placeholder="Нотатка (необов’язково)"
                            value={notes[job.id] ?? ""}
                            onChange={(e) =>
                              setNotes((prev) => ({ ...prev, [job.id]: e.target.value }))
                            }
                            className="min-h-16 resize-none"
                          />
                        )}
                        <Button
                          size="lg"
                          disabled={busyId === job.id}
                          onClick={() => act(job, job.status === "approved" ? "start" : "finish")}
                          className="w-full cursor-pointer"
                        >
                          {job.status === "approved" ? "Взято в роботу" : "Виконано"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between mt-8 px-0 h-auto py-2 cursor-pointer hover:bg-transparent"
            >
              <span className="text-lg font-semibold text-foreground">
                Виконано ({history.length})
              </span>
              <HugeiconsIcon
                icon={historyOpen ? ArrowUp01Icon : ArrowDown01Icon}
                className="size-4 text-muted-foreground"
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground pt-2">
                Тут з’являться ваші минулі роботи з відмітками часу.
              </p>
            ) : (
              <Card className="py-0 border-border shadow-none bg-card mt-2">
                <CardContent className="p-5 divide-y divide-border">
                  {history.map((job) => (
                    <div key={job.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-foreground leading-tight">
                          {job.title}
                        </h4>
                        <StatusBadge status={job.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        №{job.id} · {job.building || "?"} · {job.placeName || "?"}
                        {job.isShared && <span className="ml-0.5">(спільна)</span>}
                        {job.followUpOf != null && ` · Повторне до №${job.followUpOf}`}
                      </p>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {job.startedAt && <p>Почато: {formatDateTime(job.startedAt)}</p>}
                        {job.finishedAt && (
                          <p className="font-semibold text-foreground">
                            Виконано: {formatDateTime(job.finishedAt)}
                          </p>
                        )}
                        {job.workNote && (
                          <p className="whitespace-pre-wrap break-all">Нотатка: {job.workNote}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </CollapsibleContent>
        </Collapsible>
      </main>

      {undo && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                «{undo.title}» — виконано
              </p>
              <p className="text-xs text-muted-foreground">
                Скасування доступне ще {secondsLeft} с
              </p>
            </div>
            <Button
              variant="outline"
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
