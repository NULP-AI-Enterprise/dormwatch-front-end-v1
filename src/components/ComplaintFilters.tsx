import { FilterSheet } from "@/components/FilterSheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
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
import { Search, X } from "lucide-react";

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
        aria-label={placeholder}
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
        <ComboboxChipsInput aria-label={placeholder} placeholder={value.length ? "" : placeholder} />
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
        <ComboboxChipsInput aria-label="Усі категорії" placeholder={value.length ? "" : "Усі категорії"} />
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
  return <FilterSheet title="Фільтри звернень" activeCount={activeCount} onReset={onReset}>
    <div className="sm:col-span-2">
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
                  workers={workers}
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
    </div>
  </FilterSheet>;
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
          className="text-xs gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Статус:</span> {statusLabel(s)}
          <Button aria-label={"Прибрати статус: " + statusLabel(s)} variant="ghost" size="content"
            type="button"
            onClick={() => onStatusChange(selectedStatus.filter((x) => x !== s))}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </Button>
        </Badge>
      ))}

      {selectedBuilding.map((b) => (
        <Badge
          key={b}
          variant="secondary"
          className="text-xs gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Гуртожиток:</span> {b}
          <Button aria-label={"Прибрати гуртожиток: " + b} variant="ghost" size="content"
            type="button"
            onClick={() => onBuildingChange(selectedBuilding.filter((x) => x !== b))}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </Button>
        </Badge>
      ))}

      {selectedPriority.map((p) => (
        <Badge
          key={p}
          variant="secondary"
          className="text-xs gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Пріоритет:</span> {priorityLabel(p)}
          <Button aria-label={"Прибрати пріоритет: " + priorityLabel(p)} variant="ghost" size="content"
            type="button"
            onClick={() => onPriorityChange(selectedPriority.filter((x) => x !== p))}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </Button>
        </Badge>
      ))}

      {selectedCategories.map((c) => (
        <Badge
          key={c}
          variant="secondary"
          className="text-xs gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Категорія:</span> {c}
          <Button aria-label={"Прибрати категорію: " + c} variant="ghost" size="content"
            type="button"
            onClick={() => onCategoriesChange(selectedCategories.filter((x) => x !== c))}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </Button>
        </Badge>
      ))}

      {selectedWorkers &&
        selectedWorkers.map((w) => (
          <Badge
            key={w}
            variant="secondary"
            className="text-xs gap-1 px-2 py-0.5 bg-muted/60 border border-border"
          >
            <span className="text-muted-foreground">Виконавець:</span> {w}
            <Button aria-label={"Прибрати виконавця: " + w} variant="ghost" size="content"
              type="button"
              onClick={() => onWorkersChange?.(selectedWorkers.filter((x) => x !== w))}
              className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
            >
              <X className="size-3" />
            </Button>
          </Badge>
        ))}

      {selectedDate && onDateChange && (
        <Badge
          variant="secondary"
          className="text-xs gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Дата:</span> {formatDate(selectedDate.toISOString())}
          <Button aria-label="Прибрати дату подання" variant="ghost" size="content"
            type="button"
            onClick={() => onDateChange(undefined)}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </Button>
        </Badge>
      )}

      {selectedDeadline && onDeadlineChange && (
        <Badge
          variant="secondary"
          className="text-xs gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Дедлайн:</span> {formatDate(selectedDeadline.toISOString())}
          <Button aria-label="Прибрати дедлайн" variant="ghost" size="content"
            type="button"
            onClick={() => onDeadlineChange(undefined)}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </Button>
        </Badge>
      )}

      {overdueOnly && onOverdueOnlyChange && (
        <Badge
          variant="secondary"
          className="text-xs gap-1 px-2 py-0.5 bg-status-danger-bg text-status-danger border border-status-danger/40"
        >
          <span>Лише прострочені</span>
          <Button aria-label="Прибрати фільтр прострочених" variant="ghost" size="content"
            type="button"
            onClick={() => onOverdueOnlyChange(false)}
            className="hover:text-foreground text-status-danger ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </Button>
        </Badge>
      )}

      {reworkOnly && onReworkOnlyChange && (
        <Badge
          variant="secondary"
          className="text-xs gap-1 px-2 py-0.5 bg-status-danger-bg text-status-danger border border-status-danger/40"
        >
          <span>Повторне опрацювання</span>
          <Button aria-label="Прибрати фільтр повторних" variant="ghost" size="content"
            type="button"
            onClick={() => onReworkOnlyChange(false)}
            className="hover:text-foreground text-status-danger ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </Button>
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onResetAll}
        className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
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
  sortByUrgency?: boolean;
  onSortByUrgencyChange?: (value: boolean) => void;
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
  sortByUrgency,
  onSortByUrgencyChange,
  onReset,
  activeCount,
}: WorkerFiltersPopoverProps) {
  return <FilterSheet title="Фільтри завдань" activeCount={activeCount} onReset={onReset}>
    <div className="sm:col-span-2">
          <div className="space-y-3.5 text-xs">
            {/* Статус */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Статус завдання
              </label>
              <ToggleGroup type="single" value={selectedStatus} onValueChange={(value) => { if (value) onStatusChange(value as WorkerStatusFilter); }}
                aria-label="Статус завдання" variant="outline" className="grid w-full grid-cols-2 sm:grid-cols-3 gap-1.5">
                {WORKER_STATUS_OPTIONS.map((option) => <ToggleGroupItem key={option.id} value={option.id} className="min-w-0 whitespace-normal">
                  {option.label} ({statusCounts[option.id] ?? 0})
                </ToggleGroupItem>)}
              </ToggleGroup>
            </div>

            {/* Пріоритет */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Пріоритет
              </label>
              <PriorityFilterSelect value={selectedPriority} onChange={onPriorityChange} />
            </div>

            {/* Дата призначення */}
            {onDateChange && (
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Дата призначення
                </label>
                <DatePicker
                  date={selectedDate}
                  setDate={onDateChange}
                  placeholder="Оберіть дату призначення"
                />
              </div>
            )}

            {/* Тумблер сортування за терміновістю */}
            {onSortByUrgencyChange && (
              <div
                className="flex items-center justify-between gap-3 py-2 px-3 bg-muted/30 border border-border/80 hover:border-primary/40 transition-colors cursor-pointer select-none"
              >
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Сортувати термінові
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    Найтерміновіші до вирішення завдання зверху
                  </span>
                </div>
                <Switch aria-label="Сортувати за терміновістю" checked={!!sortByUrgency}
                  onCheckedChange={onSortByUrgencyChange} />
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
    </div>
  </FilterSheet>;
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
  sortByUrgency?: boolean;
  onSortByUrgencyChange?: (value: boolean) => void;
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
  sortByUrgency,
  onSortByUrgencyChange,
  onResetAll,
}: WorkerActiveFilterChipsProps) {
  const hasActive =
    selectedStatus !== "all" ||
    selectedPriority.length > 0 ||
    !!selectedDate ||
    !!overdueOnly ||
    !!reworkOnly ||
    !!sortByUrgency;

  if (!hasActive) return null;

  const currentStatusOption = WORKER_STATUS_OPTIONS.find((o) => o.id === selectedStatus);

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      {selectedStatus !== "all" && currentStatusOption && (
        <Badge
          variant="secondary"
          className="text-xs gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Статус:</span> {currentStatusOption.label}
          <Button aria-label={"Прибрати статус: " + currentStatusOption.label} variant="ghost" size="content"
            type="button"
            onClick={() => onStatusChange("all")}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </Button>
        </Badge>
      )}

      {selectedPriority.map((p) => (
        <Badge
          key={p}
          variant="secondary"
          className="text-xs gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Пріоритет:</span> {priorityLabel(p)}
          <Button aria-label={"Прибрати пріоритет: " + priorityLabel(p)} variant="ghost" size="content"
            type="button"
            onClick={() => onPriorityChange(selectedPriority.filter((x) => x !== p))}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </Button>
        </Badge>
      ))}

      {selectedDate && onDateChange && (
        <Badge
          variant="secondary"
          className="text-xs gap-1 px-2 py-0.5 bg-muted/60 border border-border"
        >
          <span className="text-muted-foreground">Дата призначення:</span> {formatDate(selectedDate.toISOString())}
          <Button aria-label="Прибрати дату призначення" variant="ghost" size="content"
            type="button"
            onClick={() => onDateChange(undefined)}
            className="hover:text-foreground text-muted-foreground ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </Button>
        </Badge>
      )}

      {sortByUrgency && onSortByUrgencyChange && (
        <Badge
          variant="secondary"
          className="text-xs gap-1 px-2 py-0.5 bg-primary/10 text-link border border-primary/25"
        >
          <span>Сортувати термінові</span>
          <Button aria-label="Скасувати сортування за терміновістю" variant="ghost" size="content"
            type="button"
            onClick={() => onSortByUrgencyChange(false)}
            className="hover:text-foreground text-link ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </Button>
        </Badge>
      )}

      {overdueOnly && onOverdueOnlyChange && (
        <Badge
          variant="secondary"
          className="text-xs gap-1 px-2 py-0.5 bg-status-danger-bg text-status-danger border border-status-danger/40"
        >
          <span>Лише прострочені</span>
          <Button aria-label="Прибрати фільтр прострочених" variant="ghost" size="content"
            type="button"
            onClick={() => onOverdueOnlyChange(false)}
            className="hover:text-foreground text-status-danger ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </Button>
        </Badge>
      )}

      {reworkOnly && onReworkOnlyChange && (
        <Badge
          variant="secondary"
          className="text-xs gap-1 px-2 py-0.5 bg-status-danger-bg text-status-danger border border-status-danger/40"
        >
          <span>Повторне опрацювання</span>
          <Button aria-label="Прибрати фільтр повторних" variant="ghost" size="content"
            type="button"
            onClick={() => onReworkOnlyChange(false)}
            className="hover:text-foreground text-status-danger ml-0.5 cursor-pointer"
          >
            <X className="size-3" />
          </Button>
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onResetAll}
        className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
      >
        Скинути всі
      </Button>
    </div>
  );
}
