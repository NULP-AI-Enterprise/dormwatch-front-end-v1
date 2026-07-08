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
import { logoutUser } from "@/services/problemsApi";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiPhone01Icon,
  ShieldIcon,
  Briefcase01Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import UserAvatar from "@/components/UserAvatar";
import { isAdminUser } from "@/lib/complaintUtils";
import { useUser } from "@/context/UserContext";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { user } = useUser();

  const isAdmin = isAdminUser(user);

  // Per-dorm emergency contacts come from the user's building config; a building
  // without a number simply omits that row (no fabricated placeholder).
  const commandantPhone = user?.place?.building?.commandant_phone;
  const dutyMasterPhone = user?.place?.building?.duty_master_phone;

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
          <DialogTitle>Профіль</DialogTitle>
          <DialogDescription>Ваш профіль та екстрені контакти</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col max-h-[80vh]">
          <div className="flex items-center gap-4 px-5 py-4 border-b border-border bg-card">
            <UserAvatar user={user} size="lg" />
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
                {commandantPhone && (
                  <div className="flex items-center gap-4 bg-muted border border-border p-4">
                    <div className="p-2 bg-card border border-border shrink-0">
                      <HugeiconsIcon icon={Briefcase01Icon} className="size-4 text-primary" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">
                        Комендант
                      </p>
                      <p className="text-sm font-bold text-foreground mt-0.5">
                        {commandantPhone}
                      </p>
                    </div>
                  </div>
                )}
                {dutyMasterPhone && (
                  <div className="flex items-center gap-4 bg-muted border border-border p-4">
                    <div className="p-2 bg-card border border-border shrink-0">
                      <HugeiconsIcon icon={AiPhone01Icon} className="size-4 text-primary" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">
                        Черговий майстер
                      </p>
                      <p className="text-sm font-bold text-foreground mt-0.5">
                        {dutyMasterPhone}
                      </p>
                    </div>
                  </div>
                )}
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
