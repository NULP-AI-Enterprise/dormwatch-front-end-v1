import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { roleLabel } from "@/lib/complaintUtils";
import type { Building, Place, Role } from "@/lib/types";

// Filter primitives for the admin residents page ("Мешканці"). Building is a
// plain single-select (the option set is tiny — one or two dorms); rooms are a
// searchable list with checkmarks inside a popover (dozens of rooms make a chip
// trigger grow unboundedly); role is a multi-select chip group (option count
// stays small).

type BuildingSingleFilterProps = {
  value: Building | null;
  onChange: (building: Building | null) => void;
  buildings: Building[];
};

// Plain Select — the option set is a fixed handful of buildings, so a
// type-to-search combobox is overkill.
export function BuildingSingleFilter({
  value,
  onChange,
  buildings,
}: BuildingSingleFilterProps) {
  return (
    <Select
      value={value ? String(value.building_id) : "all"}
      onValueChange={(v) => {
        if (v === "all") {
          onChange(null);
          return;
        }
        const next = buildings.find((b) => String(b.building_id) === v);
        onChange(next ?? null);
      }}
    >
      <SelectTrigger className="w-full h-8 text-xs">
        <SelectValue placeholder="Гуртожиток" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Усі гуртожитки</SelectItem>
        {buildings.map((b) => (
          <SelectItem key={b.building_id} value={String(b.building_id)}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type PlaceFilterSelectProps = {
  value: number[];
  onChange: (value: number[]) => void;
  places: Place[];
  disabled?: boolean;
};

// Searchable list with checkmarks inside a popover trigger. Dozens of rooms
// would make a chip trigger grow unboundedly; the popover button shows a count
// summary, and the panel is a scrollable list filterable by typed text.
export function PlaceFilterSelect({
  value,
  onChange,
  places,
  disabled = false,
}: PlaceFilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const labelFor = (id: number) =>
    places.find((p) => p.place_id === id)?.place_name ?? String(id);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return places;
    return places.filter((p) => p.place_name.toLowerCase().includes(q));
  }, [places, query]);

  const toggle = (id: number) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    );
  };

  const summary =
    value.length === 0
      ? "Усі кімнати"
      : value.length === 1
        ? labelFor(value[0])
        : `Обрано кімнат: ${value.length}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="w-full h-8 px-2.5 text-xs justify-between font-normal"
        >
          <span className="truncate">
            {disabled ? "Спершу оберіть гуртожиток" : summary}
          </span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className="size-4 text-muted-foreground"
            strokeWidth={2}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2 pointer-events-auto" align="start">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Пошук кімнати..."
          className="h-8 text-xs mb-2"
        />
        <div className="max-h-64 overflow-y-auto">
          {visible.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Кімнат не знайдено
            </p>
          ) : (
            visible.map((p) => {
              const id = p.place_id as number;
              const checked = value.includes(id);
              return (
                <label
                  key={id}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 cursor-pointer text-xs"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(id)}
                  />
                  <span className="truncate">{p.place_name}</span>
                </label>
              );
            })
          )}
        </div>
        {value.length > 0 && (
          <div className="border-t border-border pt-2 mt-2 flex justify-end">
            <Button variant="ghost" size="xs" onClick={() => onChange([])}>
              Скинути
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

type RoleFilterSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
  roles: Role[];
};

// Multi-select over role names via the shared combobox chips (parity with
// status/priority across the other list pages). Operates over `role_name` so
// the predicate stays roles.includes(u.role).
export function RoleFilterSelect({ value, onChange, roles }: RoleFilterSelectProps) {
  const names = roles.map((r) => r.role_name);
  return (
    <Combobox<string, true>
      multiple
      items={names}
      value={value}
      onValueChange={onChange}
      itemToStringLabel={roleLabel}
    >
      <ComboboxChips>
        <ComboboxValue>
          {(selected: string[]) =>
            selected.map((name) => (
              <ComboboxChip key={name} aria-label={roleLabel(name)}>
                {roleLabel(name)}
              </ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput placeholder={value.length ? "" : "Ролі..."} />
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>Нічого не знайдено</ComboboxEmpty>
        <ComboboxList>
          {(name: string) => (
            <ComboboxItem key={name} value={name}>
              {roleLabel(name)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
