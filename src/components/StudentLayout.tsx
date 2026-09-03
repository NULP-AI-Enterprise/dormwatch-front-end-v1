import { Link, useLocation } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronDownIcon, Logout01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { type ReactNode, useState } from "react";
import { isAdminUser } from "@/lib/complaintUtils";
import { SELECTED } from "@/lib/theme";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
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
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import { SettingsModal } from "@/components/SettingsModal";
import Logo from "@/components/Logo";
import UserAvatar from "@/components/UserAvatar";
import type { Complaint } from "@/lib/types";
import { logoutUser, fetchComplaintDetail } from "@/services/problemsApi";

const StudentLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useUser();
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const admin = isAdminUser(user);
  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/auth";
  };

  // Single tab spine (the nav is the only tab structure — no in-page tabs).
  // The primary "Створити звернення" CTA lives front-and-center in page bodies,
  // not here. The resident tabs (/user, /my-complaints) are
  // blockAdmin routes, so they must NOT be shown to an admin who reaches this
  // layout via /dashboard — they'd bounce straight back to /admin. Admins get
  // only the two routes they can actually stay on.
  const navItems = admin
    ? [
        // Disambiguated from the admin's moderation queue: this is the public
        // board, not the work surface.
        { to: "/dashboard", label: "Дошка звернень" },
        { to: "/admin", label: "Адмін-панель" },
      ]
    : [
        { to: "/user", label: "Огляд" },
        { to: "/my-complaints", label: "Мої звернення" },
        { to: "/dashboard", label: "Всі звернення" },
      ];

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo route matches the layout: residents → /user (their home),
                admins landing here via /dashboard → /admin (avoid a bounce). */}
            <Logo to={admin ? "/admin" : "/user"} />

            <div className="hidden md:flex items-center">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-4 py-5 text-sm font-semibold transition-colors border-b-2 ${
                    currentPath === item.to
                      ? SELECTED
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationBell onSelectComplaint={setSelectedComplaint} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto gap-2 py-1.5 cursor-pointer">
                  <UserAvatar user={user} size="sm" fallback="Г" />
                  <HugeiconsIcon icon={ChevronDownIcon} className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsProfileOpen(true)} className="cursor-pointer">
                  <HugeiconsIcon icon={UserIcon} className="size-4" />
                  <span>Профіль</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLogoutConfirmOpen(true)}
                  variant="destructive"
                  className="cursor-pointer"
                >
                  <HugeiconsIcon icon={Logout01Icon} className="size-4" />
                  <span>Вийти</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>
      {selectedComplaint && (
        <ComplaintSidePanel
          complaint={selectedComplaint}
          open={!!selectedComplaint}
          onOpenChange={(open) => {
            if (!open) setSelectedComplaint(null);
          }}
          onStatusChange={() => {
            if (!selectedComplaint) return;
            fetchComplaintDetail(selectedComplaint.id)
              .then((fresh) => {
                if (fresh) setSelectedComplaint(fresh);
              })
              .catch(() => {});
          }}
          currentUserId={user?.user}
          isAdmin={admin}
        />
      )}
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
      <SettingsModal open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </div>
  );
};

export default StudentLayout;
