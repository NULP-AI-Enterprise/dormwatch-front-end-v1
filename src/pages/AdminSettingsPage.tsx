import { useEffect, useMemo, useState } from "react";
import {
  fetchBuildings,
  fetchPlaces,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  createPlace,
  updatePlace,
  deletePlace,
  fetchWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
  fetchRoles,
  createWorkerInvite,
  apiErrorText,
  fetchResources,
  createResource,
  updateResource,
  deleteResource,
  fetchResourceReport,
} from "@/services/problemsApi";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Dot } from "@/components/ComplaintCard";
import { Pencil, Trash2, Check, X, Building2, DoorOpen, Wrench, Plus, UserPlus, Copy, Send, QrCode, Coins } from "lucide-react";
import { useAdminHeaderActions } from "@/components/AdminHeaderContext";
import { InviteLinkDialog } from "@/components/InviteLinkDialog";
import { Link } from "react-router-dom";
import type { Building, Place, Role, Worker } from "@/lib/types";

// Admin reference-data management: Categories, Buildings, Rooms. Deletes are
// non-destructive by construction on the backend — categories/rooms detach
// from complaints (SET_NULL); buildings block (409) while they still hold
// rooms. Each destructive action is gated behind an AlertDialog that states
// the consequence.

const AdminSettingsPage = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  useEffect(() => {
    fetchRoles().then(setRoles).catch(() => {});
  }, []);

  const headerActions = useMemo(() => (
    <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
      <Plus className="size-4" strokeWidth={2} />
      Запросити користувача
    </Button>
  ), []);

  useAdminHeaderActions(headerActions);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="flex-1 p-6">
        <Tabs defaultValue="buildings" className="flex flex-col">
          <TabsList variant="line" className="mb-6">
            <TabsTrigger value="buildings" className="text-xs font-semibold">
              Гуртожитки
            </TabsTrigger>
            <TabsTrigger value="rooms" className="text-xs font-semibold">
              Кімнати
            </TabsTrigger>
            <TabsTrigger value="workers" className="text-xs font-semibold">
              Працівники
            </TabsTrigger>
            <TabsTrigger value="resources" className="text-xs font-semibold">
              Ресурси
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buildings">
            <BuildingsTab />
          </TabsContent>
          <TabsContent value="rooms">
            <RoomsTab />
          </TabsContent>
          <TabsContent value="workers">
            <WorkersTab />
          </TabsContent>
          <TabsContent value="resources">
            <ResourcesTab />
          </TabsContent>
        </Tabs>
      </div>

      <InviteLinkDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        roles={roles}
      />
    </div>
  );
};



// ── Buildings tab ──────────────────────────────────────────────────────
function BuildingsTab() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [commandantPhone, setCommandantPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");

  const [editing, setEditing] = useState<Building | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCommandantPhone, setEditCommandantPhone] = useState("");
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
      });
      setName("");
      setAddress("");
      setCommandantPhone("");
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
  };

  const commitEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      await updateBuilding(editing.building_id, {
        name: editName.trim(),
        address: editAddress.trim(),
        commandantPhone: editCommandantPhone.trim(),
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
          <p className="text-xs font-normal text-muted-foreground">Екстрені контакти</p>
          <div className="space-y-1">
            <Label className="text-xs">Комендант</Label>
            <Input
              placeholder="Напр. 032 123 45 67"
              value={commandantPhone}
              onChange={(e) => setCommandantPhone(e.target.value)}
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
          <EmptyState icon={Building2} title="Гуртожитків ще немає" />
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
                  <Pencil className="size-4" strokeWidth={2} />
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
                  <Trash2 className="size-4" strokeWidth={2} />
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
            <p className="text-xs font-normal text-muted-foreground">Екстрені контакти</p>
            <div className="space-y-1">
              <Label className="text-xs">Комендант</Label>
              <Input
                placeholder="Напр. 032 123 45 67"
                value={editCommandantPhone}
                onChange={(e) => setEditCommandantPhone(e.target.value)}
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

// ── Room add form: name + capacity + shared checkbox ───────────────────
// A room is either a residence (capacity > 0) or a shared space (kitchen/
// laundry/common). When "shared" is checked the capacity input is hidden,
// because a shared room is a complaint location only, never a residence.
function RoomInlineAdd({
  onAdd,
}: {
  onAdd: (value: { name: string; capacity: number; isShared: boolean }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError("");
    try {
      await onAdd({
        name: trimmed,
        capacity: isShared ? 0 : Number(capacity) || 0,
        isShared,
      });
      setName("");
      setCapacity("");
      setIsShared(false);
    } catch (err) {
      setError("Не вдалося додати");
      console.warn("Failed to add room", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          placeholder="Номер кімнати..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="h-8 text-xs"
        />
        {!isShared && (
          <Input
            type="number"
            min={0}
            placeholder="Місць"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            className="h-8 w-24 text-xs"
          />
        )}
        <Button onClick={submit} disabled={saving || !name.trim()}>
          Додати
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="room-add-shared"
          checked={isShared}
          onCheckedChange={(c) => setIsShared(c === true)}
        />
        <Label htmlFor="room-add-shared" className="text-xs font-normal text-muted-foreground">
          Спільна кімната (кухня, пральня, місця спільного користування)
        </Label>
      </div>
      {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
    </div>
  );
}

// ── Room row: inline rename + capacity/shared edit + occupancy display ──
function RoomEditableRow({
  place,
  onSave,
  onDelete,
}: {
  place: Place;
  onSave: (next: { name: string; capacity: number; isShared: boolean }) => Promise<void>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(place.place_name);
  const [capacity, setCapacity] = useState(String(place.capacity ?? 0));
  const [isShared, setIsShared] = useState(place.isShared);
  const [saving, setSaving] = useState(false);

  const start = () => {
    setName(place.place_name);
    setCapacity(String(place.capacity ?? 0));
    setIsShared(place.isShared);
    setEditing(true);
  };

  const commit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: trimmed,
        capacity: isShared ? 0 : Number(capacity) || 0,
        isShared,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-2 py-2">
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            placeholder="Номер кімнати..."
            className="h-8 text-xs"
          />
          {!isShared && (
            <Input
              type="number"
              min={0}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setEditing(false);
              }}
              placeholder="Місць"
              className="h-8 w-24 text-xs"
            />
          )}
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={commit}
            disabled={saving}
            aria-label="Зберегти"
          >
            <Check className="size-4" strokeWidth={2} />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setEditing(false)}
            disabled={saving}
            aria-label="Скасувати"
          >
            <X className="size-4" strokeWidth={2} />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`room-shared-${place.place_id}`}
            checked={isShared}
            onCheckedChange={(c) => setIsShared(c === true)}
          />
          <Label
            htmlFor={`room-shared-${place.place_id}`}
            className="text-xs font-normal text-muted-foreground"
          >
            Спільна кімната (кухня, пральня, місця спільного користування)
          </Label>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-2">
      <span className="flex-1 text-sm text-foreground truncate">{place.place_name}</span>
      {place.isShared ? (
        <Badge variant="secondary">Спільна</Badge>
      ) : (
        <span className="text-xs font-normal text-muted-foreground">
          {place.occupancy ?? 0} / {place.capacity ?? 0}
        </span>
      )}
      <Button size="icon-sm" variant="ghost" onClick={start} aria-label="Редагувати">
        <Pencil className="size-4" strokeWidth={2} />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={onDelete}
        aria-label="Видалити"
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="size-4" strokeWidth={2} />
      </Button>
    </div>
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
            <RoomInlineAdd
              onAdd={async ({ name, capacity, isShared }) => {
                await createPlace(building.building_id, name, { capacity, isShared });
                await loadPlaces(building.building_id);
              }}
            />
            <Separator className="my-2" dashed />

            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : places.length === 0 ? (
              <EmptyState icon={DoorOpen} title="Кімнат ще немає" />
            ) : (
              <div className="divide-y divide-border">
                {places.map((p) => (
                  <RoomEditableRow
                    key={p.place_id}
                    place={p}
                    onSave={async ({ name, capacity, isShared }) => {
                      await updatePlace(p.place_id, name, { capacity, isShared });
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
            icon={DoorOpen}
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

// ── Workers tab ────────────────────────────────────────────────────────
// External contractors assignable to complaints. A worker may hold a
// provisioned account (single-use invite link / printed QR; the worker
// supplies their own email at redemption) — `has_account` shows that state,
// the invite dialog mints the token. Delete is non-destructive to complaints
// — the backend SET_NULLs the assignment.
function WorkersTab() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");

  const [editing, setEditing] = useState<Worker | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [pending, setPending] = useState<Worker | null>(null);
  const [deleting, setDeleting] = useState(false);

   // Account provisioning: one dialog per worker — mint the token, then hand
   // over the redemption link by email or printed QR.
  const [provisioning, setProvisioning] = useState<Worker | null>(null);
  const [inviteToken, setInviteToken] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchWorkers();
    setWorkers(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!fullName.trim()) return;
    setSaving(true);
    setAddError("");
    try {
      await createWorker({ full_name: fullName.trim(), company: company.trim(), phone: phone.trim() });
      setFullName("");
      setCompany("");
      setPhone("");
      await load();
    } catch (err) {
      setAddError("Не вдалося додати працівника");
      console.warn("Failed to add worker", err);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (w: Worker) => {
    setEditing(w);
    setEditFullName(w.full_name);
    setEditCompany(w.company ?? "");
    setEditPhone(w.phone ?? "");
  };

  const commitEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      await updateWorker(editing.worker_id, {
        full_name: editFullName.trim(),
        company: editCompany.trim(),
        phone: editPhone.trim(),
      });
      setEditing(null);
      await load();
    } catch (err) {
      console.warn("Failed to update worker", err);
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await deleteWorker(pending.worker_id);
      await load();
      setPending(null);
    } catch (err) {
      console.warn("Failed to delete worker", err);
    } finally {
      setDeleting(false);
    }
  };

  const openProvision = (w: Worker) => {
    setProvisioning(w);
    setInviteToken("");
    setInviteError("");
    setCopied(false);
  };

  const mintInvite = async () => {
    if (!provisioning) return;
    setInviting(true);
    setInviteError("");
    try {
      const data = await createWorkerInvite(provisioning.worker_id);
      setInviteToken(data.invite_token);
    } catch (err) {
      setInviteError(apiErrorText(err, "Не вдалося створити запрошення"));
    } finally {
      setInviting(false);
    }
  };

   const inviteUrl = inviteToken
    ? `${window.location.origin}/auth?tab=register&invite=${inviteToken}&role=worker`
    : "";

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch (err) {
      console.warn("Failed to copy invite link", err);
    }
  };

  return (
    <Card className="border-border shadow-none bg-card">
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Ім'я</Label>
            <Input
              placeholder="Напр. Іван Петренко"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Спеціалізація</Label>
            <Input
              placeholder="Напр. Слюсар"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Телефон</Label>
            <Input
              placeholder="Напр. 067 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <Button onClick={add} disabled={saving || !fullName.trim()}>
            Додати працівника
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
        ) : workers.length === 0 ? (
          <EmptyState icon={Wrench} title="Працівників ще немає" />
        ) : (
          <div className="divide-y divide-border">
            {workers.map((w) => (
              <div key={w.worker_id} className="flex items-center gap-2 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{w.full_name}</p>
                  {(w.company || w.phone) && (
                    <p className="text-xs text-muted-foreground truncate">
                      {w.company}
                      {w.company && w.phone && <Dot />}
                      {w.phone}
                    </p>
                  )}
                </div>
                {w.has_account ? (
                  <Badge variant="secondary" className="shrink-0">
                    має доступ до панелі
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openProvision(w)}
                    className="gap-1.5 shrink-0"
                  >
                    <UserPlus data-icon="inline-start" strokeWidth={1.5} />
                    Надати доступ
                  </Button>
                )}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => openEdit(w)}
                  aria-label="Редагувати"
                >
                  <Pencil className="size-4" strokeWidth={2} />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setPending(w)}
                  aria-label="Видалити"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" strokeWidth={2} />
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
            <AlertDialogTitle>Редагувати працівника</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2 text-left">
            <div className="space-y-1">
              <Label className="text-xs">Ім'я</Label>
              <Input
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Спеціалізація</Label>
              <Input
                placeholder="Напр. Слюсар"
                value={editCompany}
                onChange={(e) => setEditCompany(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Телефон</Label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingEdit}>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              disabled={savingEdit || !editFullName.trim()}
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
            <AlertDialogTitle>Видалити працівника «{pending?.full_name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Наявні тікети залишаться, але стануть непризначеними. Цю дію не можна скасувати.
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

      {/* Provisioning dialog: invite link + printed QR, never a set password */}
      <Dialog open={!!provisioning} onOpenChange={(o) => { if (!o) { setProvisioning(null); if (inviteToken) load(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Надати доступ — {provisioning?.full_name}</DialogTitle>
            <DialogDescription>
              Створіть одноразове запрошення: працівник відкриє посилання або
              відсканує QR і самостійно вкаже свою електронну пошту та пароль.
            </DialogDescription>
          </DialogHeader>

          {!inviteToken ? (
            <>
              {inviteError && (
                <p className="text-xs font-semibold text-destructive">{inviteError}</p>
              )}
              <DialogFooter>
                <Button onClick={mintInvite} disabled={inviting}>
                  {inviting ? "Створення..." : "Створити запрошення"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-xs">Посилання для реєстрації</Label>
                <Input readOnly value={inviteUrl} className="h-8 text-xs" onFocus={(e) => e.target.select()} />
                <p className="text-xs text-muted-foreground">
                  Запрошення одноразове й не має строку давності.
                </p>
              </div>
              <DialogFooter className="flex-row sm:justify-between sm:flex-wrap gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={copyInvite} className="gap-1.5">
                    <Copy data-icon="inline-start" strokeWidth={1.5} />
                    {copied ? "Скопійовано" : "Копіювати"}
                  </Button>
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <a
                      href={`mailto:?subject=${encodeURIComponent("Запрошення до DormWatch")}&body=${encodeURIComponent(`Вітаємо! Посилання для створення вашого облікового запису DormWatch:\n\n${inviteUrl}\n\nЗапрошення одноразове. Перейдіть за ним, вкажіть свою електронну пошту та пароль, потім підтвердіть пошту кодом із листа.`)}`}
                    >
                      <Send data-icon="inline-start" strokeWidth={1.5} />
                      Надіслати листом
                    </a>
                  </Button>
                </div>
                <Button asChild size="sm" className="gap-1.5">
                  <Link to={`/admin/workers/invite/print?token=${inviteToken}&name=${encodeURIComponent(provisioning?.full_name ?? "")}`}>
                    <QrCode data-icon="inline-start" strokeWidth={1.5} />
                    Роздрукувати QR
                  </Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Resources & Materials Tab ──────────────────────────────────────────────
function ResourcesTab() {
  const [resources, setResources] = useState<any[]>([]);
  const [period, setPeriod] = useState<string>("all");
  const [report, setReport] = useState<{
    total_cost: number;
    total_items_logged: number;
    resource_summary: any[];
    recent_logs: any[];
  }>({
    total_cost: 0,
    total_items_logged: 0,
    resource_summary: [],
    recent_logs: [],
  });
  const [loading, setLoading] = useState(true);

  // Form states for creating new resource
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("шт");
  const [unitCost, setUnitCost] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");

  // Edit states for inline row edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editUnitCost, setEditUnitCost] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete state
  const [pending, setPending] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [resList, rep] = await Promise.all([
        fetchResources(),
        fetchResourceReport({ period }),
      ]);
      setResources(resList || []);
      setReport(rep || { total_cost: 0, total_items_logged: 0, resource_summary: [], recent_logs: [] });
    } catch (err) {
      console.warn("Failed to load resources tab data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [period]);

  const add = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setAddError("");
    try {
      await createResource({
        name: name.trim(),
        unit: unit.trim() || "шт",
        unit_cost: parseFloat(unitCost) || 0,
        description: description.trim(),
      });
      setName("");
      setUnit("шт");
      setUnitCost("");
      setDescription("");
      await load();
    } catch (err: any) {
      setAddError(apiErrorText(err, "Не вдалося додати ресурс"));
    } finally {
      setSaving(false);
    }
  };

  const startEditRow = (res: any) => {
    setEditingId(res.resource_id);
    setEditName(res.name);
    setEditUnit(res.unit);
    setEditUnitCost(String(res.unit_cost));
    setEditDescription(res.description || "");
  };

  const saveEditRow = async (resId: number) => {
    if (!editName.trim()) return;
    setSavingEdit(true);
    try {
      await updateResource(resId, {
        name: editName.trim(),
        unit: editUnit.trim() || "шт",
        unit_cost: parseFloat(editUnitCost) || 0,
        description: editDescription.trim(),
      });
      setEditingId(null);
      await load();
    } catch (err) {
      console.warn("Failed to update resource", err);
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await deleteResource(pending.resource_id);
      await load();
      setPending(null);
    } catch (err) {
      console.warn("Failed to delete resource", err);
    } finally {
      setDeleting(false);
    }
  };

  const PERIOD_OPTIONS = [
    { key: "day", label: "Сьогодні" },
    { key: "week", label: "Цей тиждень" },
    { key: "month", label: "Цей місяць" },
    { key: "year", label: "Цей рік" },
    { key: "all", label: "За весь час" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Expenditure Analytics & Period Reports */}
      <Card className="border-border shadow-none bg-card">
        <CardContent className="p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Coins className="size-5 text-primary" />
                Звіт витрат на ремонтні роботи
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Статистика використаних матеріалів та фінансових витрат за обраний період
              </p>
            </div>

            {/* Time Period Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-muted/50 p-1 rounded-lg border border-border">
              {PERIOD_OPTIONS.map((p) => (
                <Button
                  key={p.key}
                  variant={period === p.key ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-3 rounded-md"
                  onClick={() => setPeriod(p.key)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 flex flex-col justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Загальні витрати</p>
              <p className="text-2xl font-bold text-primary mt-2">
                {Number(report.total_cost).toFixed(2)} ₴
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border flex flex-col justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Загалом списань матеріалів</p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {report.total_items_logged} шт
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border flex flex-col justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Унікальних найменувань використано</p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {report.resource_summary.length}
              </p>
            </div>
          </div>

          <Separator className="my-2" dashed />

          {/* Aggregated Materials Used Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Використані матеріали за період ({PERIOD_OPTIONS.find((p) => p.key === period)?.label})
            </h4>
            {report.resource_summary.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                За обраний період матеріали не списувалися.
              </p>
            ) : (
              <div className="border border-border overflow-hidden rounded-md">
                <Table className="text-left border-collapse">
                  <TableHeader>
                    <TableRow className="bg-muted/50 text-xs text-muted-foreground">
                      <TableHead className="px-4 py-2.5 font-semibold">Матеріал / Ресурс</TableHead>
                      <TableHead className="px-4 py-2.5 font-semibold">Одиниця</TableHead>
                      <TableHead className="px-4 py-2.5 font-semibold text-right">Використана кількість</TableHead>
                      <TableHead className="px-4 py-2.5 font-semibold text-right">Сумарні витрати (₴)</TableHead>
                      <TableHead className="px-4 py-2.5 font-semibold text-center">Кількість списань</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs divide-y divide-border">
                    {report.resource_summary.map((item) => (
                      <TableRow key={item.resource_id} className="hover:bg-muted/30">
                        <TableCell className="px-4 py-2.5 font-semibold text-foreground">
                          {item.name}
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-muted-foreground">
                          {item.unit}
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-right font-medium text-foreground">
                          {item.total_quantity} {item.unit}
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-right font-bold text-primary">
                          {item.total_cost.toFixed(2)} ₴
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-center text-muted-foreground">
                          {item.count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Catalog Management Table */}
      <Card className="border-border shadow-none bg-card">
        <CardContent className="p-6 space-y-5">
          <h3 className="text-base font-bold text-foreground">Каталог ресурсів та матеріалів</h3>

          {/* Add Resource Form */}
          <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border">
            <h4 className="text-xs font-semibold text-foreground">Додати новий матеріал у каталог</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs">Назва ресурсу *</Label>
                <Input
                  placeholder="Напр. Лампочка LED 10W"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Одиниця виміру</Label>
                <Input
                  placeholder="шт, м, кг, год"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Базова ціна за од. (₴)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Примітка / Опис</Label>
              <Input
                placeholder="Додаткові характеристики..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <Button onClick={add} disabled={saving || !name.trim()} size="sm">
              Додати в каталог
            </Button>
            {addError && <p className="text-xs font-semibold text-destructive">{addError}</p>}
          </div>

          <Separator className="my-2" dashed />

          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : resources.length === 0 ? (
            <EmptyState icon={Coins} title="Каталог матеріалів порожній" />
          ) : (
            <div className="border border-border rounded-md overflow-hidden">
              <Table className="text-left border-collapse">
                <TableHeader>
                  <TableRow className="bg-muted/50 text-xs text-muted-foreground">
                    <TableHead className="w-16 px-4 py-3 font-semibold">ID</TableHead>
                    <TableHead className="px-4 py-3 font-semibold">Назва матеріалу</TableHead>
                    <TableHead className="w-28 px-4 py-3 font-semibold">Одиниця</TableHead>
                    <TableHead className="w-36 px-4 py-3 font-semibold">Базова ціна (₴)</TableHead>
                    <TableHead className="px-4 py-3 font-semibold">Опис</TableHead>
                    <TableHead className="w-24 px-4 py-3 font-semibold text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs divide-y divide-border">
                  {resources.map((res) => {
                    const isEditingThis = editingId === res.resource_id;

                    return (
                      <TableRow key={res.resource_id} className="hover:bg-muted/30">
                        {/* Constant/Non-editable ID */}
                        <TableCell className="px-4 py-3 text-muted-foreground font-mono">
                          #{res.resource_id}
                        </TableCell>

                        {/* Editable Name */}
                        <TableCell className="px-4 py-3">
                          {isEditingThis ? (
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8 text-xs"
                            />
                          ) : (
                            <span className="font-semibold text-foreground">{res.name}</span>
                          )}
                        </TableCell>

                        {/* Editable Unit */}
                        <TableCell className="px-4 py-3">
                          {isEditingThis ? (
                            <Input
                              value={editUnit}
                              onChange={(e) => setEditUnit(e.target.value)}
                              className="h-8 text-xs"
                            />
                          ) : (
                            <span className="text-muted-foreground">{res.unit}</span>
                          )}
                        </TableCell>

                        {/* Editable Unit Cost */}
                        <TableCell className="px-4 py-3">
                          {isEditingThis ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editUnitCost}
                              onChange={(e) => setEditUnitCost(e.target.value)}
                              className="h-8 text-xs"
                            />
                          ) : (
                            <span className="font-bold text-foreground">{res.unit_cost} ₴</span>
                          )}
                        </TableCell>

                        {/* Editable Description */}
                        <TableCell className="px-4 py-3 text-muted-foreground">
                          {isEditingThis ? (
                            <Input
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="h-8 text-xs"
                            />
                          ) : (
                            res.description || "—"
                          )}
                        </TableCell>

                        {/* Action buttons */}
                        <TableCell className="px-4 py-3 text-right">
                          {isEditingThis ? (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => saveEditRow(res.resource_id)}
                                disabled={savingEdit}
                                aria-label="Зберегти"
                              >
                                <Check className="size-4" strokeWidth={2} />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => setEditingId(null)}
                                disabled={savingEdit}
                                aria-label="Скасувати"
                              >
                                <X className="size-4" strokeWidth={2} />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => startEditRow(res)}
                                aria-label="Редагувати"
                              >
                                <Pencil className="size-4" strokeWidth={2} />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => setPending(res)}
                                aria-label="Видалити"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="size-4" strokeWidth={2} />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Delete dialog */}
        <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Видалити ресурс «{pending?.name}»?</AlertDialogTitle>
              <AlertDialogDescription>
                Якщо цей ресурс уже списано на скарги, його видалення буде заблоковане для збереження історії.
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
    </div>
  );
}

export default AdminSettingsPage;
