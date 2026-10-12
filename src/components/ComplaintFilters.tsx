import { useState, useEffect, useRef } from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { PRIORITY_OPTIONS, STATUS_OPTIONS, priorityLabel, statusLabel } from "@/lib/complaintUtils";
import { formatDate } from "@/lib/dateUtils";
import type { Building, CategoryOption, Worker } from "@/lib/types";
import { Search, SlidersHorizontal, RotateCcw, Check, X, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Filter primitives shared by the dashboard, user, and admin sidebars. These
// were copy-pasted (with per-page state names) across UserPage, AdminPage,
// DashboardPage, and AdminComplaintsPage; extracted here so the option lists
// and markup live in one place.

type FilterSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function FilterSearchInput({
  value,
  onChange,
  placeholder = "Пошук звернень...",
}: FilterSearchInputProps) {
  return (
    <div className="relative">
      <Search 
        className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground"
        strokeWidth={2} />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
      />
    </div>
  );
}

type MultiFilterProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

// Shared multi-select filter over string codes: empty selection means "all".
// `itemLabel` maps a stored code to its display text (identity for buildings,
// STATUS/PRIORITY label for those). Chips render square (design-system.md) via
// `ui/combobox.tsx`. Mirrors CategoryFilterCombobox — the predicate stays
// `selected.length === 0 || selected.includes(x)` on every consumer page.
function MultiFilterCombobox({
  value,
  onChange,
  items,
  itemLabel = (v) => v,
  placeholder,
}: MultiFilterProps & {
  items: string[];
  itemLabel?: (value: string) => string;
  placeholder: string;
}) {
  return (
    <Combobox<string, true>
      multiple
      items={items}
      value={value}
      onValueChange={onChange}
      itemToStringLabel={itemLabel}
    >
      <ComboboxChips>
        <ComboboxValue>
          {(selected: string[]) =>
            selected.map((v) => (
              <ComboboxChip key={v} aria-label={itemLabel(v)}>
                {itemLabel(v)}
              </ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput placeholder={value.length ? "" : placeholder} />
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>Нічого не знайдено</ComboboxEmpty>
        <ComboboxList>
          {(v: string) => (
            <ComboboxItem key={v} value={v}>
              {itemLabel(v)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

const STATUS_CODES = [...STATUS_OPTIONS];

// `codes` lets a page restrict the option set to statuses it can actually
// return — the public dashboard only surfaces approved/resolved, so offering
// the rest there would just yield empty results. Defaults to all eight
// canonical slugs for the admin panel and resident lists.
export function StatusFilterSelect({
  value,
  onChange,
  codes = STATUS_CODES,
}: MultiFilterProps & { codes?: string[] }) {
  return (
    <MultiFilterCombobox
      value={value}
      onChange={onChange}
      items={codes}
      itemLabel={statusLabel}
      placeholder="Усі статуси"
    />
  );
}

export function PriorityFilterSelect({ value, onChange }: MultiFilterProps) {
  return (
    <MultiFilterCombobox
      value={value}
      onChange={onChange}
      items={[...PRIORITY_OPTIONS]}
      itemLabel={priorityLabel}
      placeholder="Усі пріоритети"
    />
  );
}

type WorkerFilterSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
  workers: { worker_id: number; full_name: string }[];
};

// Admin complaints list filter over assigned contractors — parity with what
// the resident's list had. Operates over full_name so the predicate stays
// `selected.includes(p.worker.full_name)`.
export function WorkerFilterSelect({ value, onChange, workers }: WorkerFilterSelectProps) {
  const names = workers.map((w) => w.full_name);
  return (
    <MultiFilterCombobox
      value={value}
      onChange={onChange}
      items={names}
      placeholder="Усі виконавці"
    />
  );
}

type BuildingFilterSelectProps = MultiFilterProps & {
  buildings: Building[];
};

export function BuildingFilterSelect({
  value,
  onChange,
  buildings,
}: BuildingFilterSelectProps) {
  return (
    <MultiFilterCombobox
      value={value}
      onChange={onChange}
      items={buildings.map((b) => b.name)}
      placeholder="Усі гуртожитки"
    />
  );
}

type CategoryFilterComboboxProps = {
  value: string[];
  onChange: (value: string[]) => void;
  categories: CategoryOption[];
};

// Multi-select category filter: an empty selection means "all". Chips render
// square (design-system.md) — styling is inherited from `ui/combobox.tsx`. Operates
// over category *names* so the predicate stays `cats.includes(p.category)`.
export function CategoryFilterCombobox({
  value,
  onChange,
  categories,
}: CategoryFilterComboboxProps) {
  const names = categories.map((c) => c.name);
  return (
    <Combobox<string, true>
      multiple
      items={names}
      value={value}
      onValueChange={onChange}
    >
      <ComboboxChips>
        <ComboboxValue>
          {(selected: string[]) =>
            selected.map((name) => (
              <ComboboxChip key={name} aria-label={name}>
                {name}
              </ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput placeholder={value.length ? "" : "Усі категорії"} />
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>Категорій не знайдено</ComboboxEmpty>
        <ComboboxList>
          {(name: string) => (
            <ComboboxItem key={name} value={name}>
              {name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export type ComplaintFiltersPopoverProps = {
  selectedStatus: string[];
  onStatusChange: (value: string[]) => void;
  statusCodes?: string[];
  selectedBuilding?: string[];
  onBuildingChange?: (value: string[]) => void;
  buildings?: Building[];
  selectedPriority: string[];
  onPriorityChange: (value: string[]) => void;
  selectedCategories: string[];
  onCategoriesChange: (value: string[]) => void;
  categories?: CategoryOption[];
  selectedWorkers?: string[];
  onWorkersChange?: (value: string[]) => void;
  workers?: { worker_id: number; full_name: string }[] | Worker[];
  selectedDate?: Date | undefined;
  onDateChange?: (date: Date | undefined) => void;
  selectedDeadline?: Date | undefined;
  onDeadlineChange?: (date: Date | undefined) => void;
  overdueOnly?: boolean;
  onOverdueOnlyChange?: (value: boolean) => void;
  reworkOnly?: boolean;
  onReworkOnlyChange?: (value: boolean) => void;
  onReset: () => void;
  activeCount: number;
};

export function ComplaintFiltersPopover({
  selectedStatus,
  onStatusChange,
  statusCodes,
  selectedBuilding = [],
  onBuildingChange,
  buildings = [],
  selectedPriority,
  onPriorityChange,
  selectedCategories,
  onCategoriesChange,
  categories = [],
  selectedWorkers,
  onWorkersChange,
  workers = [],
  selectedDate,
  onDateChange,
  selectedDeadline,
  onDeadlineChange,
  overdueOnly,
  onOverdueOnlyChange,
  reworkOnly,
  onReworkOnlyChange,
  onReset,
  activeCount,
}: ComplaintFiltersPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (containerRef.current?.contains(target)) return;
      if (
        target.closest(
          '[data-slot="combobox-content"], [data-slot="popover-content"], [role="listbox"], [role="dialog"], [role="presentation"], [data-slot="select-content"], .rdp, .react-day-picker'
        )
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant={activeCount > 0 ? "default" : "outline"}
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="h-9 gap-2 text-xs font-semibold shrink-0 cursor-pointer"
      >
        <SlidersHorizontal className="size-4" strokeWidth={2} />
        <span>Фільтри</span>
        {activeCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.2 bg-background text-foreground text-[11px] font-bold border border-border">
            {activeCount}
          </span>
        )}
        {open ? (
          <ChevronUp className="size-3.5 opacity-70" strokeWidth={2} />
        ) : (
          <ChevronDown className="size-3.5 opacity-70" strokeWidth={2} />
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[min(calc(100vw-2rem),540px)] max-w-[calc(100vw-2rem)] bg-card border border-border shadow-xl p-4 space-y-4 rounded-none animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-foreground" strokeWidth={2} />
              <span className="text-xs font-semibold text-foreground">
                Фільтри звернень
              </span>
              {activeCount > 0 && (
                <Badge variant="secondary" className="text-[11px] px-1.5 py-0 font-normal">
                  Активно: {activeCount}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              title="Згорнути"
            >
              <X className="size-4" strokeWidth={2} />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Статус
              </label>
              <StatusFilterSelect value={selectedStatus} onChange={onStatusChange} codes={statusCodes} />
            </div>

            {onBuildingChange && buildings.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Гуртожиток
                </label>
                <BuildingFilterSelect
                  value={selectedBuilding}
                  onChange={onBuildingChange}
                  buildings={buildings}
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Пріоритет
              </label>
              <PriorityFilterSelect value={selectedPriority} onChange={onPriorityChange} />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Категорії
              </label>
              <CategoryFilterCombobox
                value={selectedCategories}
                onChange={onCategoriesChange}
                categories={categories}
              />
            </div>

            {onWorkersChange && workers.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Виконавець
                </label>
                <WorkerFilterSelect
                  value={selectedWorkers ?? []}
                  onChange={onWorkersChange}
                  workers={workers as any}
                />
              </div>
            )}

            {onDateChange && (
              <div className={onWorkersChange && workers.length > 0 ? "" : "sm:col-span-2"}>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Дата подання
                </label>
                <DatePicker
                  date={selectedDate}
                  setDate={onDateChange}
                  placeholder="Оберіть дату"
                />
              </div>
            )}

            {onDeadlineChange && (
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Дедлайн
                </label>
                <DatePicker
                  date={selectedDeadline}
                  setDate={onDeadlineChange}
                  placeholder="Оберіть дату дедлайну"
                />
              </div>
            )}

            {onOverdueOnlyChange && (
              <div className="sm:col-span-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                  <Checkbox
                    id="popover-overdue-only"
                    checked={overdueOnly}
                    onCheckedChange={(v) => onOverdueOnlyChange(v === true)}
                  />
                  <span>Лише прострочені</span>
                </label>
              </div>
            )}

            {onReworkOnlyChange && (
              <div className="sm:col-span-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                  <Checkbox
                    id="popover-rework-only"
                    checked={reworkOnly}
                    onCheckedChange={(v) => onReworkOnlyChange(v === true)}
                  />
                  <span>Повторне опрацювання</span>
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={activeCount === 0}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2 cursor-pointer"
            >
              <RotateCcw className="size-3.5 mr-1" strokeWidth={2} />
              Скинути все
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold h-8 px-4 cursor-pointer"
            >
              <Check className="size-3.5 mr-1" strokeWidth={2} />
              Згорнути
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export type ComplaintFiltersModalProps = ComplaintFiltersPopoverProps;
export const ComplaintFiltersModal = ComplaintFiltersPopover;

export type ComplaintActiveFilterChipsProps = {
  selectedStatus: string[];
  onStatusChange: (value: string[]) => void;
  selectedBuilding: string[];
  onBuildingChange: (value: string[]) => void;
  selectedPriority: string[];
  onPriorityChange: (value: string[]) => void;
  selectedCategories: string[];
  onCategoriesChange: (value: string[]) => void;
  selectedDate?: Date | undefined;
  onDateChange?: (date: Date | undefined) => void;
  selectedWorkers?: string[];
  onWorkersChange?: (value: string[]) => void;
  selectedDeadline?: Date | undefined;
  onDeadlineChange?: (date: Date | undefined) => void;
  overdueOnly?: boolean;
  onOverdueOnlyChange?: (value: boolean) => void;
  reworkOnly?: boolean;
  onReworkOnlyChange?: (value: boolean) => void;
  onResetAll: () => void;
};

export function ComplaintActiveFilterChips({
  selectedStatus,
  onStatusChange,
  selectedBuilding,
  onBuildingChange,
  selectedPriority,
  onPriorityChange,
  selectedCategories,
  onCategoriesChange,
  selectedDate,
  onDateChange,
  selectedWorkers,
  onWorkersChange,
  selectedDeadline,
  onDeadlineChange,
  overdueOnly,
  onOverdueOnlyChange,
  reworkOnly,
  onReworkOnlyChange,
  onResetAll,
}: ComplaintActiveFilterChipsProps) {
  const hasActive =
    selectedStatus.length > 0 ||
    selectedBuilding.length > 0 ||
    selectedPriority.length > 0 ||
    selectedCategories.length > 0 ||
    (selectedWorkers && selectedWorkers.length > 0) ||
    !!selectedDate ||
    !!selectedDeadline ||
    !!overdueOnly ||
    !!reworkOnly;

  if (!hasActive) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      {selectedStatus.map((s) => (
        <Badge
          key={s}
          variant="secondary"
          className="text-[11px] gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Статус:</span> {statusLabel(s)}
          <button
            type="button"
            onClick={() => onStatusChange(selectedStatus.filter((x) => x !== s))}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {selectedBuilding.map((b) => (
        <Badge
          key={b}
          variant="secondary"
          className="text-[11px] gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Гуртожиток:</span> {b}
          <button
            type="button"
            onClick={() => onBuildingChange(selectedBuilding.filter((x) => x !== b))}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {selectedPriority.map((p) => (
        <Badge
          key={p}
          variant="secondary"
          className="text-[11px] gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Пріоритет:</span> {priorityLabel(p)}
          <button
            type="button"
            onClick={() => onPriorityChange(selectedPriority.filter((x) => x !== p))}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {selectedCategories.map((c) => (
        <Badge
          key={c}
          variant="secondary"
          className="text-[11px] gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Категорія:</span> {c}
          <button
            type="button"
            onClick={() => onCategoriesChange(selectedCategories.filter((x) => x !== c))}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {selectedWorkers &&
        selectedWorkers.map((w) => (
          <Badge
            key={w}
            variant="secondary"
            className="text-[11px] gap-1 px-2 py-0.5 bg-muted/60 border border-border"
          >
            <span className="text-muted-foreground">Виконавець:</span> {w}
            <button
              type="button"
              onClick={() => onWorkersChange?.(selectedWorkers.filter((x) => x !== w))}
              className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}

      {selectedDate && onDateChange && (
        <Badge
          variant="secondary"
          className="text-[11px] gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Дата:</span> {formatDate(selectedDate.toISOString())}
          <button
            type="button"
            onClick={() => onDateChange(undefined)}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}

      {selectedDeadline && onDeadlineChange && (
        <Badge
          variant="secondary"
          className="text-[11px] gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Дедлайн:</span> {formatDate(selectedDeadline.toISOString())}
          <button
            type="button"
            onClick={() => onDeadlineChange(undefined)}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}

      {overdueOnly && onOverdueOnlyChange && (
        <Badge
          variant="secondary"
          className="text-[11px] gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20"
        >
          <span>Лише прострочені</span>
          <button
            type="button"
            onClick={() => onOverdueOnlyChange(false)}
            className="hover:text-foreground text-red-400 ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}

      {reworkOnly && onReworkOnlyChange && (
        <Badge
          variant="secondary"
          className="text-[11px] gap-1 px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
        >
          <span>Повторне опрацювання</span>
          <button
            type="button"
            onClick={() => onReworkOnlyChange(false)}
            className="hover:text-foreground text-red-600 dark:text-red-400 ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onResetAll}
        className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
      >
        Скинути всі
      </Button>
    </div>
  );
}

export type WorkerStatusFilter = "all" | "in_progress" | "review" | "not_accepted" | "resolved";

export const WORKER_STATUS_OPTIONS: { id: WorkerStatusFilter; label: string }[] = [
  { id: "all", label: "Усі" },
  { id: "in_progress", label: "У роботі" },
  { id: "review", label: "На перевірці" },
  { id: "not_accepted", label: "Не прийнято" },
  { id: "resolved", label: "Вирішено" },
];

export type WorkerFiltersPopoverProps = {
  selectedStatus: WorkerStatusFilter;
  onStatusChange: (status: WorkerStatusFilter) => void;
  statusCounts: Record<string, number>;
  selectedPriority: string[];
  onPriorityChange: (value: string[]) => void;
  selectedDate?: Date | undefined;
  onDateChange?: (date: Date | undefined) => void;
  overdueOnly?: boolean;
  onOverdueOnlyChange?: (value: boolean) => void;
  reworkOnly?: boolean;
  onReworkOnlyChange?: (value: boolean) => void;
  onReset: () => void;
  activeCount: number;
};

export function WorkerFiltersPopover({
  selectedStatus,
  onStatusChange,
  statusCounts,
  selectedPriority,
  onPriorityChange,
  selectedDate,
  onDateChange,
  overdueOnly,
  onOverdueOnlyChange,
  reworkOnly,
  onReworkOnlyChange,
  onReset,
  activeCount,
}: WorkerFiltersPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (containerRef.current?.contains(target)) return;
      if (
        target.closest(
          '[data-slot="combobox-content"], [data-slot="popover-content"], [role="listbox"], [role="dialog"], [role="presentation"], [data-slot="select-content"], .rdp, .react-day-picker'
        )
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant={activeCount > 0 ? "default" : "outline"}
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="h-9 gap-2 text-xs font-semibold shrink-0 cursor-pointer"
      >
        <SlidersHorizontal className="size-4" strokeWidth={2} />
        <span>Фільтри</span>
        {activeCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.2 bg-background text-foreground text-[11px] font-bold border border-border">
            {activeCount}
          </span>
        )}
        {open ? (
          <ChevronUp className="size-3.5 opacity-70" strokeWidth={2} />
        ) : (
          <ChevronDown className="size-3.5 opacity-70" strokeWidth={2} />
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[min(calc(100vw-2rem),460px)] max-w-[calc(100vw-2rem)] bg-card border border-border shadow-xl p-4 space-y-4 rounded-none animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-foreground" strokeWidth={2} />
              <span className="text-xs font-semibold text-foreground">
                Фільтри завдань
              </span>
              {activeCount > 0 && (
                <Badge variant="secondary" className="text-[11px] px-1.5 py-0 font-normal">
                  Активно: {activeCount}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              title="Згорнути"
            >
              <X className="size-4" strokeWidth={2} />
            </Button>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Статус */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Статус завдання
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {WORKER_STATUS_OPTIONS.map((opt) => {
                  const active = selectedStatus === opt.id;
                  const count = statusCounts[opt.id] ?? 0;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onStatusChange(opt.id)}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-2 text-xs border rounded-none text-left cursor-pointer transition-colors",
                        active
                          ? "bg-primary text-primary-foreground font-semibold border-primary shadow-xs"
                          : "bg-muted/20 hover:bg-muted/50 text-foreground border-border/80"
                      )}
                    >
                      <span>{opt.label}</span>
                      <span
                        className={cn(
                          "ml-1 text-[10px] px-1 py-0 font-bold border",
                          active
                            ? "bg-primary-foreground/20 text-primary-foreground border-transparent"
                            : "bg-card text-muted-foreground border-border"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Пріоритет */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Пріоритет
              </label>
              <PriorityFilterSelect value={selectedPriority} onChange={onPriorityChange} />
            </div>

            {/* Дата */}
            {onDateChange && (
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Дата створення
                </label>
                <DatePicker
                  date={selectedDate}
                  setDate={onDateChange}
                  placeholder="Оберіть дату"
                />
              </div>
            )}

            {/* Додаткові прапорці */}
            <div className="space-y-2 pt-1 border-t border-border/50">
              {onOverdueOnlyChange && (
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                  <Checkbox
                    id="worker-popover-overdue"
                    checked={overdueOnly}
                    onCheckedChange={(v) => onOverdueOnlyChange(v === true)}
                  />
                  <span>Лише прострочені</span>
                </label>
              )}

              {onReworkOnlyChange && (
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                  <Checkbox
                    id="worker-popover-rework"
                    checked={reworkOnly}
                    onCheckedChange={(v) => onReworkOnlyChange(v === true)}
                  />
                  <span>Повторне опрацювання</span>
                </label>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={activeCount === 0}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2 cursor-pointer"
            >
              <RotateCcw className="size-3.5 mr-1" strokeWidth={2} />
              Скинути все
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold h-8 px-4 cursor-pointer"
            >
              <Check className="size-3.5 mr-1" strokeWidth={2} />
              Згорнути
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export type WorkerActiveFilterChipsProps = {
  selectedStatus: WorkerStatusFilter;
  onStatusChange: (status: WorkerStatusFilter) => void;
  selectedPriority: string[];
  onPriorityChange: (value: string[]) => void;
  selectedDate?: Date | undefined;
  onDateChange?: (date: Date | undefined) => void;
  overdueOnly?: boolean;
  onOverdueOnlyChange?: (value: boolean) => void;
  reworkOnly?: boolean;
  onReworkOnlyChange?: (value: boolean) => void;
  onResetAll: () => void;
};

export function WorkerActiveFilterChips({
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  selectedDate,
  onDateChange,
  overdueOnly,
  onOverdueOnlyChange,
  reworkOnly,
  onReworkOnlyChange,
  onResetAll,
}: WorkerActiveFilterChipsProps) {
  const hasActive =
    selectedStatus !== "all" ||
    selectedPriority.length > 0 ||
    !!selectedDate ||
    !!overdueOnly ||
    !!reworkOnly;

  if (!hasActive) return null;

  const currentStatusOption = WORKER_STATUS_OPTIONS.find((o) => o.id === selectedStatus);

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      {selectedStatus !== "all" && currentStatusOption && (
        <Badge
          variant="secondary"
          className="text-[11px] gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Статус:</span> {currentStatusOption.label}
          <button
            type="button"
            onClick={() => onStatusChange("all")}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}

      {selectedPriority.map((p) => (
        <Badge
          key={p}
          variant="secondary"
          className="text-[11px] gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Пріоритет:</span> {priorityLabel(p)}
          <button
            type="button"
            onClick={() => onPriorityChange(selectedPriority.filter((x) => x !== p))}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {selectedDate && onDateChange && (
        <Badge
          variant="secondary"
          className="text-[11px] gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Дата:</span> {formatDate(selectedDate.toISOString())}
          <button
            type="button"
            onClick={() => onDateChange(undefined)}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}

      {overdueOnly && onOverdueOnlyChange && (
        <Badge
          variant="secondary"
          className="text-[11px] gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20"
        >
          <span>Лише прострочені</span>
          <button
            type="button"
            onClick={() => onOverdueOnlyChange(false)}
            className="hover:text-foreground text-red-400 ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}

      {reworkOnly && onReworkOnlyChange && (
        <Badge
          variant="secondary"
          className="text-[11px] gap-1 px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
        >
          <span>Повторне опрацювання</span>
          <button
            type="button"
            onClick={() => onReworkOnlyChange(false)}
            className="hover:text-foreground text-red-600 dark:text-red-400 ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onResetAll}
        className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
      >
        Скинути всі
      </Button>
    </div>
  );
}
