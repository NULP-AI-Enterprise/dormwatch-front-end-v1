import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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
import { CircleCheck, CircleX, ImagePlus, Trash2 } from "lucide-react";
import {
  acceptComplaint,
  rejectComplaint,
  withdrawComplaint,
  apiErrorText,
} from "@/services/problemsApi";
import type { Complaint } from "@/lib/types";

interface ComplaintResidentActionsProps {
  complaint: Complaint;
  // Called after every successful mutation so the owning page reloads.
  onChanged: () => void;
  // Cards use "xs"; the side panel keeps the default height.
  size?: React.ComponentProps<typeof Button>["size"];
}

// The owner's lifecycle cluster over the single status machine:
// На перевірці → Прийняти / Не прийняти і подати повторно (reason required, photo optional)
// Очікує → Скасувати
const ComplaintResidentActions = ({
  complaint,
  onChanged,
  size = "default",
}: ComplaintResidentActionsProps) => {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setReason("");
    setPhotoFile(null);
    setPhotoPreview(null);
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
      onChanged();
    } catch (err) {
      setBusy(false);
      setError(apiErrorText(err, fallbackError));
      console.warn("Resident action failed", err);
    }
  };

  const handleReject = () =>
    run(
      async () => {
        await rejectComplaint(complaint.id, reason.trim(), photoFile);
        toast.success("Ви успішно подали звернення на повторне опрацювання. Очікуйте відповідь адміністратора.");
      },
      "Не вдалося надіслати відповідь. Спробуйте ще раз."
    );

  const handleWithdraw = () =>
    run(
      () => withdrawComplaint(complaint.id),
      "Не вдалося скасувати звернення. Спробуйте ще раз."
    );

  const handleAccept = () =>
    run(
      () => acceptComplaint(complaint.id),
      "Не вдалося прийняти роботу. Спробуйте ще раз."
    );

  if (complaint.status === "review") {
    return (
      <>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size={size}>
              <CircleCheck className="size-3 mr-1" strokeWidth={2} />
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
              <AlertDialogAction
                className="bg-sky-500 hover:bg-sky-600 text-white"
                onClick={handleAccept}
              >
                Прийняти
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          variant="outline"
          size={size}
          className="text-red-500 hover:text-red-600 border-red-500/20"
          onClick={() => {
            setError(null);
            setRejectOpen(true);
          }}
        >
          <CircleX className="size-3 mr-1" strokeWidth={2} />
          Повторно
        </Button>

        {error && !rejectOpen && (
          <p className="text-xs leading-relaxed text-sky-500 dark:text-sky-400 font-semibold">{error}</p>
        )}

        <Dialog
          open={rejectOpen}
          onOpenChange={(open) => {
            if (!open) reset();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Подати на повторне опрацювання</DialogTitle>
              <DialogDescription>
                Опишіть, що саме не влаштовує або не виконано. Звернення перейде до адміністратора.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Наприклад: кран продовжує текти після ремонту"
              aria-invalid={!reason.trim() ? true : undefined}
            />

            {photoPreview ? (
              <div className="relative border border-border p-2 bg-muted/20 flex items-center justify-between">
                <img src={photoPreview} alt="Попередній перегляд" className="h-20 w-auto object-contain rounded" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  className="text-red-500 hover:text-red-600 gap-1 text-xs"
                >
                  <Trash2 className="size-3.5" /> Видалити фото
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border border-dashed border-border py-3 px-4 cursor-pointer hover:bg-muted/30 transition-colors text-xs text-muted-foreground">
                <ImagePlus className="size-4 text-muted-foreground" />
                <span>Прикріпити фото (опціонально)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPhotoFile(file);
                      setPhotoPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            )}

            {error && (
              <p className="text-xs leading-relaxed text-sky-500 dark:text-sky-400 font-semibold">{error}</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={reset} disabled={busy}>
                Скасувати
              </Button>
              <Button
                className="bg-sky-500 hover:bg-sky-600 text-white"
                disabled={!reason.trim() || busy}
                onClick={handleReject}
              >
                Подати повторно
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
              <CircleX className="size-3 mr-1" strokeWidth={2} />
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
              <AlertDialogAction
                className="bg-sky-500 hover:bg-sky-600 text-white"
                onClick={handleWithdraw}
              >
                Скасувати звернення
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {error && (
          <p className="text-xs leading-relaxed text-sky-500 dark:text-sky-400 font-semibold">{error}</p>
        )}
      </>
    );
  }

  return null;
};

export default ComplaintResidentActions;
