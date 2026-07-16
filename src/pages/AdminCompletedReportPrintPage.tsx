import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchCompletedReport } from "@/services/problemsApi";
import { HugeiconsIcon } from "@hugeicons/react";
import { PrinterIcon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import LoadingSpinner from "@/components/LoadingSpinner";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";

interface CompletedReportTicket {
  ticket_id: number;
  worker: string | null;
  worker_company: string | null;
  worker_phone: string | null;
  deadline: string | null;
}

interface CompletedReportRow {
  complaint_id: number;
  title: string;
  resolved_at: string | null;
  building: string | null;
  room: string | null;
  category: string | null;
  priority: string | null;
  tickets: CompletedReportTicket[];
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

  useEffect(() => {
    setLoading(true);
    fetchCompletedReport({ date_from: dateFrom, date_to: dateTo })
      .then((data) => setRows(data))
      .catch((err) => {
        console.error("Failed to load completed report", err);
      })
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

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

  // Render a worker cell: join the worker names of a complaint's tickets, with
  // company/phone in parentheses when present. "Не призначено" if all unassigned.
  const workersLabel = (tickets: CompletedReportTicket[]) => {
    const named = tickets
      .filter((t) => t.worker)
      .map((t) => {
        const extra = [t.worker_company, t.worker_phone].filter(Boolean).join(", ");
        return extra ? `${t.worker} (${extra})` : t.worker;
      });
    return named.length ? named.join("; ") : "Не призначено";
  };

  const deadlinesLabel = (tickets: CompletedReportTicket[]) => {
    const dls = tickets.filter((t) => t.deadline).map((t) => formatDate(t.deadline));
    return dls.length ? dls.join("; ") : "Не визначено";
  };

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
    <div className="bg-white text-black min-h-screen p-8 print-container font-sans antialiased">
      <style>{`
        table {
          border-collapse: collapse;
          width: 100%;
          table-layout: fixed;
        }
        th, td {
          border: 1px solid #d1d5db !important;
          padding: 8px !important;
          vertical-align: middle !important;
          word-break: break-all;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
        th {
          text-align: center !important;
        }
        td:first-child {
          text-align: left !important;
        }
        td:not(:first-child) {
          text-align: center !important;
        }
        .print-title {
          text-align: left !important;
        }
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Control bar for screen rendering */}
      <div className="no-print flex justify-between items-center bg-gray-100 border border-gray-200 p-4 mb-8 rounded-none shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" className="gap-2 text-gray-700 border-gray-300 hover:bg-gray-200" onClick={handleClose}>
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            Назад
          </Button>
          <span className="text-sm font-medium text-gray-600">Звіт про виконані: {rangeLabel}</span>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-white" onClick={handlePrint}>
          <HugeiconsIcon icon={PrinterIcon} className="size-4" />
          Друкувати / Зберегти як PDF
        </Button>
      </div>

      {/* Print Document Layout */}
      <div className="max-w-4xl mx-auto">
        <header className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
          <div>
            <Logo />
            <p className="text-xs text-gray-500 font-semibold mt-1">Система прямої комунікації між студентами та адміністрацією</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div><strong>Звіт про виконані звернення</strong></div>
            <div>Дата: {new Date().toLocaleDateString("uk-UA")}</div>
            <div>Період: {rangeLabel}</div>
          </div>
        </header>

        <h2 className="text-xl font-bold text-gray-800 border-b border-gray-400 pb-1 mb-4 flex justify-between items-baseline">
          <span>Виконані звернення</span>
          <span className="text-sm font-semibold text-gray-500">Кількість: {rows.length}</span>
        </h2>

        {rows.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-semibold border border-dashed border-gray-300">
            Не знайдено жодного виконаного звернення за обраний період.
          </div>
        ) : (
          <table className="w-full text-sm border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "28%" }}>Проблема</th>
                <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "14%" }}>Категорія</th>
                <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "18%" }}>Гуртожиток / Кімната</th>
                <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "18%" }}>Працівник</th>
                <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "11%" }}>Дедлайн</th>
                <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "11%" }}>Вирішено</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.complaint_id} className="hover:bg-gray-50/50">
                  <td className="border border-gray-300 p-2 break-words">
                    <div className="font-bold text-gray-900 break-words print-title">{row.title || "Без назви"}</div>
                  </td>
                  <td className="border border-gray-300 p-2 text-center text-xs">
                    {row.category || "Не вказано"}
                  </td>
                  <td className="border border-gray-300 p-2 text-center text-xs">
                    <div className="font-semibold">{row.building || "Не вказано"}</div>
                    <div className="text-gray-600">{row.room || "—"}</div>
                  </td>
                  <td className="border border-gray-300 p-2 text-center text-xs">
                    {workersLabel(row.tickets)}
                  </td>
                  <td className="border border-gray-300 p-2 text-center text-xs font-semibold text-red-600">
                    {deadlinesLabel(row.tickets)}
                  </td>
                  <td className="border border-gray-300 p-2 text-center text-xs font-semibold">
                    {formatDate(row.resolved_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminCompletedReportPrintPage;
