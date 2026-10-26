import { forwardRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Trash2, CircleCheck, CircleX, UserCheck, Play } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fetchWorkers, apiErrorText } from "@/services/problemsApi";
import { PRIORITY_OPTIONS, priorityLabel } from "@/lib/complaintUtils";
import type { Complaint, Worker } from "@/lib/types";

interface ComplaintAdminActionsProps {
  complaint: Complaint;
  // One PATCH body per action — combined triage moves travel as a single
  // request ({ status, worker_id, deadline, rejection_reason, priority }).
  // Rejects on a failed PATCH so this cluster can surface the field error.
  onPatch: (body: Record<string, unknown>) => void | Promise<unknown>;
  onDelete: () => void;
  // When true, hides Delete once the complaint is resolved/rejected. Used by the
  // side panel; the admin list leaves delete available in every state (default).
  hideDeleteWhenClosed?: boolean;
}

const destructiveActionClass =
  "bg-destructive text-destructive-foreground hover:bg-destructive/90";
const skyActionClass = "bg-primary hover:bg-primary-hover text-primary-foreground";

// One confirmation dialog + trigger button for the actions that need no input.
const ConfirmAction = ({
  trigger,
  title,
  description,
  confirmLabel,
  confirmClassName = skyActionClass,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClassName?: string;
  onConfirm: () => void;
}) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Скасувати</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className={confirmClassName}>
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// Forwards ref and any injected props (e.g. AlertDialogTrigger's onClick via
// Radix Slot) down to Button — without this, `asChild` triggers are inert.
const ActionButton = forwardRef<
  HTMLButtonElement,
  {
    variant?: "destructive";
    icon: LucideIcon;
    children: React.ReactNode;
  } & React.ComponentProps<typeof Button>
>(({ variant, icon: Icon, children, ...props }, ref) => (
  <Button ref={ref} variant={variant} {...props}>
    <Icon className="size-3 mr-1" strokeWidth={2} />
    {children}
  </Button>
));
ActionButton.displayName = "ActionButton";

const isDateInPast = (date?: Date) => {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return target.getTime() < today.getTime();
};

// The triage cluster used both on admin complaint cards (AdminComplaintsPage)
// and in the ComplaintSidePanel:
//   Очікує → plain approve, approve+assign (automatically moves to «В роботі»),
//            reject with a required reason.
//   Схвалено → assign worker (automatically moves to «В роботі»).
//   В роботі → reassign worker, finish work (Виконано → «На перевірці»).
//   На перевірці → (auto-resolved after 3 days or confirmed by student; no manual resolve button).
const ComplaintAdminActions = ({
  complaint,
  onPatch,
  onDelete,
  hideDeleteWhenClosed = false,
}: ComplaintAdminActionsProps) => {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [assignWorkerId, setAssignWorkerId] = useState<string | null>(null);
  const [assignDeadline, setAssignDeadline] = useState<Date | undefined>(undefined);
  const [assignPriority, setAssignPriority] = useState<string>(
    complaint.priority || "medium"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assignOpen) return;
    fetchWorkers().then(setWorkers).catch(() => setWorkers([]));
  }, [assignOpen]);

  const run = async (
    action: () => void | Promise<unknown>,
    fallbackError: string
  ) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setBusy(false);
      setRejectOpen(false);
      setAssignOpen(false);
      setReason("");
    } catch (err) {
      setBusy(false);
      setError(apiErrorText(err, fallbackError));
      console.warn("Admin action failed", err);
    }
  };

  const isAssignDeadlineInPast = isDateInPast(assignDeadline);
  const isAssignValid = Boolean(assignWorkerId && assignDeadline && !isAssignDeadlineInPast);

  const openAssignModal = () => {
    setError(null);
    setAssignWorkerId(complaint.worker ? String(complaint.worker.worker_id) : null);
    setAssignDeadline(complaint.deadline ? new Date(complaint.deadline) : undefined);
    setAssignPriority(complaint.priority || "medium");
    setAssignOpen(true);
  };

  const handleAssignSubmit = () => {
    if (!assignWorkerId || !assignDeadline || isAssignDeadlineInPast) return;
    const payload: Record<string, unknown> = {
      worker_id: Number(assignWorkerId),
      deadline: assignDeadline.toISOString(),
      priority: assignPriority,
    };
    // Assigning a worker automatically moves pending, approved, or not_accepted complaints to in_progress
    if (complaint.status === "pending" || complaint.status === "approved" || complaint.status === "not_accepted") {
      payload.status = "in_progress";
    }
    return run(
      () => onPatch(payload),
      "Не вдалося призначити виконавця. Спробуйте ще раз."
    );
  };

  // Delete is available in every state (hidden on closed states only when
  // hideDeleteWhenClosed). Extracted so the proxy branches can compose it.
  const renderDelete = () =>
    !(hideDeleteWhenClosed && ["resolved", "rejected"].includes(complaint.status)) ? (
      <ConfirmAction
        trigger={
          <ActionButton variant="destructive" icon={Trash2}>
            Видалити
          </ActionButton>
        }
        title="Видалити звернення?"
        description="Ви впевнені, що хочете видалити це звернення? Цю дію неможливо скасувати."
        confirmLabel="Видалити"
        confirmClassName={destructiveActionClass}
        onConfirm={onDelete}
      />
    ) : null;

  const renderAssignDialog = () => {
    const isPending = complaint.status === "pending" || complaint.status === "not_accepted";
    const isInProgress = complaint.status === "in_progress";
    return (
      <Dialog
        open={assignOpen}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setAssignOpen(false);
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isPending
                ? "Схвалити та призначити"
                : isInProgress
                ? "Перепризначити виконавця"
                : "Призначити виконавця"}
            </DialogTitle>
            <DialogDescription>
              {isPending
                ? "Звернення одразу перейде в статус «В роботі», виконавець, обовʼязковий дедлайн та пріоритет запишуться."
                : isInProgress
                ? "Оберіть нового працівника та оновіть дедлайн або пріоритет."
                : "Звернення перейде в статус «В роботі». Оберіть працівника, обовʼязковий дедлайн та перевірте пріоритет."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Виконавець <span className="text-status-info">*</span>
              </label>
              <Select value={assignWorkerId ?? ""} onValueChange={setAssignWorkerId}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Оберіть виконавця" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((w) => (
                    <SelectItem key={w.worker_id} value={String(w.worker_id)}>
                      {w.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!assignWorkerId && (
                <p className="text-xs text-status-info font-medium mt-1">
                  Обовʼязкове поле
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Дедлайн <span className="text-status-info">*</span>
              </label>
              <DatePicker
                date={assignDeadline}
                setDate={(d) => setAssignDeadline(d ?? undefined)}
                placeholder="Оберіть дату дедлайну"
                disabled={{ before: new Date() }}
              />
              {!assignDeadline && (
                <p className="text-xs text-status-info font-medium mt-1">
                  Обовʼязкове поле
                </p>
              )}
              {isAssignDeadlineInPast && (
                <p className="text-xs text-status-info font-semibold mt-1">
                  Дедлайн не може бути раніше сьогоднішнього дня
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Пріоритет</label>
              <Select value={assignPriority} onValueChange={setAssignPriority}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {priorityLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="text-xs leading-relaxed text-status-info font-semibold">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                setAssignOpen(false);
                setError(null);
              }}
            >
              Скасувати
            </Button>
            <Button
              className={skyActionClass}
              disabled={!isAssignValid || busy}
              onClick={handleAssignSubmit}
            >
              {isPending
                ? "Схвалити і призначити"
                : isInProgress
                ? "Зберегти"
                : "Призначити"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderRejectDialog = () => (
    <Dialog
      open={rejectOpen}
      onOpenChange={(open) => {
        if (!open && !busy) {
          setRejectOpen(false);
          setError(null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Причина відхилення</DialogTitle>
          <DialogDescription>
            Опишіть, чому звернення відхилено — причину буде показано мешканцеві.
            Статус зміниться на «Відхилено» остаточно.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Наприклад: це питання не належить до компетенції гуртожитку"
          aria-invalid={!reason.trim() ? true : undefined}
        />
        {error && (
          <p className="text-xs leading-relaxed text-status-info font-semibold">{error}</p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              setRejectOpen(false);
              setError(null);
            }}
          >
            Скасувати
          </Button>
          <Button
            className={skyActionClass}
            disabled={!reason.trim() || busy}
            onClick={() =>
              run(
                () =>
                  onPatch({
                    status: "rejected",
                    rejection_reason: reason.trim(),
                  }),
                "Не вдалося відхилити звернення. Спробуйте ще раз."
              )
            }
          >
            Відхилити
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (complaint.status === "pending" || complaint.status === "not_accepted") {
    return (
      <>
        <ConfirmAction
          trigger={<ActionButton icon={CircleCheck}>Схвалити</ActionButton>}
          title="Схвалити звернення?"
          description={'Ви впевнені, що хочете схвалити це звернення? Воно перейде в статус "Схвалено". Виконавця можна призначити пізніше.'}
          confirmLabel="Схвалити"
          confirmClassName={skyActionClass}
          onConfirm={() =>
            run(
              () => onPatch({ status: "approved" }),
              "Не вдалося схвалити звернення. Спробуйте ще раз."
            )
          }
        />

        <Button
          variant="outline"
          onClick={() => {
            setError(null);
            setAssignWorkerId(null);
            setAssignDeadline(undefined);
            setAssignPriority(complaint.priority || "medium");
            setAssignOpen(true);
          }}
        >
          <UserCheck className="size-3 mr-1" strokeWidth={2} />
          Схвалити і призначити
        </Button>

        <Button
          variant="outline"
          className="text-status-danger hover:text-status-danger border-status-danger/40"
          onClick={() => {
            setError(null);
            setReason("");
            setRejectOpen(true);
          }}
        >
          <CircleX className="size-3 mr-1" strokeWidth={2} />
          Відхилити
        </Button>

        {error && !rejectOpen && !assignOpen && (
          <p className="text-xs leading-relaxed text-status-info font-semibold">{error}</p>
        )}

        {renderAssignDialog()}
        {renderRejectDialog()}
      </>
    );
  }

  if (complaint.status === "approved") {
    return (
      <>
        <Button
          variant="outline"
          onClick={openAssignModal}
        >
          <UserCheck className="size-3 mr-1" strokeWidth={2} />
          Призначити
        </Button>

        {complaint.worker && (
          <ConfirmAction
            trigger={
              <ActionButton icon={Play}>
                Взято в роботу
              </ActionButton>
            }
            title="Взяти звернення в роботу?"
            description="Ви підтверджуєте, що виконавець розпочав виконання робіт. Статус зміниться на «В роботі»."
            confirmLabel="Взяти в роботу"
            confirmClassName={skyActionClass}
            onConfirm={() =>
              run(
                () => onPatch({ status: "in_progress" }),
                "Не вдалося змінити статус звернення."
              )
            }
          />
        )}

        {renderDelete()}

        {error && !assignOpen && (
          <p className="text-xs leading-relaxed text-status-info font-semibold">{error}</p>
        )}

        {renderAssignDialog()}
      </>
    );
  }

  if (complaint.status === "in_progress") {
    return (
      <>
        <Button
          variant="outline"
          onClick={openAssignModal}
        >
          <UserCheck className="size-3 mr-1" strokeWidth={2} />
          Перепризначити
        </Button>

        {complaint.worker && (
          <ConfirmAction
            trigger={
              <ActionButton icon={CircleCheck}>
                Виконано
              </ActionButton>
            }
            title="Завершити виконання робіт?"
            description="Ви підтверджуєте, що всі роботи за зверненням завершено. Воно перейде в статус «На перевірці» для підтвердження мешканцем."
            confirmLabel="Виконано"
            confirmClassName={skyActionClass}
            onConfirm={() =>
              run(
                () => onPatch({ status: "review" }),
                "Не вдалося змінити статус звернення."
              )
            }
          />
        )}
        {renderDelete()}
        {error && !assignOpen && (
          <p className="text-xs leading-relaxed text-status-info font-semibold">{error}</p>
        )}
        {renderAssignDialog()}
      </>
    );
  }

  if (complaint.status === "review") {
    return (
      <>
        {renderDelete()}
        {error && (
          <p className="text-xs leading-relaxed text-status-info font-semibold">{error}</p>
        )}
      </>
    );
  }

  return (
    <>
      {renderDelete()}
      {error && (
        <p className="text-xs leading-relaxed text-status-info font-semibold">{error}</p>
      )}
    </>
  );
};

export default ComplaintAdminActions;
