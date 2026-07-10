import { useEffect, useMemo, useState } from "react";
import { fetchUsers, fetchRoles, updateUser } from "@/services/problemsApi";
import { useBuildings } from "@/hooks/useBuildings";
import { useUser } from "@/context/UserContext";
import { FilterSearchInput } from "@/components/ComplaintFilters";
import {
  BuildingSingleFilter,
  PlaceFilterSelect,
  RoleFilterSelect,
} from "@/components/ResidentFilters";
import { roleLabel } from "@/lib/complaintUtils";
import { PlaceCombobox } from "@/components/PlaceCombobox";
import UserAvatar from "@/components/UserAvatar";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit02Icon, UserMultipleIcon } from "@hugeicons/core-free-icons";
import type { Building, Place, Role } from "@/lib/types";

// A user profile as returned by GET /admin/users/ (UserSerializer): building /
// place / role are nested read objects, any of which may be null.
type ResidentUser = {
  user: number;
  first_name: string;
  last_name: string;
  email: string;
  photo_url?: string | null;
  building: Building | null;
  place: (Place & { building?: Building }) | null;
  role: Role | null;
};

const fullName = (u: ResidentUser) =>
  `${u.first_name} ${u.last_name}`.trim() || u.email;

const AdminResidentsPage = () => {
  const { user: currentUser } = useUser();
  const buildings = useBuildings();

  const [users, setUsers] = useState<ResidentUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ResidentUser | null>(null);

  // Filters. Building + place are a cascade (building single-select scopes the
  // place multi-select); role is independent. Empty selection = "all".
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const init = async () => {
    const data = (await fetchUsers()) as ResidentUser[];
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    init();
    fetchRoles().then(setRoles).catch(() => {});
  }, []);

  // Place options for the filter: occupied rooms only, scoped to the selected
  // building (matched on the user's first-class `building`). Deduped by place_id.
  const placeOptions = useMemo<Place[]>(() => {
    if (!selectedBuilding) return [];
    const seen = new Map<number, Place>();
    for (const u of users) {
      if (u.building?.building_id !== selectedBuilding.building_id) continue;
      if (u.place?.place_id != null && !seen.has(u.place.place_id)) {
        seen.set(u.place.place_id, {
          place_id: u.place.place_id,
          place_name: u.place.place_name,
        });
      }
    }
    return [...seen.values()].sort((a, b) =>
      a.place_name.localeCompare(b.place_name)
    );
  }, [users, selectedBuilding]);

  // Cascade: resetting the building clears any room selection so a stale room
  // from the previous building can't linger.
  const handleBuildingChange = (b: Building | null) => {
    setSelectedBuilding(b);
    setSelectedPlaces([]);
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (q && !fullName(u).toLowerCase().includes(q) &&
          !u.email.toLowerCase().includes(q)) {
        return false;
      }
      if (selectedBuilding &&
          u.building?.building_id !== selectedBuilding.building_id) {
        return false;
      }
      if (selectedPlaces.length > 0 &&
          !(u.place?.place_id != null && selectedPlaces.includes(u.place.place_id))) {
        return false;
      }
      if (selectedRoles.length > 0 &&
          !(u.role && selectedRoles.includes(u.role.role_name))) {
        return false;
      }
      return true;
    });
  }, [users, searchQuery, selectedBuilding, selectedPlaces, selectedRoles]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="p-6">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filter sidebar — same shell as AdminComplaintsPage */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-border shadow-none bg-card">
              <CardContent>
                <div className="mb-4">
                  <FilterSearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Пошук мешканців..."
                  />
                </div>

                <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                  Гуртожиток
                </h4>
                <BuildingSingleFilter
                  value={selectedBuilding}
                  onChange={handleBuildingChange}
                  buildings={buildings}
                />

                <Separator className="my-4" />

                <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                  Кімната
                </h4>
                <PlaceFilterSelect
                  value={selectedPlaces}
                  onChange={setSelectedPlaces}
                  places={placeOptions}
                  disabled={!selectedBuilding}
                />

                <Separator className="my-4" />

                <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                  Роль
                </h4>
                <RoleFilterSelect
                  value={selectedRoles}
                  onChange={setSelectedRoles}
                  roles={roles}
                />
              </CardContent>
            </Card>
          </div>

          {/* Residents table */}
          <div className="lg:col-span-3 space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="md" />
              </div>
            )}

            {!loading && filteredUsers.length === 0 && (
              <EmptyState
                icon={UserMultipleIcon}
                title="Мешканців не знайдено"
                subtitle="Жоден мешканець не відповідає поточним фільтрам."
              />
            )}

            {!loading && filteredUsers.length > 0 && (
              <div className="bg-card border border-border overflow-hidden">
                <Table className="text-left border-collapse">
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-b border-border text-sm text-muted-foreground">
                      <TableHead className="px-6 py-3 font-semibold">Мешканець</TableHead>
                      <TableHead className="px-6 py-3 font-semibold">Гуртожиток</TableHead>
                      <TableHead className="px-6 py-3 font-semibold">Кімната</TableHead>
                      <TableHead className="px-6 py-3 font-semibold">Роль</TableHead>
                      <TableHead className="px-6 py-3 font-semibold text-right">Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {filteredUsers.map((u) => (
                      <TableRow key={u.user} className="bg-card hover:bg-muted/50 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={u} size="sm" />
                            <div>
                              <p className="font-semibold text-foreground">{fullName(u)}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-muted-foreground">
                          {u.building?.name ?? "—"}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-muted-foreground">
                          {u.place?.place_name ?? "—"}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {u.role ? (
                            <Badge variant="secondary">{roleLabel(u.role.role_name)}</Badge>
                          ) : (
                            <span className="text-muted-foreground">{"—"}</span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Редагувати ${fullName(u)}`}
                            onClick={() => setEditing(u)}
                          >
                            <HugeiconsIcon icon={Edit02Icon} className="size-4" strokeWidth={2} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      <EditResidentDialog
        editing={editing}
        onClose={() => setEditing(null)}
        buildings={buildings}
        roles={roles}
        isSelf={!!editing && editing.user === currentUser?.user}
        onSaved={init}
      />
    </div>
  );
};

export default AdminResidentsPage;

type EditResidentDialogProps = {
  editing: ResidentUser | null;
  onClose: () => void;
  buildings: Building[];
  roles: Role[];
  isSelf: boolean;
  onSaved: () => Promise<void> | void;
};

// Per-resident edit dialog: change dorm building, room (create-or-pick via
// PlaceCombobox), and role. The role Select is disabled on your own account —
// the backend also blocks self role changes (no self-demotion).
function EditResidentDialog({
  editing,
  onClose,
  buildings,
  roles,
  isSelf,
  onSaved,
}: EditResidentDialogProps) {
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Seed local state each time a different user opens the dialog.
  useEffect(() => {
    if (!editing) return;
    setBuildingId(editing.building?.building_id ?? null);
    setPlace(
      editing.place?.place_id != null
        ? { place_id: editing.place.place_id, place_name: editing.place.place_name }
        : null
    );
    setRoleId(editing.role?.role_id ?? null);
  }, [editing]);

  const handleBuildingChange = (v: string) => {
    setBuildingId(Number(v));
    // Room belongs to a building; changing building invalidates the old room.
    setPlace(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const fields: {
        building_id?: number | null;
        place_id?: number | null;
        role_id?: number | null;
      } = {
        building_id: buildingId,
        place_id: place?.place_id ?? null,
      };
      // Never send role_id for your own account — the server would 400 it.
      if (!isSelf) fields.role_id = roleId;
      await updateUser(editing.user, fields);
      await onSaved();
    } catch (e) {
      console.warn("Failed to update user", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!editing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? `Редагувати ${fullName(editing)}` : "Редагувати мешканця"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-left">
          <div className="space-y-1">
            <Label className="text-xs">Гуртожиток</Label>
            <Select
              value={buildingId != null ? String(buildingId) : undefined}
              onValueChange={handleBuildingChange}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Оберіть гуртожиток" />
              </SelectTrigger>
              <SelectContent>
                {buildings.map((b) => (
                  <SelectItem key={b.building_id} value={String(b.building_id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Кімната</Label>
            <PlaceCombobox
              buildingId={buildingId ?? undefined}
              value={place}
              onChange={setPlace}
              allowCreate
              placeholder="Пошук або створення кімнати..."
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Роль</Label>
            <Select
              value={roleId != null ? String(roleId) : undefined}
              onValueChange={(v) => setRoleId(Number(v))}
              disabled={isSelf}
            >
              {/* DESIGN.md §5 Inputs mandates a disabled fill (`dark:disabled:bg-input/80`),
                  which Input/Combobox honor but SelectTrigger omits. Add it here so the
                  disabled role field matches the disabled room Combobox beside it. */}
              <SelectTrigger className="w-full h-8 text-xs disabled:bg-input/50 dark:disabled:bg-input/80">
                <SelectValue placeholder="Оберіть роль" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.role_id} value={String(r.role_id)}>
                    {roleLabel(r.role_name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isSelf && (
              <p className="text-xs text-muted-foreground">
                Ви не можете змінити власну роль.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Скасувати
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            Зберегти
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
