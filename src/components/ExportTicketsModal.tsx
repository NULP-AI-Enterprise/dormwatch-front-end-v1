import { useEffect, useState } from "react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { fetchWorkers } from "@/services/problemsApi";
import type { Worker } from "@/lib/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ClipboardIcon,
  Cancel01Icon,
  Download01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";

interface ExportTicketsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Format a Date as a local YYYY-MM-DD (the server parses date_from/date_to as
// calendar days). toISOString() would shift by timezone, so build it manually.
const toApiDate = (d: Date) => format(d, "yyyy-MM-dd");

export const ExportTicketsModal = ({ open, onOpenChange }: ExportTicketsModalProps) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchWorkers()
        .then(setWorkers)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleExport = () => {
    const url = `/admin/tickets/print?worker=${selectedWorkerId}`;
    window.open(url, "_blank");
    onOpenChange(false);
  };

  const handleCompletedExport = () => {
    if (!range?.from || !range?.to) return;
    const params = new URLSearchParams({
      date_from: toApiDate(range.from),
      date_to: toApiDate(range.to),
    });
    window.open(`/admin/reports/completed/print?${params.toString()}`, "_blank");
    onOpenChange(false);
  };

  // Worker combobox operates over worker-id strings, with "all" as the first item.
  // The label map lets the input search worker names and render id → name.
  const workerItems = ["all", ...workers.map((w) => String(w.worker_id))];
  const workerLabel = (id: string) => {
    if (id === "all") return "Всі працівники";
    const w = workers.find((w) => String(w.worker_id) === id);
    return w ? w.full_name : id;
  };

  const rangeLabel =
    range?.from && range?.to
      ? `${format(range.from, "d MMM yyyy", { locale: uk })} — ${format(range.to, "d MMM yyyy", { locale: uk })}`
      : range?.from
        ? `${format(range.from, "d MMM yyyy", { locale: uk })} — …`
        : "Оберіть діапазон дат";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-bold text-lg mb-1">
            <HugeiconsIcon icon={ClipboardIcon} className="size-5" />
            <DialogTitle>Експорт даних</DialogTitle>
          </div>
          <DialogDescription>
            Оберіть тип звіту для генерації та друку.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="tickets" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="tickets">Наряди</TabsTrigger>
            <TabsTrigger value="completed">Виконані</TabsTrigger>
          </TabsList>

          {/* Tab 1 — per-worker ticket export (existing behavior). */}
          <TabsContent value="tickets" className="mt-4">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Оберіть працівника, для якого згенерувати звіт по нарядах. Тікети
                сортуються за дедлайном.
              </p>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">Виберіть працівника</label>
                <Combobox<string, false>
                  items={workerItems}
                  value={selectedWorkerId}
                  onValueChange={(v) => setSelectedWorkerId(v ?? "all")}
                  itemToStringLabel={workerLabel}
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
                          {workerLabel(id)}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <Button variant="outline" className="gap-2" onClick={() => onOpenChange(false)}>
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                  Скасувати
                </Button>
                <Button className="gap-2" onClick={handleExport} disabled={loading}>
                  <HugeiconsIcon icon={Download01Icon} className="size-4" />
                  Згенерувати звіт
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2 — completed-tickets report over a resolution date range. */}
          <TabsContent value="completed" className="mt-4">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Звіт про виконані звернення (вирішені та з призначеним нарядом) за
                обраний період вирішення.
              </p>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">Діапазон дат</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      data-empty={!range?.from}
                      className={cn(
                        "w-full justify-start text-left data-[empty=true]:text-muted-foreground",
                      )}
                    >
                      <HugeiconsIcon icon={Calendar01Icon} className="mr-2 size-4" strokeWidth={2} />
                      {rangeLabel}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={range}
                      onSelect={setRange}
                      numberOfMonths={1}
                      locale={uk}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <Button variant="outline" className="gap-2" onClick={() => onOpenChange(false)}>
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                  Скасувати
                </Button>
                <Button
                  className="gap-2"
                  onClick={handleCompletedExport}
                  disabled={!range?.from || !range?.to}
                >
                  <HugeiconsIcon icon={Download01Icon} className="size-4" />
                  Згенерувати звіт
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
