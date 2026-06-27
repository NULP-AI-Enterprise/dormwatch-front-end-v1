import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchAllComplaints,
  fetchUserProfile,
} from "../services/problemsApi";
import AdminSidebar from "../components/AdminSidebar";
import { StatCard, StatCardSkeleton } from "../components/StatCard";
import ComplaintSidePanel from "../components/ComplaintSidePanel";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../components/ui/table";
import { Clock, Hammer, CheckCircle, Download, Plus } from "lucide-react";
import { statusBadgeClass, statusLabel, isAdminUser, getUserInitials } from "../lib/complaintUtils";
import { CATEGORY_LABELS } from "../services/problemsApi";

const AdminPage = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      const user = await fetchUserProfile().catch(() => null);
      if (!user) {
        navigate("/");
        return;
      }
      if (!isAdminUser(user)) {
        navigate("/");
        return;
      }
      setCurrentUser(user);
      const data = await fetchAllComplaints();
      setComplaints(data);
      setLoading(false);
    };
    init();
  }, [navigate]);

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

  const initials = getUserInitials(currentUser, "AD");

  const userName = currentUser
    ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || "Admin"
    : "Admin";

  return (
    <div className="flex min-h-screen dark bg-stone-900">
      <AdminSidebar
        userName={userName}
        userRole="Адміністратор"
        initials={initials}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-stone-800 border-b border-stone-700 flex items-center justify-between px-6 lg:px-8 shrink-0">
          <h1 className="text-2xl font-bold text-stone-50">Інформаційна панель</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="default"
              className="hidden md:inline-flex items-center gap-2 text-base font-semibold border-stone-600 text-stone-300 hover:bg-stone-700"
            >
              <Download className="w-4 h-4" strokeWidth={2} />
              Експорт даних
            </Button>
            <Button
              size="default"
              className="inline-flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-base font-semibold"
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
              <Plus className="w-5 h-5" strokeWidth={2} />
              Нове замовлення
            </Button>
          </div>
        </header>

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
                icon={<Clock className="w-4 h-4" strokeWidth={1.5} />}
                label="Очікує"
                value={pendingCount}
                sparklineColor="#eab308"
              />
              <StatCard
                icon={<Hammer className="w-4 h-4" strokeWidth={1.5} />}
                label="В роботі"
                value={inProgressCount}
                sparklineColor="#3b82f6"
              />
              <StatCard
                icon={<CheckCircle className="w-4 h-4" strokeWidth={1.5} />}
                label="Вирішено"
                value={resolvedCount}
                sparklineColor="#22c55e"
              />
              </div>
            )}

            <div className="bg-stone-800 border border-stone-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-stone-50">Останні заявки</h2>
                <Link to="/admin/complaints" className="text-sm font-semibold text-blue-500 hover:text-blue-400">
                  Всі заявки
                </Link>
              </div>
              <Table className="text-left border-collapse">
                <TableHeader>
                  <TableRow className="bg-stone-900/50 border-b border-stone-700 text-sm text-stone-400">
                    <TableHead className="px-6 py-3 font-semibold">Проблема</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Категорія</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Дата подання</TableHead>
                    <TableHead className="px-6 py-3 font-semibold">Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-base divide-y divide-stone-700">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell className="px-6 py-4">
                          <div className="h-5 w-48 bg-stone-700/50 mb-1" />
                          <div className="h-4 w-32 bg-stone-700/30" />
                        </TableCell>
                        <TableCell className="px-6 py-4"><div className="h-5 w-20 bg-stone-700/50" /></TableCell>
                        <TableCell className="px-6 py-4"><div className="h-5 w-24 bg-stone-700/50" /></TableCell>
                        <TableCell className="px-6 py-4"><div className="h-6 w-16 bg-stone-700/50" /></TableCell>
                      </TableRow>
                    ))
                  ) : recentComplaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="px-6 py-8 text-center">
                        <p className="text-sm text-stone-400">Заявок поки немає.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentComplaints.map((c) => (
                      <TableRow
                        key={c.id}
                        className="group relative bg-stone-800 hover:bg-stone-700/50 transition-colors cursor-pointer"
                        onClick={() => handleRowClick(c)}
                      >
                        <TableCell className="px-6 py-4">
                          <p className="font-semibold text-stone-50">
                            {c.title}
                          </p>
                          <p className="text-sm text-stone-400 mt-0.5">
                            {c.description}
                          </p>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                          {CATEGORY_LABELS[c.category as keyof typeof CATEGORY_LABELS] || c.category}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm text-stone-300">
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

        <footer className="p-4 border-t border-stone-700">
          <p className="text-[9px] font-semibold text-stone-500 uppercase tracking-wider text-center">
            DormWatch &middot; Система керування об'єктами
          </p>
        </footer>
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
