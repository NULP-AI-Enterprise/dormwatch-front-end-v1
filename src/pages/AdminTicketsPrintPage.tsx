import { PrintDocument, PrintStyles } from "@/components/PrintDocument";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchAllComplaints, fetchWorkers } from "@/services/problemsApi";
import { priorityLabel, statusLabel, complaintIsOverdue } from "@/lib/complaintUtils";
import type { Complaint, Worker } from "@/lib/types";
import { Printer, ChevronLeft } from "lucide-react";
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
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setLoading(true); setLoadError(false);
    Promise.all([fetchAllComplaints({}, true), fetchWorkers(true)])
      .then(([cmplnts, wkrs]) => {
        setComplaints(cmplnts);
        setWorkers(wkrs);
      })
      .catch(() => setLoadError(true))
      .finally(() => {
        setLoading(false);
      });
  }, [retry]);

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

  if (loadError) return <div role="alert" className="min-h-screen bg-background text-foreground p-6 space-y-3"><p>Не вдалося завантажити дані для друку.</p><Button onClick={() => setRetry((value) => value + 1)}>Спробувати ще раз</Button></div>;

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
    <div className="bg-background text-foreground min-h-screen p-4 sm:p-8 print-container font-sans antialiased">
      <PrintStyles />

      {/* Control bar for screen rendering */}
      <div className="no-print flex flex-wrap gap-3 justify-between items-center bg-muted border border-border p-4 mb-8 rounded-none shadow-sm">
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <Button variant="outline" className="gap-2 text-foreground border-border hover:bg-muted" onClick={handleClose}>
            <ChevronLeft className="size-4" strokeWidth={1.5} />
            Назад
          </Button>
          <span className="text-sm font-medium text-muted-foreground">Звіт: {selectedWorkerName}</span>
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
            {/* Shared brand mark (Building03 + wordmark) — design-system.md §6: canonical in Logo.tsx */}
            <Logo />
            <p className="text-sm text-muted-foreground font-semibold mt-1">Система прямої комунікації між студентами та адміністрацією</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div><strong>Звіт по нарядах</strong></div>
            <div>Дата: {new Date().toLocaleDateString("uk-UA")}</div>
            <div>Фільтр: {selectedWorkerName}</div>
          </div>
        </header>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-semibold border border-dashed border-border">
            Не знайдено жодного призначеного звернення для обраного фільтру.
          </div>
        ) : (
          sortedGroupKeys.map((groupKey) => {
            const group = groups[groupKey];
            const w = group.worker;
            return (
              <div key={groupKey} className="mb-8 avoid-break">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-1 mb-4 flex justify-between items-baseline">
                  <span>
                    Працівник: {w ? w.full_name : "Не призначено"}
                    {w && (w.company || w.phone) && (
                      <span className="text-sm font-medium text-muted-foreground ml-2">
                        ({[w.company, w.phone].filter(Boolean).join(", ")})
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">Кількість: {group.complaints.length}</span>
                </h2>

                <table className="w-full text-sm border-collapse border border-border mb-6">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-2 font-bold text-center" style={{ width: "36%" }}>Проблема / Опис</th>
                      <th className="border border-border p-2 font-bold text-center" style={{ width: "16%" }}>Категорія</th>
                      <th className="border border-border p-2 font-bold text-center" style={{ width: "20%" }}>Гуртожиток / Місце</th>
                      <th className="border border-border p-2 font-bold text-center" style={{ width: "14%" }}>Пріоритет</th>
                      <th className="border border-border p-2 font-bold text-center" style={{ width: "14%" }}>Дедлайн</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.complaints.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/50">
                        <td className="border border-border p-2 break-words">
                          <div className="font-bold text-foreground break-words print-title">{c.title || "Без назви"}</div>
                          <div className="text-sm text-muted-foreground break-words whitespace-pre-wrap mt-1 print-description">{c.description || "Без опису"}</div>
                        </td>
                        <td className="border border-border p-2 text-center text-xs">
                          {c.category || "Не вказано"}
                        </td>
                        <td className="border border-border p-2 text-center text-xs">
                          <div className="font-semibold">{c.building || "Не вказано"}</div>
                          <div className="text-muted-foreground">{c.placeName || "—"}{c.isShared && " (спільна)"}</div>
                        </td>
                        <td className="border border-border p-2 text-center text-xs font-semibold">
                          {c.priority ? priorityLabel(c.priority) : "Не визначено"}
                        </td>
                        <td className={`border border-border p-2 text-center text-xs font-semibold ${complaintIsOverdue(c) ? "text-status-danger" : ""}`}>
                          {c.deadline ? new Date(c.deadline).toLocaleDateString("uk-UA") : "Не визначено"}
                          {complaintIsOverdue(c) && <span className="block">Прострочено</span>}
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
              <header className="border-b-2 border-foreground pb-4 mb-6 flex justify-between items-end">
                <div>
                  <Logo />
                  <p className="text-xs text-muted-foreground font-semibold mt-1">Наряд-замовлення</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div><strong>Звернення №{c.id}</strong></div>
                  <div>Дата: {new Date().toLocaleDateString("uk-UA")}</div>
                </div>
              </header>

              <h2 className="text-2xl font-bold text-foreground mb-1">{c.title || "Без назви"}</h2>
              <p className="text-sm text-foreground whitespace-pre-wrap mb-6">{c.description || "Без опису"}</p>

              <table className="w-full text-sm border-collapse border border-border mb-6">
                <tbody>
                  <tr>
                    <td className="border border-border p-2 font-bold bg-muted w-1/3">Категорія</td>
                    <td className="border border-border p-2">{c.category || "Не вказано"}</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-2 font-bold bg-muted">Гуртожиток</td>
                    <td className="border border-border p-2 font-semibold">{c.building || "Не вказано"}</td>
                  </tr>
                   <tr>
                      <td className="border border-border p-2 font-bold bg-muted">{c.isShared ? "Спільне місце" : "Кімната"}</td>
                      <td className="border border-border p-2 font-semibold">{c.placeName || "Не вказано"}</td>
                   </tr>
                  <tr>
                    <td className="border border-border p-2 font-bold bg-muted">Пріоритет</td>
                    <td className="border border-border p-2">{c.priority ? priorityLabel(c.priority) : "Не визначено"}</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-2 font-bold bg-muted">Статус</td>
                    <td className="border border-border p-2">{statusLabel(c.status)}</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-2 font-bold bg-muted">Працівник</td>
                    <td className="border border-border p-2">
                      {w
                        ? `${w.full_name}${[w.company, w.phone].filter(Boolean).length ? ` (${[w.company, w.phone].filter(Boolean).join(", ")})` : ""}`
                        : "Не призначено"}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-border p-2 font-bold bg-muted">Дедлайн</td>
                    <td className={`border border-border p-2 font-semibold ${complaintIsOverdue(c) ? "text-status-danger" : ""}`}>
                      {c.deadline ? new Date(c.deadline).toLocaleDateString("uk-UA") : "Не визначено"}
                          {complaintIsOverdue(c) && <span className="block">Прострочено</span>}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="print-photo">
                <div className="text-sm font-bold text-foreground mb-2">Фото звернення №{c.id}</div>
                {photo ? (
                  <img
                    src={photo}
                    alt={c.title || "Фото звернення"}
                    className="w-full h-auto border border-border rounded-none"
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border">
                    Фото відсутнє
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </PrintDocument>
    </div>
  );
};

export default AdminTicketsPrintPage;
