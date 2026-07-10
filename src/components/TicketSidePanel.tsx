import { useState, useEffect } from "react";
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { format } from "date-fns";
import { createTicket, updateTicket } from "@/services/problemsApi";
import { StatusBadge } from "@/components/StatusBadge";
import TicketInfo from "@/components/TicketInfo";
import { HugeiconsIcon } from "@hugeicons/react";
import { EditIcon } from "@hugeicons/core-free-icons";
import type { Complaint, Ticket, Worker } from "@/lib/types";

interface TicketSidePanelProps {
  complaint: Complaint | null;
  ticket?: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workers: Worker[];
  allTickets: Ticket[];
  onTicketChange?: () => void;
  readOnly?: boolean;
}

const UNASSIGNED = "unassigned";

const TicketSidePanel = ({
  complaint,
  ticket,
  open,
  onOpenChange,
  workers,
  onTicketChange,
  readOnly = true,
}: TicketSidePanelProps) => {
  const [selectedWorker, setSelectedWorker] = useState<string>(UNASSIGNED);
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Default to the read-only view; create mode (editable + no ticket yet) opens
  // straight into the form. Mirrors ComplaintSidePanel's isEditing pattern.
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setSelectedWorker(ticket?.worker?.worker_id ? String(ticket.worker.worker_id) : UNASSIGNED);
    setDeadlineDate(ticket?.deadline ? new Date(ticket.deadline) : undefined);
    setError(null);
    setIsEditing(!readOnly && !ticket);
  }, [ticket, complaint, readOnly]);

  if (!complaint) return null;

  const categoryLabel = complaint.category;

  // Assignee combobox operates over worker-id strings (matching selectedWorker),
  // with UNASSIGNED as the first selectable item. The label map lets search match
  // worker names, and renders the id back to a name in the input/list.
  const workerItems = [UNASSIGNED, ...workers.map((w) => String(w.worker_id))];
  const workerLabel = (id: string) => {
    if (id === UNASSIGNED) return "Не призначено";
    const w = workers.find((w) => String(w.worker_id) === id);
    return w ? w.full_name : id;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const workerId = selectedWorker === UNASSIGNED ? null : Number(selectedWorker);
    const deadlineStr = deadlineDate ? format(deadlineDate, "yyyy-MM-dd") : null;
    try {
      if (ticket) {
        await updateTicket(ticket.ticket_id, workerId, deadlineStr);
      } else {
        await createTicket(complaint.id, workerId, deadlineStr);
      }
      onTicketChange?.();
      onOpenChange(false);
    } catch (err) {
      setError("Не вдалося зберегти тікет. Спробуйте ще раз.");
      console.warn("Failed to save ticket", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Тікет{String(complaint.id) !== "new" ? ` #${complaint.id}` : ""}</SheetTitle>
          <SheetDescription>Керування тікетом для звернення</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 py-4">
          {/* Complaint summary (read-only) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <StatusBadge status={complaint.status} />
              <span className="text-xs text-muted-foreground font-semibold">
                {categoryLabel}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {complaint.title || "Без назви"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed break-all">
              {(complaint.description || "—").slice(0, 100)}
              {(complaint.description || "").length > 100 ? "…" : ""}
            </p>
          </div>

          <Separator />

          {isEditing ? (
            <>
              {/* Ticket fields (editable) */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                    Виконавець
                  </label>
                  <Combobox<string, false>
                    items={workerItems}
                    value={selectedWorker}
                    onValueChange={(v) => setSelectedWorker(v ?? UNASSIGNED)}
                    itemToStringLabel={workerLabel}
                  >
                    <ComboboxInput placeholder="Не призначено" className="w-full" />
                    <ComboboxContent>
                      <ComboboxEmpty>Виконавців не знайдено</ComboboxEmpty>
                      <ComboboxList>
                        {(id: string) => (
                          <ComboboxItem key={id} value={id}>
                            {workerLabel(id)}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                    Дедлайн
                  </label>
                  <DatePicker
                    date={deadlineDate}
                    setDate={setDeadlineDate}
                    placeholder="Оберіть дедлайн"
                  />
                </div>

                {ticket && (
                  <p className="text-xs text-muted-foreground font-semibold">
                    Тікет #{ticket.ticket_id}
                  </p>
                )}
              </div>

              {error && (
                <p className="text-xs leading-relaxed text-destructive font-semibold">{error}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Збереження..." : "Зберегти"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Editing an existing ticket → back to read-only view.
                    // Creating (no ticket) → nothing to view, so close.
                    if (ticket) setIsEditing(false);
                    else onOpenChange(false);
                  }}
                >
                  Скасувати
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Ticket fields (read-only) */}
              {ticket ? (
                <TicketInfo variant="detail" ticket={ticket} />
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">Виконавець:</span> Не призначено
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">Дедлайн:</span> —
                  </p>
                </div>
              )}

              {!readOnly && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <HugeiconsIcon icon={EditIcon} className="size-4 mr-1.5" strokeWidth={2} />
                  Редагувати
                </Button>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TicketSidePanel;
