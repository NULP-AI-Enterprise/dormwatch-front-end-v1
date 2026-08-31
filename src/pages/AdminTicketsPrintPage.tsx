import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchAllComplaints, fetchWorkers } from "@/services/problemsApi";
import { priorityLabel, statusLabel } from "@/lib/complaintUtils";
import type { Complaint, Worker } from "@/lib/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { PrinterIcon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import LoadingSpinner from "@/components/LoadingSpinner";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { resolveImageUrl } from "@/services/imageUtils";

// Complaints that are out with a worker: assigned and still on the working
// pipeline (approved / in_progress / review). Pending has no assignee yet and
// terminal states are done — neither prints as a work order.
const WORK_ORDER_STATUSES = ["approved", "in_progress", "review"];

const isActiveWorkOrder = (c: Complaint) =>
  !!c.worker && WORK_ORDER_STATUSES.includes(c.status);

const AdminTicketsPrintPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const workerParam = searchParams.get("worker") || "all";

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAllComplaints(), fetchWorkers()])
      .then(([cmplnts, wkrs]) => {
        setComplaints(cmplnts);
        setWorkers(wkrs);
      })
      .catch((err) => {
        console.error("Failed to load print data", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter assigned complaints by the selected worker
  const filtered = useMemo(
    () =>
      complaints.filter(
        (c) =>
          isActiveWorkOrder(c) &&
          (workerParam === "all" || c.worker?.worker_id === Number(workerParam))
      ),
    [complaints, workerParam]
  );

  // Group by worker
  const groups = useMemo(() => {
    const map: {
      [key: string]: { worker: Worker | null; complaints: Complaint[] };
    } = {};
    filtered.forEach((c) => {
      const key = c.worker ? String(c.worker.worker_id) : "unassigned";
      if (!map[key]) {
        map[key] = { worker: c.worker ?? null, complaints: [] };
      }
      map[key].complaints.push(c);
    });
    // Sort each group's complaints by deadline ascending
    Object.values(map).forEach((group) => {
      group.complaints.sort((a, b) => {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      });
    });
    return map;
  }, [filtered]);

  // Sort groups alphabetically, unassigned at the end
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
    if (a === "unassigned") return 1;
    if (b === "unassigned") return -1;
    const nameA = groups[a].worker?.full_name ?? "—";
    const nameB = groups[b].worker?.full_name ?? "—";
    return nameA.localeCompare(nameB, "uk");
  });

  // Flatten to a single ordered list so each work order sheet follows the
  // same sequence as the index (worker group, then deadline ascending).
  const ordered = sortedGroupKeys.flatMap((key) => groups[key].complaints);

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
        <p className="mt-4 text-sm font-semibold">Завантаження нарядів для друку...</p>
      </div>
    );
  }

  const selectedWorkerName = workerParam === "all"
    ? "Всі працівники"
    : workers.find((w) => w.worker_id === Number(workerParam))?.full_name
      ?? "Невідомий працівник";

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
        .print-description {
          text-align: left !important;
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

      {/* Control bar for screen rendering */}
      <div className="no-print flex justify-between items-center bg-gray-100 border border-gray-200 p-4 mb-8 rounded-none shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" className="gap-2 text-gray-700 border-gray-300 hover:bg-gray-200" onClick={handleClose}>
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            Назад
          </Button>
          <span className="text-sm font-medium text-gray-600">Звіт: {selectedWorkerName}</span>
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
            {/* Shared brand mark (Building03 + wordmark) — design-system.md §6: canonical in Logo.tsx */}
            <Logo />
            <p className="text-sm text-gray-500 font-semibold mt-1">Система прямої комунікації між студентами та адміністрацією</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div><strong>Звіт по нарядах</strong></div>
            <div>Дата: {new Date().toLocaleDateString("uk-UA")}</div>
            <div>Фільтр: {selectedWorkerName}</div>
          </div>
        </header>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-semibold border border-dashed border-gray-300">
            Не знайдено жодного призначеного звернення для обраного фільтру.
          </div>
        ) : (
          sortedGroupKeys.map((groupKey) => {
            const group = groups[groupKey];
            const w = group.worker;
            return (
              <div key={groupKey} className="mb-8 avoid-break">
                <h2 className="text-xl font-bold text-gray-800 border-b border-gray-400 pb-1 mb-4 flex justify-between items-baseline">
                  <span>
                    Працівник: {w ? w.full_name : "Не призначено"}
                    {w && (w.company || w.phone) && (
                      <span className="text-sm font-medium text-gray-500 ml-2">
                        ({[w.company, w.phone].filter(Boolean).join(", ")})
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-gray-500">Кількість: {group.complaints.length}</span>
                </h2>

                <table className="w-full text-sm border-collapse border border-gray-300 mb-6">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "36%" }}>Проблема / Опис</th>
                      <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "16%" }}>Категорія</th>
                      <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "20%" }}>Гуртожиток / Місце</th>
                      <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "14%" }}>Пріоритет</th>
                      <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "14%" }}>Дедлайн</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.complaints.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/50">
                        <td className="border border-gray-300 p-2 break-words">
                          <div className="font-bold text-gray-900 break-words print-title">{c.title || "Без назви"}</div>
                          <div className="text-sm text-gray-500 break-words whitespace-pre-wrap mt-1 print-description">{c.description || "Без опису"}</div>
                        </td>
                        <td className="border border-gray-300 p-2 text-center text-xs">
                          {c.category || "Не вказано"}
                        </td>
                        <td className="border border-gray-300 p-2 text-center text-xs">
                          <div className="font-semibold">{c.building || "Не вказано"}</div>
                          <div className="text-gray-600">{c.placeName || "—"}{c.isShared && " (спільна)"}</div>
                        </td>
                        <td className="border border-gray-300 p-2 text-center text-xs font-semibold">
                          {c.priority ? priorityLabel(c.priority) : "Не визначено"}
                        </td>
                        <td className="border border-gray-300 p-2 text-center text-xs font-semibold text-red-600">
                          {c.deadline ? new Date(c.deadline).toLocaleDateString("uk-UA") : "Не визначено"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )}

        {/* One detail sheet (work order) per assigned complaint, each on its own
            printed page. The complaint id IS the work-order reference. */}
        {ordered.map((c) => {
          const w = c.worker;
          const photo = resolveImageUrl(c.photoUrl || c.thumbnail || null);
          return (
            <div key={`detail-${c.id}`} className="print-page avoid-break pt-8">
              <header className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
                <div>
                  <Logo />
                  <p className="text-xs text-gray-500 font-semibold mt-1">Наряд-замовлення</p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div><strong>Звернення №{c.id}</strong></div>
                  <div>Дата: {new Date().toLocaleDateString("uk-UA")}</div>
                </div>
              </header>

              <h2 className="text-2xl font-bold text-gray-900 mb-1">{c.title || "Без назви"}</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mb-6">{c.description || "Без опису"}</p>

              <table className="w-full text-sm border-collapse border border-gray-300 mb-6">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold bg-gray-50 w-1/3">Категорія</td>
                    <td className="border border-gray-300 p-2">{c.category || "Не вказано"}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold bg-gray-50">Гуртожиток</td>
                    <td className="border border-gray-300 p-2 font-semibold">{c.building || "Не вказано"}</td>
                  </tr>
                   <tr>
                      <td className="border border-gray-300 p-2 font-bold bg-gray-50">{c.isShared ? "Спільне місце" : "Кімната"}</td>
                      <td className="border border-gray-300 p-2 font-semibold">{c.placeName || "Не вказано"}</td>
                   </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold bg-gray-50">Пріоритет</td>
                    <td className="border border-gray-300 p-2">{c.priority ? priorityLabel(c.priority) : "Не визначено"}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold bg-gray-50">Статус</td>
                    <td className="border border-gray-300 p-2">{statusLabel(c.status)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold bg-gray-50">Працівник</td>
                    <td className="border border-gray-300 p-2">
                      {w
                        ? `${w.full_name}${[w.company, w.phone].filter(Boolean).length ? ` (${[w.company, w.phone].filter(Boolean).join(", ")})` : ""}`
                        : "Не призначено"}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold bg-gray-50">Дедлайн</td>
                    <td className="border border-gray-300 p-2 font-semibold text-red-600">
                      {c.deadline ? new Date(c.deadline).toLocaleDateString("uk-UA") : "Не визначено"}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div>
                <div className="text-sm font-bold text-gray-800 mb-2">Фото</div>
                {photo ? (
                  <img
                    src={photo}
                    alt={c.title || "Фото звернення"}
                    className="w-full h-auto border border-gray-300 rounded-none"
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-300">
                    Фото відсутнє
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTicketsPrintPage;
