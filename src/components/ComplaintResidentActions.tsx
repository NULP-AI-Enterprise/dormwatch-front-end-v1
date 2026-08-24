import { useState } from "react";
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
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircleIcon,
  CancelCircleIcon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons";
import {
  acceptComplaint,
  rejectComplaint,
  withdrawComplaint,
  refileComplaint,
} from "@/services/problemsApi";
import { TERMINAL_STATUSES, statusLabel } from "@/lib/complaintUtils";
import type { Complaint } from "@/lib/types";

interface ComplaintResidentActionsProps {
  complaint: Complaint;
  // Called after every successful mutation so the owning page reloads.
  onChanged: () => void;
  // Cards use "xs"; the side panel keeps the default height.
  size?: React.ComponentProps<typeof Button>["size"];
}

// DRF field errors arrive as a JSON-stringified body inside Error.message.
const errorText = (err: unknown, fallback: string) => {
  try {
    const body = JSON.parse((err as Error).message);
    const field =
      body.rework_reason ?? body.status ?? body.follow_up_of ?? body.detail;
    if (typeof field === "string") return field;
    if (Array.isArray(field)) return field.join(" ");
  } catch {
    /* plain message */
  }
  return fallback;
};

// The owner's lifecycle cluster over the single status machine:
// На перевірці → Прийняти / Не прийняти (reason required, with one-tap
// re-file), Очікує → Скасувати, terminal → Подати повторно. Mirrors
// ComplaintAdminActions so both role clusters behave the same way.
const ComplaintResidentActions = ({
  complaint,
  onChanged,
  size = "default",
}: ComplaintResidentActionsProps) => {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setReason("");
    setError(null);
    setRejectOpen(false);
    setBusy(false);
  };

  const run = async (action: () => Promise<unknown>, fallbackError: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      reset();
      window.dispatchEvent(new CustomEvent("complaintUpdated"));
      onChanged();
    } catch (err) {
      setBusy(false);
      setError(errorText(err, fallbackError));
      console.warn("Resident action failed", err);
    }
  };

  // Reject then — for the re-file path — create the linked follow-up in one
  // tap. The typed reason is required either way; the server rejects an
  // empty one and caps each complaint at one open follow-up.
  const handleReject = async (refile: boolean) =>
    run(async () => {
      await rejectComplaint(complaint.id, reason.trim());
      if (refile) await refileComplaint(complaint.id);
    }, "Не вдалося надіслати відповідь. Спробуйте ще раз.");

  const handleRefile = () =>
    run(() => refileComplaint(complaint.id), "Не вдалося створити повторне звернення. Спробуйте ще раз.");

  const handleWithdraw = () =>
    run(() => withdrawComplaint(complaint.id), "Не вдалося скасувати звернення. Спробуйте ще раз.");

  const handleAccept = () =>
    run(() => acceptComplaint(complaint.id), "Не вдалося прийняти роботу. Спробуйте ще раз.");

  if (complaint.status === "review") {
    return (
      <>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size={size}>
              <HugeiconsIcon icon={CheckmarkCircleIcon} className="size-3 mr-1" strokeWidth={2} />
              Прийняти
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Прийняти виконану роботу?</AlertDialogTitle>
              <AlertDialogDescription>
                Ви підтверджуєте, що роботу виконано. Звернення перейде в статус «Вирішено».
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Скасувати</AlertDialogCancel>
              <AlertDialogAction onClick={handleAccept}>Прийняти</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button variant="destructive" size={size} onClick={() => { setError(null); setRejectOpen(true); }}>
          <HugeiconsIcon icon={CancelCircleIcon} className="size-3 mr-1" strokeWidth={2} />
          Не прийняти
        </Button>

        {error && !rejectOpen && (
          <p className="text-xs leading-relaxed text-destructive font-semibold">{error}</p>
        )}

        <Dialog open={rejectOpen} onOpenChange={(open) => { if (!open) reset(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Що саме не прийнято?</DialogTitle>
              <DialogDescription>
                Опишіть недоліки — причина збережеться у зверненні. Роботу буде відхилено,
                адміністратор отримає повідомлення.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Наприклад: кран продовжує текти після ремонту"
              aria-invalid={!reason.trim() ? true : undefined}
            />
            {error && (
              <p className="text-xs leading-relaxed text-destructive font-semibold">{error}</p>
            )}
            <DialogFooter>
              <Button variant="outline" disabled={!reason.trim() || busy} onClick={() => handleReject(true)}>
                <HugeiconsIcon icon={Refresh01Icon} className="size-3 mr-1" strokeWidth={2} />
                Подати повторно
              </Button>
              <Button variant="destructive" disabled={!reason.trim() || busy} onClick={() => handleReject(false)}>
                Не прийняти
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (complaint.status === "pending") {
    return (
      <>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size={size}>
              <HugeiconsIcon icon={CancelCircleIcon} className="size-3 mr-1" strokeWidth={2} />
              Скасувати
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Скасувати звернення?</AlertDialogTitle>
              <AlertDialogDescription>
                Звернення перейде в статус «Скасовано» та залишиться в історії. Це неможливо
                відмінити.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Назад</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleWithdraw}>
                Скасувати звернення
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {error && (
          <p className="text-xs leading-relaxed text-destructive font-semibold">{error}</p>
        )}
      </>
    );
  }

  if (TERMINAL_STATUSES.includes(complaint.status)) {
    return (
      <>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size={size}>
              <HugeiconsIcon icon={Refresh01Icon} className="size-3 mr-1" strokeWidth={2} />
              Подати повторно
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Створити повторне звернення?</AlertDialogTitle>
              <AlertDialogDescription>
                Нове звернення у статусі «Очікує» отримає назву, опис, категорію, кімнату та фото
                цього звернення ({statusLabel(complaint.status)}, №{complaint.id}) й одразу
                потрапить на розгляд.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Скасувати</AlertDialogCancel>
              <AlertDialogAction onClick={handleRefile}>Подати повторно</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {error && (
          <p className="text-xs leading-relaxed text-destructive font-semibold">{error}</p>
        )}
      </>
    );
  }

  return null;
};

export default ComplaintResidentActions;
