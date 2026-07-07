import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAllComplaints,
  fetchCategories,
} from "@/services/problemsApi";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import { NotificationBell } from "@/components/NotificationBell";
import { StatCard, StatCardSkeleton } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExportTicketsModal } from "@/components/ExportTicketsModal";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { HugeiconsIcon } from "@hugeicons/react";
import { ClockIcon, HammerIcon, CheckmarkCircleIcon, Download01Icon, AddIcon, SearchIcon } from "@hugeicons/core-free-icons";
import { formatDate } from "@/lib/dateUtils";
import { useBuildings } from "@/hooks/useBuildings";
import { useUser } from "@/context/UserContext";
import type { Complaint, CategoryOption } from "@/lib/types";

const AdminPage = () => {
  const { user: currentUser } = useUser();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const buildings = useBuildings();
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBuilding, setFilterBuilding] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const init = async () => {
    const data = await fetchAllComplaints();
    setComplaints(data);
    setLoading(false);
  };

  useEffect(() => {
    init();
    fetchCategories().then(setCategories).catch(() => {});

    window.addEventListener("adminComplaintUpdated", init);
    return () => window.removeEventListener("adminComplaintUpdated", init);
  }, []);

  const pendingCount = complaints.filter((c) => c.status === "pending").length;
  const inProgressCount = complaints.filter((c) => c.status === "approved").length;
  const resolvedCount = complaints.filter((c) => c.status === "resolved").length;

  const filteredComplaints = complaints.filter((c) => {
    const searchOk = !searchQuery ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const statusOk = filterStatus === "all" || c.status === filterStatus;
    const buildingOk = filterBuilding === "all" || c.building === filterBuilding;
    const priorityOk = filterPriority === "all" || c.priority === filterPriority;
    const categoryOk = filterCategory === "all" || c.category === filterCategory;
    return searchOk && statusOk && buildingOk && priorityOk && categoryOk;
  });

  const recentComplaints = [...filteredComplaints]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const handleRowClick = (complaint: Complaint) => {
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
            <NotificationBell onSelectComplaint={(c) => {
              setSelectedComplaint(c);
              setSheetOpen(true);
            }} />
            <Button
              variant="outline"
              size="default"
              className="gap-2"
              onClick={() => setIsExportModalOpen(true)}
            >
              <HugeiconsIcon icon={Download01Icon} className="size-4" strokeWidth={2} />
              Експорт даних
            </Button>
            <Button
              size="default"
              className="gap-2"
              onClick={() => {
                setSelectedComplaint({
                  id: "new" as unknown as number,
                  title: "",
                  description: "",
                  category: "",
                  status: "pending",
                  building: "",
                  room: "",
                  placeName: "",
                  floor: "",
                  priority: "medium",
                  createdAt: "",
                  photoUrl: null,
                  thumbnail: null,
                  user_id: null,
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
          <div className="max-w-6xl mx-auto grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <Card className="border-border shadow-none bg-card">
                <CardContent className="p-4 space-y-4">
                  <div className="relative">
                    <HugeiconsIcon icon={SearchIcon} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" strokeWidth={2} />
                    <Input
                      placeholder="Пошук заявок..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всі</SelectItem>
                      <SelectItem value="pending">Очікує</SelectItem>
                      <SelectItem value="approved">Активно</SelectItem>
                      <SelectItem value="rejected">Відхилено</SelectItem>
                      <SelectItem value="resolved">Вирішено</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterBuilding} onValueChange={setFilterBuilding}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Всі гуртожитки" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всі гуртожитки</SelectItem>
                      {buildings.map((b) => (
                        <SelectItem key={b.building_id} value={b.name}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Всі пріоритети" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всі пріоритети</SelectItem>
                      <SelectItem value="low">Низький</SelectItem>
                      <SelectItem value="medium">Середній</SelectItem>
                      <SelectItem value="high">Високий</SelectItem>
                      <SelectItem value="critical">Критичний</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={filterCategory === "all" ? "default" : "outline"}
                      size="xs"
                      onClick={() => setFilterCategory("all")}
                    >
                      Всі
                    </Button>
                    {categories.map((cat) => (
                      <Button
                        key={cat.category_id}
                        variant={filterCategory === cat.name ? "default" : "outline"}
                        size="xs"
                        onClick={() => setFilterCategory(filterCategory === cat.name ? "all" : cat.name)}
                      >
                        {cat.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-8">
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
                <h2 className="text-xl font-semibold text-foreground">Останні скарги</h2>
                <Link to="/admin/complaints" className="text-sm font-semibold text-blue-500 hover:text-blue-400">
                  Всі скарги
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
                          <p className="text-sm text-muted-foreground mt-0.5 break-all whitespace-pre-wrap">
                            {c.description}
                          </p>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-xs text-muted-foreground font-semibold">
                          {c.category}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                          {formatDate(c.createdAt)}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge status={c.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            </div>
          </div>
        </div>

      {selectedComplaint && (
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
      )}

      <ExportTicketsModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
      />
    </div>
  );
};

export default AdminPage;
