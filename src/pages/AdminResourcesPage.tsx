import { useEffect, useState } from "react";
import {
  fetchResources,
  createResource,
  updateResource,
  deleteResource,
  fetchResourceReport,
  apiErrorText,
} from "@/services/problemsApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
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
import { Pencil, Trash2, Check, X, Coins } from "lucide-react";

const PERIOD_OPTIONS = [
  { key: "day", label: "Сьогодні" },
  { key: "week", label: "Цей тиждень" },
  { key: "month", label: "Цей місяць" },
  { key: "year", label: "Цей рік" },
  { key: "all", label: "За весь час" },
];

const AdminResourcesPage = () => {
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
      console.warn("Failed to load resources page data", err);
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

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="flex-1 p-6 space-y-6">
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
    </div>
  );
};

export default AdminResourcesPage;
