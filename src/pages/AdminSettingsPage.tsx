import { useEffect, useMemo, useState } from "react";
import {
  fetchCategories,
  fetchBuildings,
  fetchPlaces,
  createCategory,
  updateCategory,
  deleteCategory,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  createPlace,
  updatePlace,
  deletePlace,
} from "@/services/problemsApi";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit02Icon,
  Delete02Icon,
  Tick02Icon,
  Cancel01Icon,
  Layers01Icon,
  Building03Icon,
  DoorIcon,
} from "@hugeicons/core-free-icons";
import type { Building, CategoryOption, Place } from "@/lib/types";

// Admin reference-data management: Categories, Buildings, Rooms. Deletes are
// non-destructive by construction on the backend — categories/rooms detach
// from complaints (SET_NULL); buildings block (409) while they still hold
// rooms. Each destructive action is gated behind an AlertDialog that states
// the consequence.

const AdminSettingsPage = () => {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="flex-1 p-6">
        <Tabs defaultValue="categories" className="flex flex-col">
          <TabsList variant="line" className="mb-6">
            <TabsTrigger value="categories" className="text-xs font-semibold">
              Категорії
            </TabsTrigger>
            <TabsTrigger value="buildings" className="text-xs font-semibold">
              Гуртожитки
            </TabsTrigger>
            <TabsTrigger value="rooms" className="text-xs font-semibold">
              Кімнати
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <CategoriesTab />
          </TabsContent>
          <TabsContent value="buildings">
            <BuildingsTab />
          </TabsContent>
          <TabsContent value="rooms">
            <RoomsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// ── Reusable editable row ──────────────────────────────────────────────
// Displays a label with inline rename (pencil → input + confirm/cancel) and a
// delete button. Rename commits on Enter or the check button.

type EditableRowProps = {
  label: string;
  onRename: (next: string) => Promise<void> | void;
  onDelete: () => void;
  renamePlaceholder?: string;
};

function EditableRow({ label, onRename, onDelete, renamePlaceholder }: EditableRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const [saving, setSaving] = useState(false);

  const start = () => {
    setDraft(label);
    setEditing(true);
  };

  const commit = async () => {
    const next = draft.trim();
    if (!next || next === label) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onRename(next);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 py-2">
      {editing ? (
        <>
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            placeholder={renamePlaceholder}
            className="h-8 text-xs"
          />
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={commit}
            disabled={saving}
            aria-label="Зберегти"
          >
            <HugeiconsIcon icon={Tick02Icon} className="size-4" strokeWidth={2} />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setEditing(false)}
            disabled={saving}
            aria-label="Скасувати"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm text-foreground truncate">{label}</span>
          <Button size="icon-sm" variant="ghost" onClick={start} aria-label="Редагувати">
            <HugeiconsIcon icon={Edit02Icon} className="size-4" strokeWidth={2} />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onDelete}
            aria-label="Видалити"
            className="text-destructive hover:text-destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} />
          </Button>
        </>
      )}
    </div>
  );
}

// ── Inline add form: single free-text field + button ───────────────────
function InlineAdd({
  placeholder,
  buttonLabel = "Додати",
  onAdd,
}: {
  placeholder: string;
  buttonLabel?: string;
  onAdd: (value: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const name = value.trim();
    if (!name) return;
    setSaving(true);
    setError("");
    try {
      await onAdd(name);
      setValue("");
    } catch (err) {
      setError("Не вдалося додати");
      console.warn("Failed to add", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="h-8 text-xs"
        />
        <Button onClick={submit} disabled={saving || !value.trim()}>
          {buttonLabel}
        </Button>
      </div>
      {error && <p className="text-xs font-semibold text-destructive mt-2">{error}</p>}
    </div>
  );
}

// ── Categories tab ─────────────────────────────────────────────────────
function CategoriesTab() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<CategoryOption | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchCategories();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await deleteCategory(pending.category_id);
      await load();
      setPending(null);
    } catch (err) {
      console.warn("Failed to delete category", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border-border shadow-none bg-card">
      <CardContent className="space-y-4">
        <InlineAdd
          placeholder="Назва категорії..."
          onAdd={async (name) => {
            await createCategory(name);
            await load();
          }}
        />
        <Separator className="my-2" dashed />
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : categories.length === 0 ? (
          <EmptyState icon={Layers01Icon} title="Категорій ще немає" />
        ) : (
          <div className="divide-y divide-border">
            {categories.map((cat) => (
              <EditableRow
                key={cat.category_id}
                label={cat.name}
                renamePlaceholder="Назва категорії..."
                onRename={async (next) => {
                  await updateCategory(cat.category_id, next);
                  await load();
                }}
                onDelete={() => setPending(cat)}
              />
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити категорію «{pending?.name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Звернення з цією категорією не будуть видалені — вони залишаться без
              категорії.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ── Buildings tab ──────────────────────────────────────────────────────
function BuildingsTab() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [commandantPhone, setCommandantPhone] = useState("");
  const [dutyMasterPhone, setDutyMasterPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");

  const [editing, setEditing] = useState<Building | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCommandantPhone, setEditCommandantPhone] = useState("");
  const [editDutyMasterPhone, setEditDutyMasterPhone] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [pending, setPending] = useState<Building | null>(null);
  const [blockedCount, setBlockedCount] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchBuildings();
    setBuildings(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!name.trim() || !address.trim()) return;
    setSaving(true);
    setAddError("");
    try {
      await createBuilding(name.trim(), address.trim(), {
        commandantPhone: commandantPhone.trim(),
        dutyMasterPhone: dutyMasterPhone.trim(),
      });
      setName("");
      setAddress("");
      setCommandantPhone("");
      setDutyMasterPhone("");
      await load();
    } catch (err) {
      setAddError("Не вдалося додати гуртожиток");
      console.warn("Failed to add building", err);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (b: Building) => {
    setEditing(b);
    setEditName(b.name);
    setEditAddress(b.address ?? "");
    setEditCommandantPhone(b.commandant_phone ?? "");
    setEditDutyMasterPhone(b.duty_master_phone ?? "");
  };

  const commitEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      await updateBuilding(editing.building_id, {
        name: editName.trim(),
        address: editAddress.trim(),
        commandantPhone: editCommandantPhone.trim(),
        dutyMasterPhone: editDutyMasterPhone.trim(),
      });
      setEditing(null);
      await load();
    } catch (err) {
      console.warn("Failed to update building", err);
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await deleteBuilding(pending.building_id);
      await load();
      setPending(null);
    } catch (err) {
      // 409: building still has rooms — surface the count.
      try {
        const body = JSON.parse((err as Error).message);
        setBlockedCount(body.places_count ?? 0);
      } catch {
        console.warn("Failed to delete building", err);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border-border shadow-none bg-card">
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Назва</Label>
            <Input
              placeholder="Напр. Гуртожиток №4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Адреса</Label>
            <Input
              placeholder="вул. Прикладна, 1"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <Separator className="my-1" dashed />
          <p className="text-xs font-semibold text-muted-foreground">Екстрені контакти</p>
          <div className="space-y-1">
            <Label className="text-xs">Комендант</Label>
            <Input
              placeholder="Напр. 032 123 45 67"
              value={commandantPhone}
              onChange={(e) => setCommandantPhone(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Черговий майстер</Label>
            <Input
              placeholder="Напр. 067 987 65 43"
              value={dutyMasterPhone}
              onChange={(e) => setDutyMasterPhone(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <Button onClick={add} disabled={saving || !name.trim() || !address.trim()}>
            Додати гуртожиток
          </Button>
          {addError && (
            <p className="text-xs font-semibold text-destructive">{addError}</p>
          )}
        </div>

        <Separator className="my-2" dashed />

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : buildings.length === 0 ? (
          <EmptyState icon={Building03Icon} title="Гуртожитків ще немає" />
        ) : (
          <div className="divide-y divide-border">
            {buildings.map((b) => (
              <div key={b.building_id} className="flex items-center gap-2 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{b.name}</p>
                  {b.address && (
                    <p className="text-xs text-muted-foreground truncate">{b.address}</p>
                  )}
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => openEdit(b)}
                  aria-label="Редагувати"
                >
                  <HugeiconsIcon icon={Edit02Icon} className="size-4" strokeWidth={2} />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => {
                    setBlockedCount(null);
                    setPending(b);
                  }}
                  aria-label="Видалити"
                  className="text-destructive hover:text-destructive"
                >
                  <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit dialog */}
      <AlertDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Редагувати гуртожиток</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2 text-left">
            <div className="space-y-1">
              <Label className="text-xs">Назва</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Адреса</Label>
              <Input
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <Separator className="my-1" dashed />
            <p className="text-xs font-semibold text-muted-foreground">Екстрені контакти</p>
            <div className="space-y-1">
              <Label className="text-xs">Комендант</Label>
              <Input
                placeholder="Напр. 032 123 45 67"
                value={editCommandantPhone}
                onChange={(e) => setEditCommandantPhone(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Черговий майстер</Label>
              <Input
                placeholder="Напр. 067 987 65 43"
                value={editDutyMasterPhone}
                onChange={(e) => setEditDutyMasterPhone(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingEdit}>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              disabled={savingEdit || !editName.trim() || !editAddress.trim()}
              onClick={(e) => {
                e.preventDefault();
                commitEdit();
              }}
            >
              Зберегти
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити гуртожиток «{pending?.name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              {blockedCount !== null
                ? `Спочатку видаліть кімнати (${blockedCount}) у цьому гуртожитку.`
                : "Цю дію не можна скасувати."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {blockedCount !== null ? "Закрити" : "Скасувати"}
            </AlertDialogCancel>
            {blockedCount === null && (
              <AlertDialogAction
                variant="destructive"
                disabled={deleting}
                onClick={(e) => {
                  e.preventDefault();
                  confirmDelete();
                }}
              >
                Видалити
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ── Rooms tab ──────────────────────────────────────────────────────────
function RoomsTab() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [building, setBuilding] = useState<Building | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  const [pending, setPending] = useState<Place | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchBuildings().then(setBuildings).catch(() => {});
  }, []);

  const loadPlaces = async (buildingId: number) => {
    setLoading(true);
    const data = await fetchPlaces(buildingId);
    setPlaces(data);
    setLoading(false);
  };

  useEffect(() => {
    if (building) loadPlaces(building.building_id);
    else setPlaces([]);
  }, [building]);

  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await deletePlace(pending.place_id);
      if (building) await loadPlaces(building.building_id);
      setPending(null);
    } catch (err) {
      console.warn("Failed to delete place", err);
    } finally {
      setDeleting(false);
    }
  };

  const buildingItems = useMemo(() => buildings, [buildings]);

  return (
    <Card className="border-border shadow-none bg-card">
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs">Гуртожиток</Label>
          <Combobox<Building, false>
            items={buildingItems}
            value={building}
            onValueChange={(b) => setBuilding(b)}
            itemToStringLabel={(b) => b.name}
            isItemEqualToValue={(a, b) => a.building_id === b.building_id}
          >
            <ComboboxInput placeholder="Оберіть гуртожиток..." />
            <ComboboxContent>
              <ComboboxEmpty>Гуртожитків не знайдено</ComboboxEmpty>
              <ComboboxList>
                {(b: Building) => (
                  <ComboboxItem key={b.building_id} value={b}>
                    {b.name}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        {building && (
          <>
            <Separator className="my-2" dashed />
            <InlineAdd
              placeholder="Номер кімнати..."
              onAdd={async (placeName) => {
                await createPlace(building.building_id, placeName);
                await loadPlaces(building.building_id);
              }}
            />
            <Separator className="my-2" dashed />

            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : places.length === 0 ? (
              <EmptyState icon={DoorIcon} title="Кімнат ще немає" />
            ) : (
              <div className="divide-y divide-border">
                {places.map((p) => (
                  <EditableRow
                    key={p.place_id}
                    label={p.place_name}
                    renamePlaceholder="Номер кімнати..."
                    onRename={async (next) => {
                      await updatePlace(p.place_id, next);
                      await loadPlaces(building.building_id);
                    }}
                    onDelete={() => setPending(p)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!building && (
          <EmptyState
            icon={DoorIcon}
            title="Оберіть гуртожиток"
            subtitle="Виберіть гуртожиток, щоб керувати його кімнатами."
          />
        )}
      </CardContent>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити кімнату «{pending?.place_name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Звернення, привʼязані до цієї кімнати, не будуть видалені — вони
              залишаться без кімнати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default AdminSettingsPage;
