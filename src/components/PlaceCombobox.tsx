import { useEffect, useMemo, useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddCircleIcon } from "@hugeicons/core-free-icons";
import { fetchPlaces, createPlace } from "@/services/problemsApi";
import type { Place } from "@/lib/types";

// The only behavioral wrapper around the styled `Combobox`: it owns the
// fetch-rooms-by-building + inline-create + emit-`place_id` logic that is
// identical across CreateReportPage, AuthPage, and the settings Кімнати flow.
// Styling lives entirely in `ui/combobox.tsx`; this file adds no classes.

type CreateSentinel = Place & { __create: true };

type PlaceComboboxProps = {
  buildingId?: number;
  value: Place | null;
  onChange: (place: Place) => void;
  allowCreate?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export function PlaceCombobox({
  buildingId,
  value,
  onChange,
  allowCreate = false,
  disabled = false,
  placeholder = "Пошук кімнати...",
}: PlaceComboboxProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!buildingId) {
      setPlaces([]);
      return;
    }
    let active = true;
    fetchPlaces(buildingId)
      .then((data) => {
        if (active) setPlaces(data);
      })
      .catch(() => {
        if (active) setPlaces([]);
      });
    return () => {
      active = false;
    };
  }, [buildingId]);

  const trimmed = query.trim();

  const filtered = useMemo(() => {
    const q = trimmed.toLowerCase();
    if (!q) return places;
    return places.filter((p) => p.place_name.toLowerCase().includes(q));
  }, [places, trimmed]);

  const showCreate =
    allowCreate &&
    !!buildingId &&
    trimmed.length > 0 &&
    !places.some((p) => p.place_name.toLowerCase() === trimmed.toLowerCase());

  // Include the create sentinel in `items` so keyboard navigation reaches it.
  const items: (Place | CreateSentinel)[] = useMemo(
    () =>
      showCreate
        ? [...filtered, { place_id: -1, place_name: trimmed, __create: true }]
        : filtered,
    [filtered, showCreate, trimmed],
  );

  const handleValueChange = async (selected: Place | null) => {
    if (!selected) return;
    if ((selected as CreateSentinel).__create) {
      if (!buildingId || creating) return;
      setCreating(true);
      try {
        const created = await createPlace(buildingId, selected.place_name);
        onChange(created);
      } catch (err) {
        console.warn("Failed to create place", err);
      } finally {
        setCreating(false);
      }
    } else {
      onChange(selected);
    }
  };

  return (
    <Combobox<Place, false>
      items={items}
      value={value}
      onValueChange={handleValueChange}
      onInputValueChange={setQuery}
      itemToStringLabel={(p) => p.place_name}
      isItemEqualToValue={(a, b) => a.place_id === b.place_id}
      filter={null}
      disabled={disabled || !buildingId}
    >
      <ComboboxInput placeholder={placeholder} disabled={disabled || !buildingId} />
      <ComboboxContent>
        <ComboboxEmpty>Кімнат не знайдено</ComboboxEmpty>
        <ComboboxList>
          {(item: Place | CreateSentinel) =>
            (item as CreateSentinel).__create ? (
              <ComboboxItem key="__create" value={item}>
                <HugeiconsIcon icon={AddCircleIcon} className="size-4" strokeWidth={2} />
                Створити «{item.place_name}»
              </ComboboxItem>
            ) : (
              <ComboboxItem key={item.place_id} value={item}>
                {item.place_name}
              </ComboboxItem>
            )
          }
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export default PlaceCombobox;
