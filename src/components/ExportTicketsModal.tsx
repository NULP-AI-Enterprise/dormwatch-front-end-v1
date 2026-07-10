import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { fetchEmployees } from "@/services/problemsApi";
import type { Employee } from "@/lib/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { ClipboardIcon, Cancel01Icon, Download01Icon } from "@hugeicons/core-free-icons";

interface ExportTicketsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExportTicketsModal = ({ open, onOpenChange }: ExportTicketsModalProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchEmployees()
        .then(setEmployees)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleExport = () => {
    const url = `/admin/tickets/print?worker=${selectedEmployeeId}`;
    window.open(url, "_blank");
    onOpenChange(false);
  };

  // Worker combobox operates over user-id strings, with "all" as the first item.
  // The label map lets the input search employee names and render id → name.
  const employeeItems = ["all", ...employees.map((e) => String(e.user))];
  const employeeLabel = (id: string) => {
    if (id === "all") return "Всі працівники";
    const emp = employees.find((e) => String(e.user) === id);
    return emp ? `${emp.first_name} ${emp.last_name}` : id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-bold text-lg mb-1">
            <HugeiconsIcon icon={ClipboardIcon} className="size-5" />
            <DialogTitle>Експорт тікетів</DialogTitle>
          </div>
          <DialogDescription>
            Оберіть працівника, для якого ви хочете згенерувати та роздрукувати звіт по тікетах. Тікети будуть автоматично відсортовані за дедлайном.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">Виберіть працівника</label>
            <Combobox<string, false>
              items={employeeItems}
              value={selectedEmployeeId}
              onValueChange={(v) => setSelectedEmployeeId(v ?? "all")}
              itemToStringLabel={employeeLabel}
            >
              <ComboboxInput
                placeholder={loading ? "Завантаження..." : "Всі працівники"}
                className="w-full"
                disabled={loading}
              />
              <ComboboxContent>
                <ComboboxEmpty>Працівників не знайдено</ComboboxEmpty>
                <ComboboxList>
                  {(id: string) => (
                    <ComboboxItem key={id} value={id}>
                      {employeeLabel(id)}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" className="gap-2" onClick={() => onOpenChange(false)}>
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
            Скасувати
          </Button>
          <Button className="gap-2" onClick={handleExport} disabled={loading}>
            <HugeiconsIcon icon={Download01Icon} className="size-4" />
            Згенерувати звіт
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
