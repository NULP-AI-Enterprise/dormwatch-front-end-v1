import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { fetchResources, createResource, updateResource, deleteResource, apiErrorText } from "@/services/problemsApi";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

export interface ResourceItem {
  resource_id: number;
  name: string;
  unit: string;
  unit_cost: number | string;
  description?: string;
}
type Draft = { name: string; unit: string; unit_cost: string; description: string };
const blankDraft = (): Draft => ({ name: "", unit: "шт", unit_cost: "", description: "" });
const fields = [
  { key: "name", label: "Назва ресурсу" },
  { key: "unit", label: "Одиниця виміру" },
  { key: "unit_cost", label: "Ціна за одиницю (₴)" },
  { key: "description", label: "Опис (необов’язково)" },
] as const;

function ResourceField({ field, draft, onChange, prefix, disabled, compact = false }: {
  field: typeof fields[number]; draft: Draft; onChange: (draft: Draft) => void;
  prefix: string; disabled: boolean; compact?: boolean;
}) {
  const id = prefix + "-" + field.key;
  return <div className="min-w-0 space-y-1.5">
    <Label htmlFor={id} className={compact ? "sr-only" : undefined}>{field.label}</Label>
    <Input id={id} value={draft[field.key]} disabled={disabled}
      type={field.key === "unit_cost" ? "number" : "text"}
      min={field.key === "unit_cost" ? "0" : undefined}
      step={field.key === "unit_cost" ? "0.01" : undefined}
      required={field.key === "name" || field.key === "unit"}
      onChange={(event) => onChange({ ...draft, [field.key]: event.target.value })}
    />
  </div>;
}

export function ResourceCatalogEditor({ onUpdated }: { onUpdated?: () => void }) {
  const id = useId();
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(blankDraft);
  const [pendingDelete, setPendingDelete] = useState<ResourceItem | null>(null);

  const load = async () => {
    setLoading(true); setLoadError("");
    try { setItems(await fetchResources()); }
    catch (err) { setLoadError(apiErrorText(err, "Не вдалося завантажити каталог.")); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (value: Draft, resourceId?: number) => {
    const cost = value.unit_cost.trim() === "" ? 0 : Number(value.unit_cost);
    if (!value.name.trim() || !value.unit.trim() || !Number.isFinite(cost) || cost < 0) {
      setError("Вкажіть назву, одиницю виміру та невід’ємну ціну.");
      return;
    }
    setSaving(true); setError("");
    const payload = { name: value.name.trim(), unit: value.unit.trim(), unit_cost: cost, description: value.description.trim() };
    try {
      if (resourceId == null) { await createResource(payload); setDraft(blankDraft()); setAdding(false); }
      else { await updateResource(resourceId, payload); setEditingId(null); }
      await load(); onUpdated?.();
    } catch (err) { setError(apiErrorText(err, "Не вдалося зберегти ресурс.")); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!pendingDelete) return;
    setSaving(true); setError("");
    try { await deleteResource(pendingDelete.resource_id); setPendingDelete(null); await load(); onUpdated?.(); }
    catch (err) { setError(apiErrorText(err, "Не вдалося видалити ресурс.")); }
    finally { setSaving(false); }
  };

  return <div className="min-w-0 space-y-4">
    <div className="flex flex-wrap justify-between items-center gap-2">
      <span className="text-xs text-muted-foreground">Найменувань у каталозі: {items.length}</span>
      {!adding && <Button onClick={() => { setAdding(true); setError(""); }}><Plus className="size-4" />Додати ресурс</Button>}
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {adding && <form className="space-y-3 border border-border p-3" onSubmit={(event) => { event.preventDefault(); save(draft); }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{fields.map((field) =>
        <ResourceField key={field.key} field={field} draft={draft} onChange={setDraft} prefix={id + "-new"} disabled={saving} />
      )}</div>
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={saving}>{saving ? "Збереження…" : "Зберегти ресурс"}</Button><Button type="button" variant="outline" disabled={saving} onClick={() => setAdding(false)}>Скасувати</Button></div>
    </form>}
    {loading ? <p role="status" className="text-sm text-muted-foreground">Завантаження каталогу…</p> :
      loadError ? <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{loadError}</p><Button variant="outline" onClick={load}>Спробувати ще раз</Button></div> :
      items.length === 0 ? <p className="text-sm text-muted-foreground">Каталог порожній. Додайте перший ресурс.</p> :
      <div className="max-w-full overflow-x-auto border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead>{fields.map((field) => <TableHead key={field.key}>{field.label}</TableHead>)}<TableHead>Дії</TableHead></TableRow></TableHeader>
          <TableBody>{items.map((item) => <TableRow key={item.resource_id}>
            <TableCell>#{item.resource_id}</TableCell>
            {fields.map((field) => <TableCell key={field.key}>{editingId === item.resource_id
              ? <ResourceField compact field={field} draft={editDraft} onChange={setEditDraft} prefix={id + "-edit"} disabled={saving} />
              : field.key === "unit_cost" ? Number(item.unit_cost).toFixed(2) + " ₴" : item[field.key] || "—"}</TableCell>)}
            <TableCell><div className="flex gap-1">
              {editingId === item.resource_id ? <>
                <Button variant="ghost" size="icon" aria-label={"Зберегти ресурс: " + item.name} disabled={saving} onClick={() => save(editDraft, item.resource_id)}><Check className="size-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="Скасувати редагування ресурсу" disabled={saving} onClick={() => setEditingId(null)}><X className="size-4" /></Button>
              </> : <>
                <Button variant="ghost" size="icon" aria-label={"Редагувати ресурс: " + item.name} disabled={saving} onClick={() => { setEditingId(item.resource_id); setEditDraft({ name: item.name, unit: item.unit, unit_cost: String(item.unit_cost), description: item.description || "" }); setError(""); }}><Pencil className="size-4" /></Button>
                <Button variant="destructive" size="icon" aria-label={"Видалити ресурс: " + item.name} disabled={saving} onClick={() => { setPendingDelete(item); setError(""); }}><Trash2 className="size-4" /></Button>
              </>}
            </div></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </div>}
    <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open && !saving) setPendingDelete(null); }}>
      <AlertDialogContent><AlertDialogHeader>
        <AlertDialogTitle>Видалити ресурс «{pendingDelete?.name}»?</AlertDialogTitle>
        <AlertDialogDescription>Ресурси, що вже використані у зверненнях, залишаються в каталозі для збереження історії.</AlertDialogDescription>
      </AlertDialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <AlertDialogFooter><AlertDialogCancel disabled={saving}>Скасувати</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={saving} onClick={(event) => { event.preventDefault(); remove(); }}>Видалити</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
