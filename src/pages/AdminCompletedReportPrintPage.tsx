import { PrintDocument, PrintStyles } from "@/components/PrintDocument";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchCompletedReport } from "@/services/problemsApi";
import { Printer, ChevronLeft } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";

interface CompletedReportWorker {
  worker_id: number;
  full_name: string;
  company: string;
  phone: string;
}

interface CompletedReportRow {
  complaint_id: number;
  title: string;
  resolved_at: string | null;
  building: string | null;
  room: string | null;
  is_shared: boolean;
  category: string | null;
  priority: string | null;
  worker: CompletedReportWorker | null;
  deadline: string | null;
}

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("uk-UA") : "—";

const AdminCompletedReportPrintPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";

  const [rows, setRows] = useState<CompletedReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setLoading(true); setLoadError(false);
    fetchCompletedReport({ date_from: dateFrom, date_to: dateTo })
      .then((data) => setRows(data))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, retry]);

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      window.close();
    }
  };

  // Worker cell: name with company/phone in parentheses when present.
  const workerLabel = (row: CompletedReportRow) => {
    const w = row.worker;
    if (!w) return "Не призначено";
    const extra = [w.company, w.phone].filter(Boolean).join(", ");
    return extra ? `${w.full_name} (${extra})` : w.full_name;
  };

  if (loadError) return <div role="alert" className="min-h-screen bg-background text-foreground p-6 space-y-3"><p>Не вдалося завантажити дані для друку.</p><Button onClick={() => setRetry((value) => value + 1)}>Спробувати ще раз</Button></div>;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <LoadingSpinner />
        <p className="mt-4 text-sm font-semibold">Завантаження звіту для друку...</p>
      </div>
    );
  }

  const rangeLabel =
    dateFrom && dateTo
      ? `${new Date(dateFrom).toLocaleDateString("uk-UA")} — ${new Date(dateTo).toLocaleDateString("uk-UA")}`
      : "Весь період";

  return (
    <div className="bg-background text-foreground min-h-screen p-4 sm:p-8 print-container font-sans antialiased">
      <PrintStyles />

      {/* Control bar for screen rendering */}
      <div className="no-print flex flex-wrap gap-3 justify-between items-center bg-muted border border-border p-4 mb-8 rounded-none shadow-sm">
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <Button variant="outline" className="gap-2 text-foreground border-border hover:bg-muted" onClick={handleClose}>
            <ChevronLeft className="size-4" strokeWidth={1.5} />
            Назад
          </Button>
          <span className="text-sm font-medium text-muted-foreground">Звіт про виконані: {rangeLabel}</span>
        </div>
        <Button size="touch" className="max-w-full whitespace-normal gap-2" onClick={handlePrint}>
          <Printer className="size-4" strokeWidth={1.5} />
          Друкувати / Зберегти як PDF
        </Button>
      </div>

      {/* Print Document Layout */}
      <PrintDocument className="max-w-4xl">
        <header className="border-b-2 border-foreground pb-4 mb-6 flex justify-between items-end">
          <div>
            <Logo />
            <p className="text-xs text-muted-foreground font-semibold mt-1">Система прямої комунікації між студентами та адміністрацією</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div><strong>Звіт про виконані звернення</strong></div>
            <div>Дата: {new Date().toLocaleDateString("uk-UA")}</div>
            <div>Період: {rangeLabel}</div>
          </div>
        </header>

        <h2 className="text-xl font-bold text-foreground border-b border-border pb-1 mb-4 flex justify-between items-baseline">
          <span>Виконані звернення</span>
          <span className="text-sm font-semibold text-muted-foreground">Кількість: {rows.length}</span>
        </h2>

        {rows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-semibold border border-dashed border-border">
            Не знайдено жодного виконаного звернення за обраний період.
          </div>
        ) : (
          <table className="w-full text-sm border-collapse border border-border mb-6">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 font-bold text-center" style={{ width: "24%" }}>Проблема</th>
                <th className="border border-border p-2 font-bold text-center" style={{ width: "14%" }}>Категорія</th>
                <th className="border border-border p-2 font-bold text-center" style={{ width: "18%" }}>Гуртожиток / Кімната</th>
                <th className="border border-border p-2 font-bold text-center" style={{ width: "18%" }}>Працівник</th>
                <th className="border border-border p-2 font-bold text-center" style={{ width: "13%" }}>Дедлайн</th>
                <th className="border border-border p-2 font-bold text-center" style={{ width: "13%" }}>Вирішено</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.complaint_id} className="hover:bg-muted/50">
                  <td className="border border-border p-2 break-words">
                    <div className="font-bold text-foreground break-words print-title">{row.title || "Без назви"}</div>
                  </td>
                  <td className="border border-border p-2 text-center text-xs">
                    {row.category || "Не вказано"}
                  </td>
                   <td className="border border-border p-2 text-center text-xs">
                     <div className="font-semibold">{row.building || "Не вказано"}</div>
                     <div className="text-muted-foreground">{row.room || "—"}{row.is_shared && " (спільна)"}</div>
                   </td>
                  <td className="border border-border p-2 text-center text-xs">
                    {workerLabel(row)}
                  </td>
                  <td className="border border-border p-2 text-center text-xs font-semibold">
                    {row.deadline ? formatDate(row.deadline) : "Не визначено"}
                  </td>
                  <td className="border border-border p-2 text-center text-xs font-semibold">
                    {formatDate(row.resolved_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PrintDocument>
    </div>
  );
};

export default AdminCompletedReportPrintPage;
