import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { fetchResources, createResource, deleteResource, updateResource } from "@/services/problemsApi";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

interface ResourceCatalogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCatalogUpdated?: () => void;
}

export interface ResourceItem {
  resource_id: number;
  name: string;
  unit: string;
  unit_cost: number | string;
  description?: string;
}

export default function ResourceCatalogModal({
  open,
  onOpenChange,
  onCatalogUpdated,
}: ResourceCatalogModalProps) {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for creating new item
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("шт");
  const [unitCost, setUnitCost] = useState("");
  const [description, setDescription] = useState("");

  // Edit row states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editUnitCost, setEditUnitCost] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await fetchResources();
      setResources(data);
      if (onCatalogUpdated) onCatalogUpdated();
    } catch (e) {
      setError("Не вдалося завантажити каталог ресурсів");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadResources();
    }
  }, [open]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
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
      setIsAdding(false);
      loadResources();
    } catch (err: any) {
      setError("Не вдалося створити ресурс");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (item: ResourceItem) => {
    setEditingId(item.resource_id);
    setEditName(item.name);
    setEditUnit(item.unit);
    setEditUnitCost(String(item.unit_cost));
    setEditDescription(item.description || "");
  };

  const handleSaveRow = async (resId: number) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateResource(resId, {
        name: editName.trim(),
        unit: editUnit.trim() || "шт",
        unit_cost: parseFloat(editUnitCost) || 0,
        description: editDescription.trim(),
      });
      setEditingId(null);
      loadResources();
    } catch (err: any) {
      setError("Не вдалося зберегти зміни");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteResource(id);
      loadResources();
    } catch (err: any) {
      setError(err?.message || "Неможливо видалити ресурс, якщо він використовується у скаргах");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Каталог матеріалів та ресурсів</DialogTitle>
          <DialogDescription>
            Таблиця доступних матеріалів, одиниць виміру та базових цін для списання
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>
        )}

        <div className="flex justify-between items-center py-1">
          <span className="text-xs text-muted-foreground">Найменувань у каталозі: {resources.length}</span>
          {!isAdding && (
            <Button size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="size-4 mr-1" />
              Додати ресурс
            </Button>
          )}
        </div>

        {/* Add inline form */}
        {isAdding && (
          <form onSubmit={handleCreate} className="space-y-2 border p-3 rounded-md bg-muted/30">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold">Новий ресурс</span>
              <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIsAdding(false)}>
                Скасувати
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Input
                placeholder="Назва *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs col-span-2"
                required
              />
              <Input
                placeholder="Одиниця (шт, м)"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Ціна (₴)"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <Input
              placeholder="Опис / примітка"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-8 text-xs"
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button type="submit" size="sm" disabled={saving}>
                Зберегти
              </Button>
            </div>
          </form>
        )}

        {/* Catalog Table */}
        <div className="flex-1 overflow-y-auto min-h-[220px] border border-border rounded-md">
          {loading ? (
            <p className="text-xs text-center py-8 text-muted-foreground">Завантаження...</p>
          ) : resources.length === 0 ? (
            <p className="text-xs text-center py-8 text-muted-foreground">
              Каталог порожній. Додайте перші матеріали!
            </p>
          ) : (
            <Table className="text-left border-collapse">
              <TableHeader>
                <TableRow className="bg-muted/50 text-xs text-muted-foreground">
                  <TableHead className="w-14 px-3 py-2.5 font-semibold">ID</TableHead>
                  <TableHead className="px-3 py-2.5 font-semibold">Назва</TableHead>
                  <TableHead className="w-24 px-3 py-2.5 font-semibold">Одиниця</TableHead>
                  <TableHead className="w-28 px-3 py-2.5 font-semibold">Ціна (₴)</TableHead>
                  <TableHead className="px-3 py-2.5 font-semibold">Опис</TableHead>
                  <TableHead className="w-20 px-3 py-2.5 font-semibold text-right">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs divide-y divide-border">
                {resources.map((item) => {
                  const isEditingThis = editingId === item.resource_id;

                  return (
                    <TableRow key={item.resource_id} className="hover:bg-muted/30">
                      {/* Constant Non-editable ID */}
                      <TableCell className="px-3 py-2 text-muted-foreground font-mono">
                        #{item.resource_id}
                      </TableCell>

                      {/* Editable Name */}
                      <TableCell className="px-3 py-2">
                        {isEditingThis ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-7 text-xs"
                          />
                        ) : (
                          <span className="font-semibold text-foreground">{item.name}</span>
                        )}
                      </TableCell>

                      {/* Editable Unit */}
                      <TableCell className="px-3 py-2">
                        {isEditingThis ? (
                          <Input
                            value={editUnit}
                            onChange={(e) => setEditUnit(e.target.value)}
                            className="h-7 text-xs"
                          />
                        ) : (
                          <span className="text-muted-foreground">{item.unit}</span>
                        )}
                      </TableCell>

                      {/* Editable Cost */}
                      <TableCell className="px-3 py-2">
                        {isEditingThis ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editUnitCost}
                            onChange={(e) => setEditUnitCost(e.target.value)}
                            className="h-7 text-xs"
                          />
                        ) : (
                          <span className="font-bold text-foreground">{item.unit_cost} ₴</span>
                        )}
                      </TableCell>

                      {/* Editable Description */}
                      <TableCell className="px-3 py-2 text-muted-foreground">
                        {isEditingThis ? (
                          <Input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="h-7 text-xs"
                          />
                        ) : (
                          item.description || "—"
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-3 py-2 text-right">
                        {isEditingThis ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="size-6"
                              onClick={() => handleSaveRow(item.resource_id)}
                              disabled={saving}
                            >
                              <Check className="size-3.5" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="size-6"
                              onClick={() => setEditingId(null)}
                              disabled={saving}
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="size-6"
                              onClick={() => handleStartEdit(item)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="size-6 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(item.resource_id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
