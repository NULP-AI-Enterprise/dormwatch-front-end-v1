import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { fetchApprovedComplaints, fetchEmployees, createTicket, updateTicket } from "../services/problemsApi";

interface TicketCreateFormProps {
  onClose: () => void;
  onSaved: () => void;
  editTicket?: {
    ticket_id: number;
    complaint: number;
    user?: any;
    deadline?: string;
  } | null;
}

const TicketCreateForm = ({ onClose, onSaved, editTicket }: TicketCreateFormProps) => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState(
    editTicket?.complaint ? String(editTicket.complaint) : ""
  );
  const [selectedEmployee, setSelectedEmployee] = useState(
    editTicket?.user?.user ? String(editTicket.user.user) : ""
  );
  const [deadline, setDeadline] = useState(
    editTicket?.deadline ? editTicket.deadline.split("T")[0] : ""
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchApprovedComplaints("new").then(setComplaints);
    fetchEmployees().then(setEmployees);
  }, []);

  const handleSave = async () => {
    if (!selectedComplaint) return;
    setSaving(true);
    try {
      if (editTicket) {
        await updateTicket(
          editTicket.ticket_id,
          selectedEmployee || null as any,
          deadline || null as any
        );
      } else {
        await createTicket(
          Number(selectedComplaint),
          selectedEmployee || null as any,
          deadline || null as any
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
        <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2 block">
          Заявка
        </label>
        <Select value={selectedComplaint} onValueChange={setSelectedComplaint}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Виберіть заявку..." />
          </SelectTrigger>
          <SelectContent>
            {complaints.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.title || `Заявка #${c.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2 block">
          Призначити працівника
        </label>
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="-- Не призначено --" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((emp: any) => (
              <SelectItem key={emp.user} value={String(emp.user)}>
                {emp.first_name} {emp.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2 block">
          Дедлайн
        </label>
        <Input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1 text-[10px] font-bold uppercase tracking-wider" onClick={onClose}>
          Скасувати
        </Button>
        <Button
          className="flex-1 text-[10px] font-bold uppercase tracking-wider"
          onClick={handleSave}
          disabled={saving || !selectedComplaint}
        >
          {saving ? "Збереження..." : editTicket ? "Оновити тікет" : "Створити тікет"}
        </Button>
      </div>
    </div>
  );
};

export default TicketCreateForm;
