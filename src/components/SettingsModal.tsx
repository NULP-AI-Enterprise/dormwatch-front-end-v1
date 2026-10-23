import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { logoutUser, updateUserProfile } from "@/services/problemsApi";
import { LockKeyhole, LogOut, ChevronUp, ChevronDown, Phone } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { isAdminUser } from "@/lib/complaintUtils";
import { ERROR_TEXT, ERROR_BG_HOVER } from "@/lib/theme";
import { useUser } from "@/context/UserContext";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { user, refreshUser } = useUser();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [phone, setPhone] = useState(user?.phone || "");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    setPhone(user?.phone || "");
  }, [user?.phone]);

  const isAdmin = isAdminUser(user);
  const isStudent =
    !isAdmin &&
    user?.role?.role_name?.toLowerCase() !== "worker" &&
    user?.role?.role_name?.toLowerCase() !== "працівник";

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPhone(true);
    setPhoneError(null);
    try {
      await updateUserProfile({ phone: phone.trim() });
      setPhoneSaved(true);
      refreshUser();
      window.dispatchEvent(new Event("profileUpdated"));
      setTimeout(() => setPhoneSaved(false), 2500);
    } catch {
      setPhoneError("Не вдалося зберегти номер телефону");
    } finally {
      setIsSavingPhone(false);
    }
  };

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
          <DialogDescription>Ваш профіль та налаштування</DialogDescription>
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
                  isAdmin ? (
                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 font-semibold text-yellow-500 bg-yellow-500/10 border-yellow-700/50">
                      Адмін
                    </Badge>
                  ) : user.role?.role_name?.toLowerCase() === "worker" || user.role?.role_name?.toLowerCase() === "працівник" ? (
                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 font-semibold text-orange-500 bg-orange-500/10 border-orange-700/50">
                      Працівник
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 font-semibold text-blue-500 bg-blue-500/10 border-blue-700/50">
                      Студент
                    </Badge>
                  )
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-5">
              {isStudent && (
                <div className="mb-5 space-y-2 border border-border p-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Phone className="size-4 text-muted-foreground" strokeWidth={1.5} />
                      Номер телефону
                    </label>
                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 font-normal text-muted-foreground border-border">
                      Опціонально
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Номер телефону є опціональним, але буде корисним майстру або коменданту, якщо вас не буде в гуртожитку, щоб домовитись на зручний час.
                  </p>
                  <form onSubmit={handleSavePhone} className="flex gap-2 pt-1">
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneSaved(false);
                      }}
                      placeholder="+380..."
                      className="rounded-none text-sm h-9 bg-background"
                      disabled={isSavingPhone}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSavingPhone || phone === (user?.phone || "")}
                      className="shrink-0 rounded-none h-9 font-semibold"
                    >
                      {isSavingPhone ? "Збереження..." : phoneSaved ? "Збережено!" : "Зберегти"}
                    </Button>
                  </form>
                  {phoneError && (
                    <p className="text-xs text-sky-500 dark:text-sky-400 font-semibold">{phoneError}</p>
                  )}
                </div>
              )}

              <div className="mb-5">
                <Collapsible open={showPasswordChange} onOpenChange={setShowPasswordChange}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-auto py-2 cursor-pointer hover:bg-transparent"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <LockKeyhole className="size-4" strokeWidth={2} />
                        Змінити пароль
                      </span>
                      {showPasswordChange ? (
                        <ChevronUp
                          className="size-4 text-muted-foreground"
                          strokeWidth={2}
                        />
                      ) : (
                        <ChevronDown
                          className="size-4 text-muted-foreground"
                          strokeWidth={2}
                        />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-3 border border-border bg-card p-4">
                      <ChangePasswordForm />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <Separator dashed className="my-5" />

<AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full ${ERROR_TEXT} ${ERROR_BG_HOVER}`}
                  >
                    <LogOut className="size-3 mr-1.5" strokeWidth={2} />
                    Вийти
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Вийти з акаунту?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ви впевнені, що хочете вийти з облікового запису?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Скасувати</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLogout}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Вийти
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { SettingsModal };
