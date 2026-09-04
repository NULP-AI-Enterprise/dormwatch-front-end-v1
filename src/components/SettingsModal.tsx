import { useState } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { logoutUser } from "@/services/problemsApi";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LockPasswordIcon,
  Logout01Icon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@hugeicons/core-free-icons";
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
                  <Badge variant="outline" className="text-muted-foreground bg-card border-border">
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
              <div className="mb-5">
                <Collapsible open={showPasswordChange} onOpenChange={setShowPasswordChange}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-auto py-2 cursor-pointer hover:bg-transparent"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <HugeiconsIcon icon={LockPasswordIcon} className="size-4" strokeWidth={2} />
                        Змінити пароль
                      </span>
                      <HugeiconsIcon
                        icon={showPasswordChange ? ChevronUpIcon : ChevronDownIcon}
                        className="size-4 text-muted-foreground"
                        strokeWidth={2}
                      />
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
                    <HugeiconsIcon icon={Logout01Icon} className="size-3 mr-1.5" strokeWidth={2} />
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
