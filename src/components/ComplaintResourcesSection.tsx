import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchComplaintResources, addComplaintResource, deleteComplaintResource, fetchResources } from "@/services/problemsApi";
import ResourceCatalogModal, { type ResourceItem } from "@/components/ResourceCatalogModal";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete01Icon, Settings01Icon, Coins01Icon } from "@hugeicons/core-free-icons";
import { formatDate } from "@/lib/dateUtils";

interface ComplaintResourceLog {
  id: number;
  complaint: number;
  resource: number;
  resource_details: ResourceItem;
  quantity: number | string;
  unit_cost: number | string;
  total_cost: number | string;
  notes?: string;
  logged_by_name?: string;
  created_at: string;
}

interface ComplaintResourcesSectionProps {
  complaintId: number;
  isAdmin: boolean;
}

export default function ComplaintResourcesSection({
  complaintId,
  isAdmin,
}: ComplaintResourcesSectionProps) {
  const [logs, setLogs] = useState<ComplaintResourceLog[]>([]);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [catalog, setCatalog] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [isAdding, setIsAdding] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [unitCost, setUnitCost] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchComplaintResources(complaintId);
      setLogs(res.resources || []);
      setTotalCost(res.total_cost || 0);

      const catData = await fetchResources();
      setCatalog(catData);
    } catch (e) {
      console.warn("Failed to load complaint resources", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (complaintId) {
      loadData();
    }
  }, [complaintId]);

  const handleSelectResource = (resourceIdStr: string) => {
    setSelectedResourceId(resourceIdStr);
    const found = catalog.find((r) => String(r.resource_id) === resourceIdStr);
    if (found) {
      setUnitCost(String(found.unit_cost));
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResourceId) {
      setError("Оберіть ресурс із каталогу");
      return;
    }
    const qNum = parseFloat(quantity);
    if (isNaN(qNum) || qNum <= 0) {
      setError("Введіть коректну кількість (> 0)");
      return;
    }

    try {
      await addComplaintResource(complaintId, {
        resource_id: parseInt(selectedResourceId, 10),
        quantity: qNum,
        unit_cost: parseFloat(unitCost) || 0,
        notes: notes.trim(),
      });
      setIsAdding(false);
      setSelectedResourceId("");
      setQuantity("1");
      setNotes("");
      setError(null);
      loadData();
    } catch (err: any) {
      setError("Не вдалося додати витрачений ресурс");
    }
  };

  const handleDeleteLog = async (logId: number) => {
    try {
      await deleteComplaintResource(complaintId, logId);
      loadData();
    } catch (e) {
      setError("Не вдалося видалити запис про ресурс");
    }
  };

  const selectedItem = catalog.find((c) => String(c.resource_id) === selectedResourceId);

  return (
    <div className="space-y-3">
      <ResourceCatalogModal
        open={isCatalogModalOpen}
        onOpenChange={setIsCatalogModalOpen}
        onCatalogUpdated={loadData}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon icon={Coins01Icon} className="size-4 text-primary" />
          <h4 className="text-xs font-semibold text-foreground">Витрачені ресурси та матеріали</h4>
        </div>
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => setIsCatalogModalOpen(true)}
          >
            <HugeiconsIcon icon={Settings01Icon} className="size-3 mr-1" />
            Каталог
          </Button>
        )}
      </div>

      {/* Summary card */}
      <div className="flex items-center justify-between border border-primary/15 bg-primary/5 p-3 rounded-lg">
        <div>
          <p className="text-[11px] text-muted-foreground">Загальна вартість витрат:</p>
          <p className="text-sm font-bold text-foreground">{Number(totalCost).toFixed(2)} ₴</p>
        </div>
        {!isAdding && (
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setIsAdding(true)}>
            <HugeiconsIcon icon={Add01Icon} className="size-3.5 mr-1" />
            Списати ресурс
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-destructive font-medium">{error}</p>}

      {/* Add Resource Inline Form */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="space-y-2.5 border p-3 rounded-md bg-background shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold">Списання ресурсу на звернення</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-1.5"
              onClick={() => setIsAdding(false)}
            >
              Скасувати
            </Button>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Матеріал / Ресурс *</label>
            {catalog.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Каталог порожній. {isAdmin ? "Додайте найменування у каталозі." : "Зверніться до адміністратора."}
              </p>
            ) : (
              <Select value={selectedResourceId} onValueChange={handleSelectResource}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Оберіть ресурс..." />
                </SelectTrigger>
                <SelectContent>
                  {catalog.map((item) => (
                    <SelectItem key={item.resource_id} value={String(item.resource_id)}>
                      {item.name} ({item.unit_cost} ₴ / {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Кількість {selectedItem ? `(${selectedItem.unit})` : ""} *
              </label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                className="h-8 text-xs"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Ціна за од. (₴)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="h-8 text-xs"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Примітка</label>
            <Input
              className="h-8 text-xs"
              placeholder="напр. Замінено 2 лампи в коридорі"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="submit" size="sm" className="h-7 text-xs" disabled={!selectedResourceId}>
              Зберегти списання
            </Button>
          </div>
        </form>
      )}

      {/* Logged Resources List */}
      <div className="space-y-1.5">
        {loading ? (
          <p className="text-xs text-muted-foreground py-2 text-center">Завантаження ресурсів...</p>
        ) : logs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">
            На це звернення ще не списувалися ресурси.
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between border p-2 rounded-md bg-muted/10 text-xs"
            >
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <span>{log.resource_details?.name || "Ресурс"}</span>
                  <span className="text-muted-foreground font-normal">
                    ({log.quantity} {log.resource_details?.unit || "шт"} × {log.unit_cost} ₴)
                  </span>
                </div>
                {log.notes && <p className="text-[11px] text-muted-foreground">{log.notes}</p>}
                <div className="text-[10px] text-muted-foreground">
                  Списав: {log.logged_by_name || "Користувач"} • {formatDate(log.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-xs">{log.total_cost} ₴</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteLog(log.id)}
                >
                  <HugeiconsIcon icon={Delete01Icon} className="size-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
