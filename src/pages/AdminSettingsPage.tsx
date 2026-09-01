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
  unlinkWorker,
} from "@/services/problemsApi";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit02Icon,
  Delete02Icon,
  Tick02Icon,
  Cancel01Icon,
  Building03Icon,
  DoorIcon,
  Wrench01Icon,
  Add01Icon,
  UserAdd01Icon,
  Copy01Icon,
  MailSend01Icon,
  QrCode01Icon,
} from "@hugeicons/core-free-icons";
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
      <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
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
              <EmptyState icon={DoorIcon} title="Кімнат ще немає" />
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

   // Account unlinking: sever the Worker→account bond. The live link check on
   // the worker endpoints then 403s at the next request instead of letting the
   // old refresh cookie ride for up to 7 days (call #21).
   const [unlinking, setUnlinking] = useState<Worker | null>(null);
   const [unlinkingBusy, setUnlinkingBusy] = useState(false);

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
      let msg = "Не вдалося створити запрошення";
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message) as { detail?: string };
          if (parsed?.detail) msg = String(parsed.detail);
        } catch {
          // keep the fallback message
        }
      }
      setInviteError(msg);
    } finally {
      setInviting(false);
    }
  };

   const confirmUnlink = async () => {
     if (!unlinking) return;
     setUnlinkingBusy(true);
     try {
       await unlinkWorker(unlinking.worker_id);
       await load();
       setUnlinking(null);
     } catch (err) {
       console.warn("Failed to unlink worker", err);
     } finally {
       setUnlinkingBusy(false);
     }
   };

   const inviteUrl = inviteToken
    ? `${window.location.origin}/auth?tab=register&invite=${inviteToken}`
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
            <Label className="text-xs">Компанія</Label>
            <Input
              placeholder="Напр. АкваСервіс"
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
          <EmptyState icon={Wrench01Icon} title="Працівників ще немає" />
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
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="secondary" className="shrink-0">
                      має доступ до панелі
                    </Badge>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setUnlinking(w)}
                      aria-label="Відкликати доступ"
                      className="text-destructive hover:text-destructive"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openProvision(w)}
                    className="gap-1.5 shrink-0"
                  >
                    <HugeiconsIcon icon={UserAdd01Icon} data-icon="inline-start" />
                    Надати доступ
                  </Button>
                )}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => openEdit(w)}
                  aria-label="Редагувати"
                >
                  <HugeiconsIcon icon={Edit02Icon} className="size-4" strokeWidth={2} />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setPending(w)}
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
              <Label className="text-xs">Компанія</Label>
              <Input
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
                    <HugeiconsIcon icon={Copy01Icon} data-icon="inline-start" />
                    {copied ? "Скопійовано" : "Копіювати"}
                  </Button>
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <a
                      href={`mailto:?subject=${encodeURIComponent("Запрошення до DormWatch")}&body=${encodeURIComponent(`Вітаємо! Посилання для створення вашого облікового запису DormWatch:\n\n${inviteUrl}\n\nЗапрошення одноразове. Перейдіть за ним, вкажіть свою електронну пошту та пароль, потім підтвердіть пошту кодом із листа.`)}`}
                    >
                      <HugeiconsIcon icon={MailSend01Icon} data-icon="inline-start" />
                      Надіслати листом
                    </a>
                  </Button>
                </div>
                <Button asChild size="sm" className="gap-1.5">
                  <Link to={`/admin/workers/invite/print?token=${inviteToken}&name=${encodeURIComponent(provisioning?.full_name ?? "")}`}>
                    <HugeiconsIcon icon={QrCode01Icon} data-icon="inline-start" />
                    Роздрукувати QR
                  </Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Unlink dialog: sever the account bond — worker endpoints 403 next request */}
      <AlertDialog open={!!unlinking} onOpenChange={(o) => !o && setUnlinking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Відкликати доступ — {unlinking?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Працівник втратить доступ до панелі — при наступному запиті йому
              буде відмовлено. Обліковий запис залишиться, доступ можна
              відновити новим запрошенням.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unlinkingBusy}>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={unlinkingBusy}
              onClick={(e) => {
                e.preventDefault();
                confirmUnlink();
              }}
            >
              Відкликати
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default AdminSettingsPage;
