import { useState, useEffect, useRef, useId, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchComplaintResources, addComplaintResource, deleteComplaintResource, fetchResources, apiErrorText } from "@/services/problemsApi";
import ResourceCatalogModal, { type ResourceItem } from "@/components/ResourceCatalogModal";
import { Coins, Settings, Plus, Trash2, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

interface ResourceLog {
  id: number;
  resource_details: ResourceItem;
  quantity: number | string;
  unit_cost: number | string;
  total_cost: number | string;
  notes?: string;
  logged_by_name?: string;
  created_at: string;
}

export function ComplaintResourceDisclosure({ complaintId }: { complaintId: number }) {
  const [open, setOpen] = useState(false);
  return <Collapsible open={open} onOpenChange={setOpen}>
    <CollapsibleTrigger asChild>
      <Button variant="outline" className="w-full justify-between">
        <span className="inline-flex items-center gap-2"><Coins className="size-4" />Витрачені ресурси</span>
        <ChevronDown className="size-4" />
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent className="pt-3">
      {open && <ComplaintResourcesSection complaintId={complaintId} />}
    </CollapsibleContent>
  </Collapsible>;
}

export default function ComplaintResourcesSection({ complaintId }: { complaintId: number }) {
  const id = useId();
  const requestVersion = useRef(0);
  const [logs, setLogs] = useState<ResourceLog[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [catalog, setCatalog] = useState<ResourceItem[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [canManageCatalog, setCanManageCatalog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [notes, setNotes] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(false);

  const loadData = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setLoadError("");
    try {
      const usage = await fetchComplaintResources(complaintId);
      const items = usage.can_manage ? await fetchResources() : [];
      if (version !== requestVersion.current) return;
      setLogs(usage.resources);
      setTotalCost(Number(usage.total_cost));
      setCanManage(usage.can_manage === true);
      setCanManageCatalog(usage.can_manage_catalog === true);
      setCatalog(items);
    } catch (err) {
      if (version === requestVersion.current) {
        setLoadError(apiErrorText(err, "Не вдалося завантажити ресурси."));
        setCanManage(false);
        setCanManageCatalog(false);
      }
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    setIsAdding(false);
    setCatalogOpen(false);
    setError("");
    setCanManage(false);
    setCanManageCatalog(false);
    loadData();
    return () => { requestVersion.current += 1; };
  }, [complaintId, loadData]);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage || saving) return;
    const q = Number(quantity), cost = Number(unitCost);
    if (!selectedResourceId || !Number.isFinite(q) || q <= 0 || !Number.isFinite(cost) || cost < 0) {
      setError("Оберіть ресурс, додатну кількість та невід’ємну ціну.");
      return;
    }
    setSaving(true); setError("");
    try {
      await addComplaintResource(complaintId, {
        resource_id: Number(selectedResourceId), quantity: q, unit_cost: cost, notes: notes.trim(),
      });
      setIsAdding(false); setSelectedResourceId(""); setQuantity("1"); setUnitCost(""); setNotes("");
      await loadData();
    } catch (err) {
      setError(apiErrorText(err, "Не вдалося зберегти списання."));
    } finally { setSaving(false); }
  };

  const removeLog = async (logId: number) => {
    if (!canManage || saving) return;
    setSaving(true); setError("");
    try {
      await deleteComplaintResource(complaintId, logId);
      await loadData();
    } catch (err) {
      setError(apiErrorText(err, "Не вдалося видалити запис про ресурс."));
    } finally { setSaving(false); }
  };

  return <section className="min-w-0 space-y-3" aria-label="Витрачені ресурси та матеріали">
    {canManageCatalog && <ResourceCatalogModal open={catalogOpen} onOpenChange={setCatalogOpen} onCatalogUpdated={loadData} />}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="inline-flex items-center gap-2 text-xs font-semibold"><Coins className="size-4" />Витрачені ресурси та матеріали</h4>
      {canManageCatalog && <Button variant="ghost" onClick={() => setCatalogOpen(true)}><Settings className="size-4" />Каталог</Button>}
    </div>
    {loading ? <p role="status" className="text-xs text-muted-foreground">Завантаження ресурсів…</p> :
      loadError ? <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{loadError}</p><Button variant="outline" onClick={loadData}>Спробувати ще раз</Button></div> : <>
      <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-muted/30 p-3">
        <div><p className="text-xs text-muted-foreground">Загальна вартість витрат</p><p className="text-sm font-semibold">{totalCost.toFixed(2)} ₴</p></div>
        {canManage && !isAdding && <Button variant="outline" onClick={() => setIsAdding(true)}><Plus className="size-4" />Списати ресурс</Button>}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {canManage && isAdding && <form onSubmit={handleAdd} className="space-y-3 border border-border p-3">
        <div className="flex flex-wrap justify-between gap-2"><h5 className="text-sm font-semibold">Списання ресурсу</h5><Button type="button" variant="ghost" disabled={saving} onClick={() => setIsAdding(false)}>Скасувати</Button></div>
        <div className="space-y-1.5">
          <Label htmlFor={id + "-resource"}>Матеріал / ресурс</Label>
          {catalog.length === 0 ? <p className="text-xs text-muted-foreground">Каталог порожній. {canManageCatalog ? "Додайте ресурс у каталозі." : "Зверніться до адміністратора."}</p> :
            <Select value={selectedResourceId} onValueChange={(value) => {
              setSelectedResourceId(value);
              setUnitCost(String(catalog.find((item) => String(item.resource_id) === value)?.unit_cost ?? ""));
            }} disabled={saving}>
              <SelectTrigger id={id + "-resource"} className="w-full min-w-0"><SelectValue placeholder="Оберіть ресурс" /></SelectTrigger>
              <SelectContent>{catalog.map((item) => <SelectItem key={item.resource_id} value={String(item.resource_id)}>{item.name} ({item.unit_cost} ₴ / {item.unit})</SelectItem>)}</SelectContent>
            </Select>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label htmlFor={id + "-quantity"}>Кількість</Label><Input id={id + "-quantity"} type="number" min="0.01" step="0.01" required value={quantity} onChange={(e) => setQuantity(e.target.value)} disabled={saving} /></div>
          <div className="space-y-1.5"><Label htmlFor={id + "-cost"}>Ціна за одиницю (₴)</Label><Input id={id + "-cost"} type="number" min="0" step="0.01" required value={unitCost} onChange={(e) => setUnitCost(e.target.value)} disabled={saving} /></div>
        </div>
        <div className="space-y-1.5"><Label htmlFor={id + "-notes"}>Примітка (необов’язково)</Label><Input id={id + "-notes"} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={saving} /></div>
        <Button type="submit" disabled={!selectedResourceId || saving}>{saving ? "Збереження…" : "Зберегти списання"}</Button>
      </form>}
      <div className="space-y-2">
        {logs.length === 0 ? <p className="text-xs text-muted-foreground">На це звернення ще не списувалися ресурси.</p> : logs.map((log) =>
          <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 border border-border p-3">
            <div className="min-w-0 space-y-1 text-xs break-words">
              <p className="font-semibold">{log.resource_details.name}</p>
              <p>{log.quantity} {log.resource_details.unit} × {log.unit_cost} ₴</p>
              {log.notes && <p>{log.notes}</p>}
              <p className="text-muted-foreground">Списав: {log.logged_by_name || "Система"} · {formatDate(log.created_at)}</p>
            </div>
            <div className="flex items-center gap-2"><span className="text-xs font-semibold">{log.total_cost} ₴</span>
              {canManage && <Button variant="destructive" size="icon" aria-label={"Видалити списання: " + log.resource_details.name} disabled={saving} onClick={() => removeLog(log.id)}><Trash2 className="size-4" /></Button>}
            </div>
          </div>)}
      </div>
    </>}
  </section>;
}
