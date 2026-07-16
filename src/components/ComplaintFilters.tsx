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
import { PRIORITY_OPTIONS, priorityLabel, statusLabel } from "@/lib/complaintUtils";
import type { Building, CategoryOption } from "@/lib/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { SearchIcon } from "@hugeicons/core-free-icons";

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
      <HugeiconsIcon
        icon={SearchIcon}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground"
        strokeWidth={2}
      />
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
// STATUS/PRIORITY label for those). Chips render square (DESIGN.md) via
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

const STATUS_CODES = ["pending", "approved", "rejected", "resolved"];

// `codes` lets a page restrict the option set to statuses it can actually
// return — the public dashboard only surfaces approved/resolved, so offering
// pending/rejected there would just yield empty results. Defaults to all four
// for the admin panel.
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
      placeholder="Статус..."
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
      placeholder="Пріоритети..."
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
      placeholder="Гуртожитки..."
    />
  );
}

type CategoryFilterComboboxProps = {
  value: string[];
  onChange: (value: string[]) => void;
  categories: CategoryOption[];
};

// Multi-select category filter: an empty selection means "all". Chips render
// square (DESIGN.md) — styling is inherited from `ui/combobox.tsx`. Operates
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
        <ComboboxChipsInput placeholder={value.length ? "" : "Категорії..."} />
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
