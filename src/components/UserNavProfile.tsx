import { useState } from "react";
import { LogOut, User, Sun } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { logoutUser } from "@/services/problemsApi";
import { SettingsModal } from "@/components/SettingsModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { UserProfile } from "@/lib/types";

/**
 * Returns formatted display name.
 * Respects last_name first (as in "Ткаченко О. С." / "Франко Іван") or falls back to first_name/email.
 */
export function getDisplayName(user: UserProfile | null): string {
  if (!user) return "Користувач";
  if (user.last_name && user.first_name) {
    return `${user.last_name} ${user.first_name}`;
  }
  return user.last_name || user.first_name || user.email || "Користувач";
}

/**
 * Returns role label in Ukrainian matching the screenshot ("Суперадмін", "Студент", "Працівник").
 */
export function getRoleLabel(user: UserProfile | null): string {
  if (!user || !user.role) return "";
  const roleName = (typeof user.role === "string" ? user.role : user.role.role_name)?.toLowerCase();
  if (roleName === "admin" || roleName === "адміністратор") {
    return "Суперадмін";
  }
  if (roleName === "student" || roleName === "студент") {
    return "Студент";
  }
  if (roleName === "worker" || roleName === "працівник") {
    return "Працівник";
  }
  return typeof user.role === "string" ? user.role : user.role.role_name;
}

interface UserNavProfileProps {
  className?: string;
  showBurger?: boolean;
}

export default function UserNavProfile({ className }: UserNavProfileProps) {
  const { user } = useUser();
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/auth";
  };

  if (!user) return null;

  const displayName = getDisplayName(user);
  const roleLabel = getRoleLabel(user);

  return (
    <>
      <div className={`flex items-center gap-2 sm:gap-3 ${className || ""}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex flex-col text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded px-1.5 py-0.5 -mx-1.5 transition-colors hover:bg-muted/50 select-none"
              title="Меню користувача"
            >
              <span className="text-sm font-semibold text-foreground leading-tight truncate max-w-[110px] xs:max-w-[140px] sm:max-w-[180px] md:max-w-[240px] group-hover:text-primary transition-colors">
                {displayName}
              </span>
              <span className="text-xs text-muted-foreground leading-tight truncate max-w-[110px] xs:max-w-[140px] sm:max-w-[180px] md:max-w-[240px] mt-0.5">
                {roleLabel ? `${roleLabel} · ` : ""}{user.email}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5">
            <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
              <User className="size-4 mr-2" strokeWidth={1.5} />
              <span>Профіль</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div
              className="flex items-center justify-between px-2 py-1.5 text-sm select-none"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Sun className="size-3.5" strokeWidth={1.5} />
                Тема
              </span>
              <ThemeToggle />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setLogoutConfirmOpen(true)}
              variant="destructive"
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="size-4 mr-2" strokeWidth={1.5} />
              <span>Вийти</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SettingsModal open={profileOpen} onOpenChange={setProfileOpen} />

      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
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
    </>
  );
}
