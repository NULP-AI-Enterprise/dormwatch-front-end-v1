import { useState, useEffect } from "react";
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { createTicket, updateTicket } from "@/services/problemsApi";
import { StatusBadge } from "@/components/StatusBadge";
import TicketInfo from "@/components/TicketInfo";
import { HugeiconsIcon } from "@hugeicons/react";
import { EditIcon } from "@hugeicons/core-free-icons";
import type { Complaint, Ticket } from "@/lib/types";

interface TicketSidePanelProps {
  complaint: Complaint | null;
  ticket?: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Array<{ user: number; first_name: string; last_name: string }>;
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
  employees,
  onTicketChange,
  readOnly = true,
}: TicketSidePanelProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>(UNASSIGNED);
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Default to the read-only view; create mode (editable + no ticket yet) opens
  // straight into the form. Mirrors ComplaintSidePanel's isEditing pattern.
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setSelectedEmployee(ticket?.user?.user ? String(ticket.user.user) : UNASSIGNED);
    setDeadlineDate(ticket?.deadline ? new Date(ticket.deadline) : undefined);
    setError(null);
    setIsEditing(!readOnly && !ticket);
  }, [ticket, complaint, readOnly]);

  if (!complaint) return null;

  const categoryLabel = complaint.category;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const employeeId = selectedEmployee === UNASSIGNED ? null : Number(selectedEmployee);
    const deadlineStr = deadlineDate ? format(deadlineDate, "yyyy-MM-dd") : null;
    try {
      if (ticket) {
        await updateTicket(ticket.ticket_id, employeeId, deadlineStr);
      } else {
        await createTicket(complaint.id, employeeId, deadlineStr);
      }
      onTicketChange?.();
      onOpenChange(false);
    } catch (err) {
      setError("Не вдалось зберегти тікет");
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
          <SheetDescription>Керування тікетом для заявки</SheetDescription>
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
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Не призначено" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Не призначено</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.user} value={String(emp.user)}>
                          {emp.first_name} {emp.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
