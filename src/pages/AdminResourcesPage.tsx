import { useEffect, useState, useCallback, useRef } from "react";
import { fetchResourceReport, apiErrorText } from "@/services/problemsApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { ResourceCatalogEditor } from "@/components/ResourceCatalogEditor";
import { Coins } from "lucide-react";

const PERIOD_OPTIONS = [
  { key: "day", label: "Сьогодні" },
  { key: "week", label: "Цей тиждень" },
  { key: "month", label: "Цей місяць" },
  { key: "year", label: "Цей рік" },
  { key: "all", label: "За весь час" },
];

interface ResourceReport {
  total_cost: number | string;
  total_items_logged: number;
  resource_summary: { resource_id: number; name: string; unit: string; total_quantity: number | string; total_cost: number | string; count: number }[];
}

export default function AdminResourcesPage() {
  const [period, setPeriod] = useState("all");
  const [report, setReport] = useState<ResourceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true); setError("");
    try { const data = await fetchResourceReport({ period }); if (version === requestVersion.current) setReport(data); }
    catch (err) { if (version === requestVersion.current) setError(apiErrorText(err, "Не вдалося завантажити звіт витрат.")); }
    finally { if (version === requestVersion.current) setLoading(false); }
  }, [period]);
  useEffect(() => { load(); return () => { requestVersion.current += 1; }; }, [load]);
  return <div className="min-w-0 p-4 sm:p-6 space-y-6">
    <Card><CardContent className="space-y-5">
      <h2 className="text-lg font-semibold inline-flex items-center gap-2"><Coins className="size-5" />Звіт витрат на ремонтні роботи</h2>
      <ToggleGroup type="single" value={period} onValueChange={(value) => { if (value) setPeriod(value); }} aria-label="Період звіту витрат" variant="outline" className="flex w-full flex-wrap justify-start">
        {PERIOD_OPTIONS.map((option) => <ToggleGroupItem key={option.key} value={option.key}>{option.label}</ToggleGroupItem>)}
      </ToggleGroup>
      {loading ? <p role="status" className="text-sm text-muted-foreground">Завантаження звіту…</p> :
        error ? <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={load}>Спробувати ще раз</Button></div> :
        report && <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-none bg-primary/5 border border-primary/15 flex flex-col justify-between">
                <p className="text-xs font-semibold text-muted-foreground">Загальні витрати</p>
                <p className="text-2xl font-bold text-link mt-2">
                  {Number(report.total_cost).toFixed(2)} ₴
                </p>
              </div>
              <div className="p-4 rounded-none bg-muted/30 border border-border flex flex-col justify-between">
                <p className="text-xs font-semibold text-muted-foreground">Загалом списань матеріалів</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {report.total_items_logged} шт
                </p>
              </div>
              <div className="p-4 rounded-none bg-muted/30 border border-border flex flex-col justify-between">
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
                <div className="border border-border overflow-hidden rounded-none">
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
                          <TableCell className="px-4 py-2.5 text-right font-bold text-link">
                            {Number(item.total_cost).toFixed(2)} ₴
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
        </>}
    </CardContent></Card>
    <Card><CardContent className="space-y-5">
      <h2 className="text-lg font-semibold">Каталог ресурсів та матеріалів</h2>
      <ResourceCatalogEditor onUpdated={load} />
    </CardContent></Card>
  </div>;
}
