import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  fetchTickets,
  fetchAllComplaints,
  fetchWorkers,
} from "@/services/problemsApi";
import { priorityLabel, statusLabel, isActiveStatus } from "@/lib/complaintUtils";
import type { Complaint, Worker, Ticket } from "@/lib/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { PrinterIcon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import LoadingSpinner from "@/components/LoadingSpinner";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { resolveImageUrl } from "@/services/imageUtils";

interface TicketWithComplaint extends Ticket {
  complaintDetail?: Complaint;
}

const AdminTicketsPrintPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const workerParam = searchParams.get("worker") || "all";

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchTickets(),
      fetchAllComplaints(),
      fetchWorkers(),
    ])
      .then(([tkts, cmplnts, wkrs]) => {
        setTickets(tkts);
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

  // Filter tickets by worker
  const filteredTickets = workerParam === "all"
    ? tickets
    : tickets.filter((t) => t.worker?.worker_id === Number(workerParam));

  // Map complaint details and keep only tickets on active complaints (not
  // resolved, not rejected). isActiveStatus handles the normalized status
  // vocabulary — the raw "denied" never reaches the frontend (it's mapped to
  // "rejected"), so filtering on the helper is the correct check.
  const ticketsWithComplaints: TicketWithComplaint[] = filteredTickets
    .map((t) => {
      const complaint = complaints.find((c) => c.id === t.complaint);
      return {
        ...t,
        complaintDetail: complaint,
      };
    })
    .filter((t) => t.complaintDetail && isActiveStatus(t.complaintDetail.status));

  // Group by worker
  const groups: {
    [key: string]: { workerName: string; company?: string; phone?: string; tickets: TicketWithComplaint[] };
  } = {};

  ticketsWithComplaints.forEach((item) => {
    const workerKey = item.worker?.worker_id ? String(item.worker.worker_id) : "unassigned";
    const workerName = item.worker ? item.worker.full_name : "Не призначено";

    if (!groups[workerKey]) {
      groups[workerKey] = {
        workerName,
        company: item.worker?.company,
        phone: item.worker?.phone,
        tickets: [],
      };
    }
    groups[workerKey].tickets.push(item);
  });

  // Sort each group's tickets by deadline ascending
  Object.keys(groups).forEach((key) => {
    groups[key].tickets.sort((a, b) => {
      const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return dateA - dateB;
    });
  });

  // Sort groups alphabetically, unassigned at the end
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
    if (a === "unassigned") return 1;
    if (b === "unassigned") return -1;
    return groups[a].workerName.localeCompare(groups[b].workerName, "uk");
  });

  // Flatten to a single ordered list so each ticket's detail sheet follows the
  // same sequence as the index (worker group, then deadline ascending).
  const orderedTickets = sortedGroupKeys.flatMap((key) => groups[key].tickets);

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
        <p className="mt-4 text-sm font-semibold">Завантаження тікетів для друку...</p>
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
            {/* Shared brand mark (Building03 + wordmark) — DESIGN.md single source of truth */}
            <Logo />
            <p className="text-xs text-gray-500 font-semibold mt-1">Система прямої комунікації між студентами та адміністрацією</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div><strong>Звіт по тікетах</strong></div>
            <div>Дата: {new Date().toLocaleDateString("uk-UA")}</div>
            <div>Фільтр: {selectedWorkerName}</div>
          </div>
        </header>

        {ticketsWithComplaints.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-semibold border border-dashed border-gray-300">
            Не знайдено жодного активного тікета для обраного фільтру.
          </div>
        ) : (
          sortedGroupKeys.map((groupKey) => {
            const group = groups[groupKey];
            return (
              <div key={groupKey} className="mb-8 avoid-break">
                <h2 className="text-xl font-bold text-gray-800 border-b border-gray-400 pb-1 mb-4 flex justify-between items-baseline">
                  <span>
                    Працівник: {group.workerName}
                    {(group.company || group.phone) && (
                      <span className="text-sm font-medium text-gray-500 ml-2">
                        ({[group.company, group.phone].filter(Boolean).join(", ")})
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-gray-500">Кількість: {group.tickets.length}</span>
                </h2>

                <table className="w-full text-sm border-collapse border border-gray-300 mb-6">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "36%" }}>Проблема / Опис</th>
                      <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "16%" }}>Категорія</th>
                      <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "20%" }}>Гуртожиток / Кімната</th>
                      <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "14%" }}>Пріоритет</th>
                      <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "14%" }}>Дедлайн</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.tickets.map((t) => {
                      const priority = t.complaintDetail?.priority;
                      const category = t.complaintDetail?.category;
                      return (
                        <tr key={t.ticket_id} className="hover:bg-gray-50/50">
                          <td className="border border-gray-300 p-2 break-words">
                            <div className="font-bold text-gray-900 break-words print-title">{t.complaintDetail?.title || "Без назви"}</div>
                            <div className="text-xs text-gray-500 break-words whitespace-pre-wrap mt-1 print-description">{t.complaintDetail?.description || "Без опису"}</div>
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-xs">
                            {category || "Не вказано"}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-xs">
                            <div className="font-semibold">{t.complaintDetail?.building || "Не вказано"}</div>
                            <div className="text-gray-600">{t.complaintDetail?.placeName || "—"}</div>
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-xs font-semibold">
                            {priority ? priorityLabel(priority) : "Не визначено"}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-xs font-semibold text-red-600">
                            {t.deadline ? new Date(t.deadline).toLocaleDateString("uk-UA") : "Не визначено"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })
        )}

        {/* One detail sheet (work order) per ticket, each on its own printed page. */}
        {orderedTickets.map((t) => {
          const c = t.complaintDetail;
          const photo = resolveImageUrl(c?.photoUrl || c?.thumbnail || null);
          return (
            <div key={`detail-${t.ticket_id}`} className="print-page avoid-break pt-8">
              <header className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
                <div>
                  <Logo />
                  <p className="text-xs text-gray-500 font-semibold mt-1">Наряд-замовлення</p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div><strong>Тікет #{t.ticket_id}</strong></div>
                  <div>Дата: {new Date().toLocaleDateString("uk-UA")}</div>
                </div>
              </header>

              <h2 className="text-2xl font-bold text-gray-900 mb-1">{c?.title || "Без назви"}</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mb-6">{c?.description || "Без опису"}</p>

              <table className="w-full text-sm border-collapse border border-gray-300 mb-6">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold bg-gray-50 w-1/3">Категорія</td>
                    <td className="border border-gray-300 p-2">{c?.category || "Не вказано"}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold bg-gray-50">Гуртожиток</td>
                    <td className="border border-gray-300 p-2 font-semibold">{c?.building || "Не вказано"}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold bg-gray-50">Кімната</td>
                    <td className="border border-gray-300 p-2 font-semibold">{c?.placeName || "Не вказано"}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold bg-gray-50">Пріоритет</td>
                    <td className="border border-gray-300 p-2">{c?.priority ? priorityLabel(c.priority) : "Не визначено"}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold bg-gray-50">Статус</td>
                    <td className="border border-gray-300 p-2">{c?.status ? statusLabel(c.status) : "—"}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold bg-gray-50">Працівник</td>
                    <td className="border border-gray-300 p-2">
                      {t.worker
                        ? `${t.worker.full_name}${[t.worker.company, t.worker.phone].filter(Boolean).length ? ` (${[t.worker.company, t.worker.phone].filter(Boolean).join(", ")})` : ""}`
                        : "Не призначено"}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-bold bg-gray-50">Дедлайн</td>
                    <td className="border border-gray-300 p-2 font-semibold text-red-600">
                      {t.deadline ? new Date(t.deadline).toLocaleDateString("uk-UA") : "Не визначено"}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div>
                <div className="text-sm font-bold text-gray-800 mb-2">Фото</div>
                {photo ? (
                  <img
                    src={photo}
                    alt={c?.title || "Фото звернення"}
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
