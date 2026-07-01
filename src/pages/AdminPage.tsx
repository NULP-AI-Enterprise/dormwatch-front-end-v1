import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAllComplaints,
} from "../services/problemsApi";
import ComplaintSidePanel from "../components/ComplaintSidePanel";
import { StatCard, StatCardSkeleton } from "../components/StatCard";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../components/ui/table";
import { HugeiconsIcon } from "@hugeicons/react";
import { ClockIcon, HammerIcon, CheckmarkCircleIcon, Download01Icon, AddIcon } from "@hugeicons/core-free-icons";
import { statusBadgeClass, statusLabel } from "../lib/complaintUtils";
import { CATEGORY_LABELS } from "../services/problemsApi";
import { useUser } from "../context/UserContext";

const AdminPage = () => {
  const { user: currentUser } = useUser();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      const data = await fetchAllComplaints();
      setComplaints(data);
      setLoading(false);
    };
    init();
  }, []);

  const pendingCount = complaints.filter((c) => c.status === "pending").length;
  const inProgressCount = complaints.filter((c) => c.status === "approved").length;
  const resolvedCount = complaints.filter((c) => c.status === "resolved").length;

  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const handleRowClick = (complaint: any) => {
    setSelectedComplaint(complaint);
    setSheetOpen(true);
  };

  const handleRefresh = async () => {
    const data = await fetchAllComplaints();
    setComplaints(data);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="h-16 bg-card flex items-center justify-between px-6 lg:px-8 shrink-0">
          <h1 className="text-2xl font-bold text-foreground">Інформаційна панель</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="default"
              className="gap-2"
            >
              <HugeiconsIcon icon={Download01Icon} className="size-4" strokeWidth={2} />
              Експорт даних
            </Button>
            <Button
              size="default"
              className="gap-2"
              onClick={() => {
                setSelectedComplaint({
                  id: "new",
                  title: "",
                  description: "",
                  category: "",
                  status: "pending",
                  building: "",
                  placeName: "",
                  priority: "medium",
                  createdAt: "",
                  photoUrl: null,
                  thumbnail: null,
                });
                setSheetOpen(true);
              }}
            >
              <HugeiconsIcon icon={AddIcon} className="size-5" strokeWidth={2} />
              Новий тікет
            </Button>
          </div>
        </header>
        <Separator />

        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <StatCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                icon={<HugeiconsIcon icon={ClockIcon} className="size-4" strokeWidth={1.5} />}
                label="Очікує"
                value={pendingCount}
                sparklineColor="#eab308"
              />
              <StatCard
                icon={<HugeiconsIcon icon={HammerIcon} className="size-4" strokeWidth={1.5} />}
                label="В роботі"
                value={inProgressCount}
                sparklineColor="#3b82f6"
              />
              <StatCard
                icon={<HugeiconsIcon icon={CheckmarkCircleIcon} className="size-4" strokeWidth={1.5} />}
                label="Вирішено"
                value={resolvedCount}
                sparklineColor="#22c55e"
              />
              </div>
            )}

            <div className="bg-card border border-border overflow-hidden">
              <div className="px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-foreground">Останні заявки</h2>
                <Link to="/admin/complaints" className="text-sm font-semibold text-blue-500 hover:text-blue-400">
                  Всі заявки
                </Link>
              </div>
              <Separator />
              <Table className="text-left border-collapse">
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b border-border text-sm text-muted-foreground">
                    <TableHead className="px-6 py-3 font-semibold">Проблема</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Категорія</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Дата подання</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-base divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell className="px-6 py-4">
                          <div className="h-5 w-3/4 bg-muted/50 mb-1" />
                          <div className="h-4 w-1/2 bg-muted/30" />
                        </TableCell>
                        <TableCell className="px-6 py-4"><div className="h-5 w-1/3 bg-muted/50" /></TableCell>
                        <TableCell className="px-6 py-4"><div className="h-5 w-1/2 bg-muted/50" /></TableCell>
                        <TableCell className="px-6 py-4"><div className="h-6 w-1/4 bg-muted/50" /></TableCell>
                      </TableRow>
                    ))
                  ) : recentComplaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="px-6 py-8 text-center">
                        <p className="text-sm text-muted-foreground">Заявок поки немає.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentComplaints.map((c) => (
                      <TableRow
                        key={c.id}
                        className="group relative bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleRowClick(c)}
                      >
                        <TableCell className="px-6 py-4">
                          <p className="font-semibold text-foreground">
                            {c.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {c.description}
                          </p>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-xs text-muted-foreground font-semibold">
                          {CATEGORY_LABELS[c.category as keyof typeof CATEGORY_LABELS] || c.category}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant="outline" className={statusBadgeClass(c.status)}>
                            {statusLabel(c.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

      <ComplaintSidePanel
        complaint={selectedComplaint}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
        }}
        onStatusChange={handleRefresh}
        currentUserId={currentUser?.user}
        isAdmin={true}
      />
    </div>
  );
};

export default AdminPage;
