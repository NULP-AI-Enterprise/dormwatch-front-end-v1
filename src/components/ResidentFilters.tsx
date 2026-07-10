import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
import { roleLabel } from "@/lib/complaintUtils";
import type { Building, Place, Role } from "@/lib/types";

// Filter primitives for the admin residents page ("Мешканці"). Kept in their
// own file per the acceptance criteria, but built from the exact same
// `ui/combobox` primitives as ComplaintFilters — no styling is added here, so
// the square/`text-xs` house style (DESIGN.md) is inherited identically.
//
// Building + place are a CASCADE: building is single-select and scopes the
// place multi-select. A room's `place_name` is only unique within a building
// (backend `unique_building_place_name`), so place is matched by `place_id`,
// never by name. Role is an independent multi-select.

type BuildingSingleFilterProps = {
  value: Building | null;
  onChange: (building: Building | null) => void;
  buildings: Building[];
};

// Single-select building filter (the cascade's root). Empty value = "all
// buildings". Uses the single-line ComboboxInput shape (like PlaceCombobox).
export function BuildingSingleFilter({
  value,
  onChange,
  buildings,
}: BuildingSingleFilterProps) {
  return (
    <Combobox<Building, false>
      items={buildings}
      value={value}
      onValueChange={onChange}
      itemToStringLabel={(b) => b.name}
      isItemEqualToValue={(a, b) => a.building_id === b.building_id}
    >
      <ComboboxInput placeholder="Гуртожиток..." showClear />
      <ComboboxContent>
        <ComboboxEmpty>Нічого не знайдено</ComboboxEmpty>
        <ComboboxList>
          {(b: Building) => (
            <ComboboxItem key={b.building_id} value={b}>
              {b.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

type PlaceFilterSelectProps = {
  value: number[];
  onChange: (value: number[]) => void;
  places: Place[];
  disabled?: boolean;
};

// Multi-select over rooms, keyed on `place_id` (not name — names repeat across
// buildings). `places` is the building-scoped, occupied-rooms-only list from
// the page; when no building is selected it is empty and the control disabled.
export function PlaceFilterSelect({
  value,
  onChange,
  places,
  disabled = false,
}: PlaceFilterSelectProps) {
  const labelFor = (id: number) =>
    places.find((p) => p.place_id === id)?.place_name ?? String(id);
  const ids = places.map((p) => p.place_id as number);
  return (
    <Combobox<number, true>
      multiple
      items={ids}
      value={value}
      onValueChange={onChange}
      itemToStringLabel={labelFor}
      disabled={disabled}
    >
      <ComboboxChips>
        <ComboboxValue>
          {(selected: number[]) =>
            selected.map((id) => (
              <ComboboxChip key={id} aria-label={labelFor(id)}>
                {labelFor(id)}
              </ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput
          placeholder={
            disabled
              ? "Спершу оберіть гуртожиток"
              : value.length
                ? ""
                : "Кімнати..."
          }
          disabled={disabled}
        />
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>Кімнат не знайдено</ComboboxEmpty>
        <ComboboxList>
          {(id: number) => (
            <ComboboxItem key={id} value={id}>
              {labelFor(id)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

type RoleFilterSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
  roles: Role[];
};

// Multi-select over role names (independent of the building/place cascade).
// Operates over `role_name` so the predicate stays roles.includes(u.role).
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
