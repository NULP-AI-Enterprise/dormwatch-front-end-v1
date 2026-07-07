import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchUserProfile, logoutUser } from "@/services/problemsApi";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiPhone01Icon,
  ShieldIcon,
  Briefcase01Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import LoadingSpinner from "@/components/LoadingSpinner";
import { isAdminUser, getUserInitials } from "@/lib/complaintUtils";

const CONTACT_PHONES = {
  commandant: "093 123 45 67",
  dutyMaster: "067 987 65 43",
};

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUserProfile();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open, loadProfile]);

  const SERVER_URL = "http://127.0.0.1:8000";
  const userInitials = getUserInitials(user, "U");
  const photoUrl = user?.photo_url
    ? (() => {
        const path = user.photo_url;
        const isAbsolute = path.startsWith("http") || path.startsWith("blob:");
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        return isAbsolute
          ? path
          : `${SERVER_URL}${cleanPath.startsWith("/api") ? "" : "/api"}${cleanPath}`;
      })()
    : null;

  const isAdmin = isAdminUser(user);

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/auth";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl md:max-w-2xl p-0 gap-0 overflow-hidden"
        showCloseButton
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Налаштування</DialogTitle>
          <DialogDescription>Керування профілем та налаштуваннями</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col max-h-[80vh]">
          <div className="flex items-center gap-4 px-5 py-4 border-b border-border bg-card">
            <div className="w-12 h-12 bg-muted border border-border shrink-0 overflow-hidden flex items-center justify-center">
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : photoUrl ? (
                <img
                  src={photoUrl}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <span className="text-sm font-bold text-muted-foreground">
                  {userInitials}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground truncate">
                  {user ? `${user.first_name} ${user.last_name}` : "Завантаження..."}
                </p>
                {user && (
                  <Badge variant="outline" className={`${isAdmin ? "text-yellow-500 bg-yellow-500/10 border-yellow-700/50" : "text-blue-500 bg-blue-500/10 border-blue-700/50"}`}>
                    {isAdmin ? "Адмін" : "Студент"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-5">
              <h4 className="text-xs font-bold text-muted-foreground mb-6">
                Екстрені контакти
              </h4>
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-muted border border-border p-4">
                  <div className="p-2 bg-card border border-border shrink-0">
                    <HugeiconsIcon icon={Briefcase01Icon} className="size-4 text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">
                      Комендант
                    </p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {CONTACT_PHONES.commandant}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-muted border border-border p-4">
                  <div className="p-2 bg-card border border-border shrink-0">
                    <HugeiconsIcon icon={AiPhone01Icon} className="size-4 text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">
                      Черговий майстер
                    </p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {CONTACT_PHONES.dutyMaster}
                    </p>
                  </div>
                </div>
                <div className="p-3 border border-dashed border-border text-center">
                  <HugeiconsIcon icon={ShieldIcon} className="size-5 text-muted-foreground mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-xs text-muted-foreground font-semibold">
                    Екстрені ситуації — телефонуйте 101 або 112
                  </p>
                </div>
              </div>

              <Separator dashed className="my-5" />

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/10"
                onClick={handleLogout}
              >
                <HugeiconsIcon icon={Logout01Icon} className="size-3 mr-1.5" strokeWidth={2} />
                Вийти
              </Button>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { SettingsModal };
