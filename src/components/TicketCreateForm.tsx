import { useState, useEffect } from "react";
import { Button } from "./ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, AddIcon, SaveIcon } from "@hugeicons/core-free-icons";
import { fetchApprovedComplaints, fetchEmployees, createTicket, updateTicket } from "../services/problemsApi";
import type { Complaint, Employee, Ticket } from "../lib/types";
import { DatePicker } from "./ui/date-picker";
import { format } from "date-fns";

interface TicketCreateFormProps {
  onClose: () => void;
  onSaved: () => void;
  editTicket?: Ticket | null;
  fixedComplaintId?: number;
}

const TicketCreateForm = ({ onClose, onSaved, editTicket, fixedComplaintId }: TicketCreateFormProps) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState(
    fixedComplaintId ? String(fixedComplaintId) : (editTicket?.complaint ? String(editTicket.complaint) : "")
  );
  const [selectedEmployee, setSelectedEmployee] = useState(
    editTicket?.user?.user ? String(editTicket.user.user) : ""
  );
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(
    editTicket?.deadline ? new Date(editTicket.deadline) : undefined
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchApprovedComplaints().then(setComplaints);
    fetchEmployees().then(setEmployees);
  }, []);

  const handleSave = async () => {
    if (!selectedComplaint) return;
    setSaving(true);
    try {
      const deadlineStr = deadlineDate ? format(deadlineDate, "yyyy-MM-dd") : null;
      if (editTicket) {
        await updateTicket(
          editTicket.ticket_id,
          selectedEmployee || null,
          deadlineStr
        );
      } else {
        await createTicket(
          Number(selectedComplaint),
          selectedEmployee || null,
          deadlineStr
        );
      }
      onSaved();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block">
          Скарга
        </label>
        <Select value={selectedComplaint} onValueChange={setSelectedComplaint} disabled={!!fixedComplaintId || !!editTicket}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Виберіть скаргу..." />
          </SelectTrigger>
          <SelectContent>
            {complaints.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.title || `Скарга #${c.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block">
          Призначити працівника
        </label>
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="-- Не призначено --" />
          </SelectTrigger>
          <SelectContent>
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

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} className="size-4 mr-1.5" strokeWidth={2} />
          Скасувати
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !selectedComplaint}
        >
          {editTicket ? <HugeiconsIcon icon={SaveIcon} className="size-4 mr-1.5" strokeWidth={2} /> : <HugeiconsIcon icon={AddIcon} className="size-4 mr-1.5" strokeWidth={2} />}
          {saving ? "Збереження..." : editTicket ? "Оновити тікет" : "Створити тікет"}
        </Button>
      </div>
    </div>
  );
};

export default TicketCreateForm;
