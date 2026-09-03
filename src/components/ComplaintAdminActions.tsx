import { forwardRef, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Delete01Icon,
  CheckmarkCircleIcon,
  CancelCircleIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
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

// One confirmation dialog + trigger button for the actions that need no input.
const ConfirmAction = ({
  trigger,
  title,
  description,
  confirmLabel,
  confirmClassName,
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
    icon: IconSvgElement;
    children: React.ReactNode;
  } & React.ComponentProps<typeof Button>
>(({ variant, icon, children, ...props }, ref) => (
  <Button ref={ref} variant={variant} {...props}>
    <HugeiconsIcon icon={icon} className="size-3 mr-1" strokeWidth={2} />
    {children}
  </Button>
));
ActionButton.displayName = "ActionButton";

// The triage cluster used both on admin complaint cards (AdminComplaintsPage)
// and in the ComplaintSidePanel — one place per flow:
//   Очікує → plain approve, approve+assign fast path (worker + deadline +
//   priority in one PATCH), reject with a required reason.
//   На перевірці → Вирішити (admin finalizes on the resident's behalf — the
//   auto-accept timer stays out of scope).
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

  // Delete is available in every state (hidden on closed states only when
  // hideDeleteWhenClosed). Extracted so the proxy branches can compose it.
  const renderDelete = () =>
    !(hideDeleteWhenClosed && ["resolved", "rejected"].includes(complaint.status)) ? (
      <ConfirmAction
        trigger={
          <ActionButton variant="destructive" icon={Delete01Icon}>
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

  if (complaint.status === "pending") {
    return (
      <>
        <ConfirmAction
          trigger={<ActionButton icon={CheckmarkCircleIcon}>Схвалити</ActionButton>}
          title="Схвалити звернення?"
          description={'Ви впевнені, що хочете схвалити це звернення? Воно перейде в статус "Схвалено". Виконавця можна призначити пізніше.'}
          confirmLabel="Схвалити"
          onConfirm={() => onPatch({ status: "approved" })}
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
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-3 mr-1" strokeWidth={2} />
          Схвалити і призначити
        </Button>

        <Button
          variant="destructive"
          onClick={() => {
            setError(null);
            setReason("");
            setRejectOpen(true);
          }}
        >
          <HugeiconsIcon icon={CancelCircleIcon} className="size-3 mr-1" strokeWidth={2} />
          Відхилити
        </Button>

        {error && !rejectOpen && !assignOpen && (
          <p className="text-xs leading-relaxed text-destructive font-semibold">{error}</p>
        )}

        {/* Fast path: approve + assign + priority in ONE patch — the triage
            call, not three round trips. */}
        <Dialog open={assignOpen} onOpenChange={(open) => { if (!open && !busy) { setAssignOpen(false); setError(null); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Схвалити та призначити</DialogTitle>
              <DialogDescription>
                Звернення перейде в статус «Схвалено», виконавець і дедлайн запишуться одразу.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Виконавець</label>
                <Select value={assignWorkerId ?? ""} onValueChange={setAssignWorkerId}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Оберіть виконавця" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((w) => (
                      <SelectItem key={w.worker_id} value={String(w.worker_id)}>
                        <span className="flex items-center gap-1.5">
                          {w.full_name}
                          {w.has_account && (
                            <Badge variant="secondary" className="px-1 py-0 text-xs leading-none h-4">
                              доступ
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Дедлайн</label>
                <DatePicker
                  date={assignDeadline}
                  setDate={(d) => setAssignDeadline(d ?? undefined)}
                  placeholder="Не визначено"
                />
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
                <p className="text-xs leading-relaxed text-destructive font-semibold">{error}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" disabled={busy} onClick={() => { setAssignOpen(false); setError(null); }}>
                Скасувати
              </Button>
              <Button
                disabled={!assignWorkerId || busy}
                onClick={() =>
                  run(
                    () =>
                      onPatch({
                        status: "approved",
                        worker_id: Number(assignWorkerId),
                        deadline: assignDeadline ? assignDeadline.toISOString() : null,
                        priority: assignPriority,
                      }),
                    "Не вдалося схвалити звернення. Спробуйте ще раз."
                  )
                }
              >
                Схвалити і призначити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection is terminal and must say why — the reason reaches the
            resident's panel and their rejection notification. */}
        <Dialog open={rejectOpen} onOpenChange={(open) => { if (!open && !busy) { setRejectOpen(false); setError(null); } }}>
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
              <p className="text-xs leading-relaxed text-destructive font-semibold">{error}</p>
            )}
            <DialogFooter>
              <Button variant="outline" disabled={busy} onClick={() => { setRejectOpen(false); setError(null); }}>
                Скасувати
              </Button>
              <Button
                variant="destructive"
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
      </>
    );
  }

  if (complaint.status === "review") {
    return (
      <>
        <ConfirmAction
          trigger={<ActionButton icon={CheckmarkCircleIcon}>Вирішити</ActionButton>}
          title="Позначити як вирішене?"
          description={'Ви підтверджуєте від імені мешканця, що проблему вирішено. Звернення перейде в статус "Вирішено".'}
          confirmLabel="Вирішити"
          onConfirm={() => onPatch({ status: "resolved" })}
        />
        {error && (
          <p className="text-xs leading-relaxed text-destructive font-semibold">{error}</p>
        )}
      </>
    );
  }

  // Proxy lifecycle for account-less workers: the admin stamps the same
  // started_at/finished_at fields the worker panel writes, through the same
  // transition helper — so a printout job and a panel job produce identical
  // records. Only meaningful once someone is assigned to do the work.
  if (complaint.status === "approved" && complaint.worker) {
    return (
      <>
        <ActionButton
          icon={ArrowRight01Icon}
          onClick={() => onPatch({ status: "in_progress" })}
        >
          Взято в роботу
        </ActionButton>
        {renderDelete()}
        {error && (
          <p className="text-xs leading-relaxed text-destructive font-semibold">{error}</p>
        )}
      </>
    );
  }

  if (complaint.status === "in_progress" && complaint.worker) {
    return (
      <>
        <ActionButton
          icon={CheckmarkCircleIcon}
          onClick={() => onPatch({ status: "review" })}
        >
          Виконано
        </ActionButton>
        {renderDelete()}
        {error && (
          <p className="text-xs leading-relaxed text-destructive font-semibold">{error}</p>
        )}
      </>
    );
  }

  return (
    <>
      {renderDelete()}
      {error && (
        <p className="text-xs leading-relaxed text-destructive font-semibold">{error}</p>
      )}
    </>
  );
};

export default ComplaintAdminActions;
