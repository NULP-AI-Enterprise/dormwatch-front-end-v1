import { RoleBadge } from "@/components/RoleBadge";
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
import { Separator } from "@/components/ui/separator";
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
  const { user } = useUser();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showPhoneChange, setShowPhoneChange] = useState(false);
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
    const normalizedPhone = phone.trim().replace(/[\s().-]/g, "");
    setPhoneError(null);
    setPhoneSaved(false);
    if (normalizedPhone && !/^\+[1-9]\d{6,14}$/.test(normalizedPhone)) {
      setPhoneError("Вкажіть код країни й номер, наприклад +380671234567.");
      return;
    }
    setIsSavingPhone(true);
    try {
      await updateUserProfile({ phone: normalizedPhone });
      setPhone(normalizedPhone);
      setPhoneSaved(true);
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
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-foreground break-words">
                  {user ? `${user.first_name} ${user.last_name}` : "Завантаження..."}
                </p>
                {user && <RoleBadge role={user.role?.role_name} isAdmin={isAdmin} />}
              </div>
              <p className="text-xs text-muted-foreground break-all">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex-1 min-h-0 min-w-0 overflow-y-auto">
            <div className="p-5">
              {isStudent && (
                <Collapsible open={showPhoneChange} onOpenChange={setShowPhoneChange} className="mb-5">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between h-auto py-2 cursor-pointer hover:bg-transparent">
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Phone className="size-4" strokeWidth={2} />
                        Змінити номер телефону
                      </span>
                      {showPhoneChange ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                <div className="mt-2 space-y-2">
                  <label htmlFor="profile-phone" className="sr-only">Номер телефону</label>
                  <form onSubmit={handleSavePhone} className="flex flex-col sm:flex-row gap-2 pt-1">
                    <Input
                      id="profile-phone"
                      autoComplete="tel"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneSaved(false);
                        setPhoneError(null);
                      }}
                      placeholder="+380671234567"
                      inputMode="tel"
                      maxLength={32}
                      aria-invalid={!!phoneError}
                      aria-describedby={phoneError ? "profile-phone-error" : undefined}
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
                    <p id="profile-phone-error" role="alert" className="text-xs text-destructive font-semibold">{phoneError}</p>
                  )}
                  {phoneSaved && <span role="status" className="sr-only">Номер телефону збережено.</span>}
                </div>
                  </CollapsibleContent>
                </Collapsible>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { SettingsModal };
