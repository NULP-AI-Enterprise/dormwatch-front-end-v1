import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAllComplaints,
  fetchCategories,
} from "@/services/problemsApi";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import { StatCard, StatCardSkeleton } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import {
  FilterSearchInput,
  StatusFilterSelect,
  BuildingFilterSelect,
  PriorityFilterSelect,
  CategoryFilterCombobox,
} from "@/components/ComplaintFilters";
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
import { ClockIcon, HammerIcon, CheckmarkCircleIcon } from "@hugeicons/core-free-icons";
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

  const buildings = useBuildings();
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBuilding, setFilterBuilding] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategories, setFilterCategories] = useState<string[]>([]);

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
    const categoryOk =
      filterCategories.length === 0 ||
      (c.category != null && filterCategories.includes(c.category));
    return searchOk && statusOk && buildingOk && priorityOk && categoryOk;
  });

  const recentComplaints = [...filteredComplaints]
    .sort((a, b) => {
      // Records without a timestamp sort last.
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : -Infinity;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : -Infinity;
      return tb - ta;
    })
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
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <Card className="border-border shadow-none bg-card">
                <CardContent className="space-y-4">
                  <FilterSearchInput value={searchQuery} onChange={setSearchQuery} />
                  <StatusFilterSelect value={filterStatus} onValueChange={setFilterStatus} />
                  <BuildingFilterSelect
                    value={filterBuilding}
                    onValueChange={setFilterBuilding}
                    buildings={buildings}
                  />
                  <PriorityFilterSelect value={filterPriority} onValueChange={setFilterPriority} />
                  <CategoryFilterCombobox
                    value={filterCategories}
                    onChange={setFilterCategories}
                    categories={categories}
                  />
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
              />
              <StatCard
                icon={<HugeiconsIcon icon={HammerIcon} className="size-4" strokeWidth={1.5} />}
                label="В роботі"
                value={inProgressCount}
              />
              <StatCard
                icon={<HugeiconsIcon icon={CheckmarkCircleIcon} className="size-4" strokeWidth={1.5} />}
                label="Вирішено"
                value={resolvedCount}
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
    </div>
  );
};

export default AdminPage;
