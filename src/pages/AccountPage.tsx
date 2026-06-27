import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchUserProfile,
  logoutUser,
  updateUserProfile,
  changeUserRoom,
  fetchAllComplaints,
  fetchBuildings,
} from "../services/problemsApi";
import { Building2, Home, Phone, LogOut } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import LoadingSpinner from "../components/LoadingSpinner";
import UserPage from "./UserPage";
import { priorityBadgeClass, priorityLabel, isAdminUser } from "../lib/complaintUtils";

const CONTACT_PHONES = {
  commandant: "093 123 45 67",
  dutyMaster: "067 987 65 43",
};

const AdminProfileView = () => {
  const [stats, setStats] = useState({
    pending: 0,
    critical: 0,
    resolvedThisMonth: 0,
  });
  const [urgentIssues, setUrgentIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const complaints = await fetchAllComplaints();
        const pending = complaints.filter(
          (c: any) => c.status === "pending"
        ).length;
        const resolved = complaints.filter(
          (c: any) => c.status === "resolved"
        ).length;
        const activeIssues = complaints.filter(
          (c: any) => c.status !== "resolved"
        );
        const criticalIssues = activeIssues.filter(
          (c: any) =>
            c.priority === "critical" || c.priority === "high"
        );
        setStats({
          pending,
          critical: criticalIssues.length,
          resolvedThisMonth: resolved,
        });
        const activeUrgent = criticalIssues
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
          .slice(0, 5);
        setUrgentIssues(activeUrgent);
      } catch {
        console.warn("Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-none">
        <CardContent className="p-6 pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">
              Швидка статистика
            </h3>
            <Button
              asChild
              size="xs"
              variant="outline"
              className="text-[10px] font-bold uppercase tracking-wider"
            >
              <Link to="/admin">Перейти до керування &rarr;</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 border border-yellow-500/30 bg-yellow-500/5">
              <p className="text-3xl font-bold text-yellow-500">
                {stats.pending}
              </p>
              <p className="micro-label mt-1">Очікують розгляду</p>
            </div>
            <div className="p-4 border border-red-500/30 bg-red-500/5">
              <p className="text-3xl font-bold text-red-500">
                {stats.critical}
              </p>
              <p className="micro-label mt-1">Критичні проблеми</p>
            </div>
            <div className="p-4 border border-green-500/30 bg-green-500/5">
              <p className="text-3xl font-bold text-green-500">
                {stats.resolvedThisMonth}
              </p>
              <p className="micro-label mt-1">Вирішено (загалом)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-none">
        <CardContent className="p-6 pt-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-500"></span>
            Термінові проблеми
          </h3>
          {urgentIssues.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground border border-dashed border-border">
              Наразі немає критичних проблем. Все спокійно!
            </div>
          ) : (
            <div className="space-y-3">
              {urgentIssues.map((issue: any) => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between p-3 border border-border gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={`badge-status ${priorityBadgeClass(issue.priority)}`}
                      >
                        {priorityLabel(issue.priority)}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {issue.building
                          ? `Корпус ${issue.building}`
                          : ""}{" "}
                        &middot; {issue.placeName}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {issue.title}
                    </p>
                  </div>
                  <Button
                    asChild
                    size="xs"
                    className="text-[10px] font-bold uppercase tracking-wider shrink-0"
                  >
                    <Link to="/admin">Розглянути</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const AccountPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [buildings, setBuildings] = useState<Array<{building_id: number, name: string}>>([]);

  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    building: "4",
    floor: "",
    room: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    fetchBuildings().then(setBuildings).catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [loading, user, navigate]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await fetchUserProfile();
      setUser(data);
      if (data) {
        const placeObj = data.place;
        setEditForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          building: placeObj?.building?.building_id
            ? String(placeObj.building.building_id)
            : "4",
          floor: "",
          room: placeObj?.place_name || "",
        });
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateUserProfile({
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        photoFile: photoFile,
      });
      if (editForm.building && editForm.floor && editForm.room) {
        await changeUserRoom(
          parseInt(editForm.building),
          parseInt(editForm.floor),
          editForm.room
        );
      }
      await loadProfile();
      window.dispatchEvent(new Event("profileUpdated"));
      setIsEditing(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      alert("Профіль оновлено!");
    } catch {
      alert("Помилка при збереженні. Перевірте дані.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const placeObj = user.place;
  const buildingObj = placeObj?.building;
  const buildingInfo = buildingObj
    ? buildingObj.name ||
      `№${buildingObj.number || buildingObj.building_id || "?"}`
    : "Не вказано";
  const roomInfo = placeObj
    ? placeObj.place_name
    : "Кімната не вказана";
  const admin = isAdminUser(user);
  const SERVER_URL = "http://127.0.0.1:8000";
  let avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${
    user.first_name || "Guest"
  }`;
  if (user.photo_url) {
    const path = user.photo_url;
    const isAbsolute = path.startsWith("http") || path.startsWith("blob:");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    avatarUrl = isAbsolute
      ? path
      : `${SERVER_URL}${cleanPath.startsWith("/api") ? "" : "/api"}${cleanPath}`;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-border shadow-none overflow-hidden">
            {!isEditing ? (
              <>
                <div className="h-20 bg-primary relative">
                  <div className="absolute -bottom-8 left-6">
                    <div className="w-16 h-16 bg-card border border-border p-0.5">
                      <img
                        src={avatarUrl}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-12 pb-6 px-6">
                  <h2 className="text-lg font-bold text-foreground">
                    {user.first_name} {user.last_name}
                  </h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    {user.email}
                  </p>
                  {admin && (
                    <Badge
                      variant="outline"
                      className="badge-progress mb-4"
                    >
                      Адміністратор
                    </Badge>
                  )}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 link-hover cursor-default py-1">
                      <div className="w-7 h-7 bg-muted border border-border flex items-center justify-center">
                        <Building2
                          className="w-3.5 h-3.5 text-primary"
                          strokeWidth={2}
                        />
                      </div>
                      <div>
                        <p className="micro-label">Гуртожиток</p>
                        <p className="text-xs font-semibold text-foreground">
                          {buildingInfo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 link-hover cursor-default py-1">
                      <div className="w-7 h-7 bg-muted border border-border flex items-center justify-center">
                        <Home
                          className="w-3.5 h-3.5 text-primary"
                          strokeWidth={2}
                        />
                      </div>
                      <div>
                        <p className="micro-label">Розміщення</p>
                        <p className="text-xs font-semibold text-foreground">
                          {roomInfo}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-[10px] font-bold uppercase tracking-wider"
                      onClick={() => setIsEditing(true)}
                    >
                      Редагувати
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-[10px] font-bold uppercase tracking-wider"
                      onClick={logoutUser}
                    >
                      <LogOut className="w-3 h-3 mr-1" strokeWidth={2} />
                      Вийти
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-6">
                  Редагування
                </h3>
                <div className="mb-6 flex flex-col items-center">
                  <div className="w-20 h-20 bg-muted border border-border overflow-hidden mb-3">
                    <img
                      src={photoPreview || avatarUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="cursor-pointer text-xs font-semibold text-primary hover:underline">
                    Обрати нове фото
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="micro-label block mb-1">Ім'я</label>
                    <Input
                      name="first_name"
                      value={editForm.first_name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          [e.target.name]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="micro-label block mb-1">
                      Прізвище
                    </label>
                    <Input
                      name="last_name"
                      value={editForm.last_name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          [e.target.name]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="micro-label block mb-1">Email</label>
                    <Input
                      name="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          [e.target.name]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="pt-4 border-t border-dashed border-border">
                    <p className="text-xs font-bold text-primary uppercase mb-3">
                      Зміна кімнати
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Корпус
                        </label>
                        <Select
                          value={editForm.building}
                          onValueChange={(value) =>
                            setEditForm((prev) => ({ ...prev, building: value }))
                          }
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="Оберіть корпус" />
                          </SelectTrigger>
                          <SelectContent>
                            {buildings.map((b) => (
                              <SelectItem key={b.building_id} value={String(b.building_id)}>
                                {b.name || `№${b.building_id}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Поверх
                        </label>
                        <Input
                          name="floor"
                          type="number"
                          value={editForm.floor}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              [e.target.name]: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Кімната
                        </label>
                        <Input
                          name="room"
                          value={editForm.room}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              [e.target.name]: e.target.value,
                            }))
                          }
                          placeholder="405"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 text-[10px] font-bold uppercase tracking-wider"
                    >
                      {saving ? "Зберігаю..." : "Зберегти"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-[10px] font-bold uppercase tracking-wider"
                      onClick={() => {
                        setIsEditing(false);
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                    >
                      Скасувати
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="border-border shadow-none">
            <CardContent className="p-5 pt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3 inline-flex items-center gap-2">
                <span className="w-1 h-3 bg-primary"></span>
                Контакти допомоги
              </h4>
              <div className="space-y-2">
                <div className="p-3 bg-muted border border-border">
                  <p className="micro-label mb-0.5">Комендант</p>
                  <p className="text-xs font-bold text-primary tracking-tight inline-flex items-center gap-1.5">
                    <Phone className="w-3 h-3" strokeWidth={2} />
                    {CONTACT_PHONES.commandant}
                  </p>
                </div>
                <div className="p-3 bg-muted border border-border">
                  <p className="micro-label mb-0.5">Черговий майстер</p>
                  <p className="text-xs font-bold text-primary tracking-tight inline-flex items-center gap-1.5">
                    <Phone className="w-3 h-3" strokeWidth={2} />
                    {CONTACT_PHONES.dutyMaster}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {admin ? <AdminProfileView /> : <UserPage />}
        </div>
      </div>
    </main>
  );
};

export default AccountPage;
