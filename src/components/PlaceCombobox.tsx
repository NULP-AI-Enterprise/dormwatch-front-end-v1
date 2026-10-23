import { useEffect, useMemo, useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import { fetchPlaces, createPlace } from "@/services/problemsApi";
import type { Place } from "@/lib/types";

// The only behavioral wrapper around the styled `Combobox`: it owns the
// fetch-rooms-by-building + inline-create + emit-`place_id` logic that is
// identical across CreateReportPage, AuthPage, and the settings Кімнати flow.
// Visual controls are composed from the shared primitives.

type CreateSentinel = Place & { __create: true };

type PlaceComboboxProps = {
  id?: string;
  buildingId?: number;
  value: Place | null;
  onChange: (place: Place) => void;
  allowCreate?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export function PlaceCombobox({
  id,
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
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [createError, setCreateError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setPlaces([]);
    setLoadError(false);
    setCreateError(false);
    if (!buildingId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchPlaces(buildingId, true)
      .then((data) => {
        if (active) setPlaces(data);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [buildingId, reloadKey]);

  const trimmed = query.trim();

  const filtered = useMemo(() => {
    const q = trimmed.toLowerCase();
    if (!q) return places;
    return places.filter((p) => p.place_name.toLowerCase().includes(q));
  }, [places, trimmed]);

  const showCreate =
    allowCreate &&
    !loading &&
    !loadError &&
    !!buildingId &&
    trimmed.length > 0 &&
    !places.some((p) => p.place_name.toLowerCase() === trimmed.toLowerCase());

  // Include the create sentinel in `items` so keyboard navigation reaches it.
  const items: (Place | CreateSentinel)[] = useMemo(
    () =>
      showCreate
        ? [
            ...filtered,
            { place_id: -1, place_name: trimmed, capacity: 0, isShared: false, __create: true },
          ]
        : filtered,
    [filtered, showCreate, trimmed],
  );

  const handleValueChange = async (selected: Place | null) => {
    if (!selected) return;
    if ((selected as CreateSentinel).__create) {
      if (!buildingId || creating) return;
      setCreating(true);
      setCreateError(false);
      try {
        const created = await createPlace(buildingId, selected.place_name);
        setPlaces((current) => [...current, created]);
        onChange(created);
      } catch (err) {
        console.warn("Failed to create place", err);
        setCreateError(true);
      } finally {
        setCreating(false);
      }
    } else {
      onChange(selected);
    }
  };

  return (
    <>
    <Combobox<Place, false>
      items={items}
      value={value}
      onValueChange={handleValueChange}
      inputValue={query}
      onInputValueChange={(next, details) => {
        // Closing the list must not discard a room name entered for creation
        // or an in-progress retry. Explicit typing/clearing remains available.
        if ((allowCreate || loadError || createError || creating) &&
            details.reason === "input-clear") {
          details.cancel();
          return;
        }
        setQuery(next);
      }}
      itemToStringLabel={(p) => p.place_name}
      isItemEqualToValue={(a, b) => a.place_id === b.place_id}
      filter={null}
      disabled={disabled || !buildingId || creating}
    >
      <ComboboxInput id={id} aria-label={id ? undefined : "Кімната або зона"} placeholder={placeholder} disabled={disabled || !buildingId || creating} />
      <ComboboxContent>
        <ComboboxEmpty>{loading ? "Завантаження кімнат…" : loadError ? "Не вдалося завантажити кімнати" : "Кімнат не знайдено"}</ComboboxEmpty>
        <ComboboxList>
          {(item: Place | CreateSentinel) =>
            (item as CreateSentinel).__create ? (
              <ComboboxItem key="__create" value={item}>
                <CirclePlus className="size-4" strokeWidth={2} />
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
    {loadError && (
      <div role="alert" className="space-y-2">
        <p className="text-sm text-destructive">Не вдалося завантажити кімнати.</p>
        <Button type="button" variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>Спробувати ще раз</Button>
      </div>
    )}
    {createError && <p role="alert" className="text-sm text-destructive">Не вдалося створити кімнату. Оберіть «Створити» ще раз, щоб повторити спробу.</p>}
    </>
  );
}

export default PlaceCombobox;
