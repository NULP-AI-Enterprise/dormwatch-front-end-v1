import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWorkerReport } from "@/services/problemsApi";
import { statusLabel } from "@/lib/complaintUtils";
import { formatDateTime } from "@/lib/dateUtils";
import { HugeiconsIcon } from "@hugeicons/react";
import { PrinterIcon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import LoadingSpinner from "@/components/LoadingSpinner";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";

interface WorkerReportJob {
  complaint_id: number;
  title: string;
  category: string | null;
  building: string | null;
  room: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_minutes: number | null;
  deadline: string | null;
  resolved_at: string | null;
  status: string;
  root: number | null;
  root_title: string | null;
  is_not_accepted: boolean;
}

interface WorkerReportRow {
  worker_id: number;
  full_name: string;
  company: string;
  phone: string;
  has_account: boolean;
  jobs_count: number;
  on_time: number;
  overdue: number;
  rejection_count: number;
  rejection_rate: number;
  avg_resolution_minutes: number | null;
  saga_count: number;
  jobs: WorkerReportJob[];
}

interface WorkerReport {
  workers: WorkerReportRow[];
  caveats: string[];
}

// Per-job duration as hours, rounded to one decimal — shown per job, never
// summed into person-hours (overlapping jobs would double-count, breaks would
// count as labor).
const fmtHours = (minutes: number | null): string => {
  if (minutes === null || isNaN(minutes)) return "—";
  return `${(minutes / 60).toFixed(1)} год`;
};

const fmtRate = (rate: number): string =>
  `${(rate * 100).toFixed(0)}%`;

const AdminWorkerReportPrintPage = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState<WorkerReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchWorkerReport()
      .then((data) => setReport(data))
      .catch((err) => {
        console.error("Failed to load worker report", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Group a worker's jobs by saga (root) so a re-filed chain reads as one
  // story. Jobs without a root each form their own single-job group.
  const grouped = useMemo(() => {
    if (!report) return [];
    return report.workers.map((w) => {
      const groups: { root: number | null; rootTitle: string | null; jobs: WorkerReportJob[] }[] = [];
      const byRoot = new Map<number | null, WorkerReportJob[]>();
      for (const j of w.jobs) {
        const key = j.root;
        if (!byRoot.has(key)) byRoot.set(key, []);
        byRoot.get(key)!.push(j);
      }
      for (const [root, jobs] of byRoot) {
        groups.push({ root, rootTitle: jobs[0].root_title, jobs });
      }
      // Groups with a root first (saga), then standalone jobs; stable by first
      // complaint_id in each group.
      groups.sort((a, b) => {
        const aId = a.jobs[0]?.complaint_id ?? 0;
        const bId = b.jobs[0]?.complaint_id ?? 0;
        return aId - bId;
      });
      return { worker: w, groups };
    });
  }, [report]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <LoadingSpinner />
        <p className="mt-4 text-sm font-semibold">Завантаження звіту по працівниках...</p>
      </div>
    );
  }

  const workers = report?.workers ?? [];
  const caveats = report?.caveats ?? [];

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
        .print-page {
          page-break-before: always;
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
          .avoid-break {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="no-print flex justify-between items-center bg-gray-100 border border-gray-200 p-4 mb-8 rounded-none shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" className="gap-2 text-gray-700 border-gray-300 hover:bg-gray-200" onClick={handleClose}>
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            Назад
          </Button>
          <span className="text-sm font-medium text-gray-600">Звіт по працівниках</span>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-white" onClick={handlePrint}>
          <HugeiconsIcon icon={PrinterIcon} className="size-4" />
          Друкувати / Зберегти як PDF
        </Button>
      </div>

      <div className="max-w-5xl mx-auto">
        <header className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
          <div>
            <Logo />
            <p className="text-xs text-gray-500 font-semibold mt-1">Система прямої комунікації між студентами та адміністрацією</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div><strong>Звіт по працівниках</strong></div>
            <div>Дата: {new Date().toLocaleDateString("uk-UA")}</div>
          </div>
        </header>

        {workers.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-semibold border border-dashed border-gray-300">
            Немає даних для звіту. Показуються лише працівники із завершеними зверненнями (finished_at).
          </div>
        ) : (
          grouped.map(({ worker: w, groups }) => (
            <div key={w.worker_id} className="mb-10 avoid-break">
              <h2 className="text-xl font-bold text-gray-800 border-b border-gray-400 pb-1 mb-1">
                {w.full_name}
                {[w.company, w.phone].filter(Boolean).length > 0 && (
                  <span className="text-sm font-medium text-gray-500 ml-2">
                    ({[w.company, w.phone].filter(Boolean).join(", ")})
                  </span>
                )}
                {w.has_account && (
                  <span className="text-xs font-semibold text-green-700 ml-2 border border-green-600 px-1">панель</span>
                )}
              </h2>

              <div className="text-sm text-gray-700 mb-3 flex flex-wrap gap-x-4 gap-y-1">
                <span>Завдань: <strong>{w.jobs_count}</strong></span>
                <span>Вчасно: <strong className="text-green-700">{w.on_time}</strong></span>
                <span>Прострочено: <strong className="text-red-600">{w.overdue}</strong></span>
                <span>Відсоток відхилення: <strong>{fmtRate(w.rejection_rate)}</strong> ({w.rejection_count} з {w.jobs_count})</span>
                <span>Середній час вирішення: <strong>{fmtHours(w.avg_resolution_minutes)}</strong></span>
                {w.saga_count > 0 && (
                  <span>Саг: <strong>{w.saga_count}</strong></span>
                )}
              </div>

              {groups.map((group, gi) => (
                <div key={group.root ?? `single-${gi}`} className="mb-4">
                  {group.root !== null && (
                    <div className="text-xs font-semibold text-gray-500 mb-1">
                      Сага (корінь №{group.root}): {group.rootTitle ?? "—"}
                    </div>
                  )}
                  <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "26%" }}>Проблема</th>
                        <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "12%" }}>Категорія</th>
                        <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "14%" }}>Гуртожиток / Кімната</th>
                        <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "12%" }}>Початок</th>
                        <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "12%" }}>Завершення</th>
                        <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "10%" }}>Тривалість</th>
                        <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "14%" }}>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.jobs.map((j) => (
                        <tr key={j.complaint_id} className="hover:bg-gray-50/50">
                          <td className="border border-gray-300 p-2 break-words">
                            <div className="font-bold text-gray-900 break-words">
                              {j.title || "Без назви"}
                              <span className="text-gray-400 font-normal"> №{j.complaint_id}</span>
                            </div>
                            {j.root !== null && (
                              <div className="text-xs text-gray-500 mt-0.5">Повторне до №{j.root}</div>
                            )}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-xs">
                            {j.category || "Не вказано"}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-xs">
                            <div className="font-semibold">{j.building || "Не вказано"}</div>
                            <div className="text-gray-600">{j.room || "—"}</div>
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-xs">
                            {formatDateTime(j.started_at)}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-xs">
                            {formatDateTime(j.finished_at)}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-xs font-semibold">
                            {fmtHours(j.duration_minutes)}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-xs font-semibold">
                            {statusLabel(j.status)}
                            {j.is_not_accepted && (
                              <div className="text-red-600 font-normal">(відхилено мешканцем)</div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              <p className="text-xs text-gray-500 italic mt-1">
                Тривалість наведена за одне завдання (started_at → finished_at з поділом на сегменти при перепризначенні) — не сумується.
              </p>
            </div>
          ))
        )}

        {caveats.length > 0 && (
          <div className="mt-8 border-t border-gray-300 pt-4">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Примітики до даних</h3>
            <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
              {caveats.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWorkerReportPrintPage;
