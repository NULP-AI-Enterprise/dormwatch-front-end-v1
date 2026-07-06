import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  fetchTickets,
  fetchAllComplaints,
  fetchEmployees,
  CATEGORY_LABELS,
} from "@/services/problemsApi";
import { priorityLabel } from "@/lib/complaintUtils";
import type { Complaint, Employee, Ticket } from "@/lib/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { PrinterIcon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";

interface TicketWithComplaint extends Ticket {
  complaintDetail?: Complaint;
}

const AdminTicketsPrintPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const workerParam = searchParams.get("worker") || "all";

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchTickets(),
      fetchAllComplaints(),
      fetchEmployees(),
    ])
      .then(([tkts, cmplnts, emps]) => {
        setTickets(tkts);
        setComplaints(cmplnts);
        setEmployees(emps);
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
    : tickets.filter((t) => t.user?.user === Number(workerParam));

  // Map complaint details and filter out resolved/denied ones
  const ticketsWithComplaints: TicketWithComplaint[] = filteredTickets
    .map((t) => {
      const complaint = complaints.find((c) => c.id === t.complaint);
      return {
        ...t,
        complaintDetail: complaint,
      };
    })
    .filter((t) => {
      const status = t.complaintDetail?.status;
      return status !== "resolved" && status !== "denied";
    });

  // Group by worker
  const groups: { [key: string]: { workerName: string; tickets: TicketWithComplaint[] } } = {};

  ticketsWithComplaints.forEach((item) => {
    const workerKey = item.user?.user ? String(item.user.user) : "unassigned";
    const workerName = item.user
      ? `${item.user.first_name} ${item.user.last_name}`
      : "Не призначено";

    if (!groups[workerKey]) {
      groups[workerKey] = {
        workerName,
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

  // Trigger browser print once data is rendered
  useEffect(() => {
    if (!loading && ticketsWithComplaints.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, ticketsWithComplaints.length]);

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
    : employees.find((e) => e.user === Number(workerParam))
      ? `${employees.find((e) => e.user === Number(workerParam))?.first_name} ${employees.find((e) => e.user === Number(workerParam))?.last_name}`
      : "Невідомий працівник";

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
      <div className="no-print flex justify-between items-center bg-gray-100 border border-gray-200 p-4 mb-8 rounded-lg shadow-sm">
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
            <h1 className="text-3xl font-extrabold tracking-tight uppercase">DormWatch</h1>
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
                <h2 className="text-xl font-bold text-gray-800 border-b border-gray-400 pb-1 mb-4 flex justify-between">
                  <span>Працівник: {group.workerName}</span>
                  <span className="text-sm font-semibold text-gray-500">Кількість: {group.tickets.length}</span>
                </h2>

                <table className="w-full text-sm border-collapse border border-gray-300 mb-6">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "40%" }}>Проблема / Опис</th>
                      <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "18%" }}>Категорія</th>
                      <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "14%" }}>Кімната</th>
                      <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "14%" }}>Пріоритет</th>
                      <th className="border border-gray-300 p-2 font-bold text-center" style={{ width: "14%" }}>Дедлайн</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.tickets.map((t) => {
                      const priority = t.complaintDetail?.priority || "medium";
                      const category = t.complaintDetail?.category || "";
                      return (
                        <tr key={t.ticket_id} className="hover:bg-gray-50/50">
                          <td className="border border-gray-300 p-2 break-words">
                            <div className="font-bold text-gray-900 break-words print-title">{t.complaintDetail?.title || "Без назви"}</div>
                            <div className="text-xs text-gray-500 break-words whitespace-pre-wrap mt-1 print-description">{t.complaintDetail?.description || "Без опису"}</div>
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-xs">
                            {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category || "Інше"}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-xs">
                            {t.complaintDetail?.placeName || "Не вказано"}
                          </td>
                          <td className="border border-gray-300 p-2 text-center text-xs font-semibold">
                            {priorityLabel(priority)}
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
      </div>
    </div>
  );
};

export default AdminTicketsPrintPage;
