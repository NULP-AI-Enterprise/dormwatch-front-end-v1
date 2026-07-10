import { Link, useLocation } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { DashboardSquare01Icon, UserMultipleIcon, File01Icon, ArrowRight01Icon, Settings01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { type ReactNode, useState } from "react";
import { useUser } from "@/context/UserContext";
import { SettingsModal } from "@/components/SettingsModal";
import { AdminHeaderProvider } from "@/components/AdminHeaderContext";
import { AdminGlobalActions } from "@/components/AdminGlobalActions";
import Logo from "@/components/Logo";
import UserAvatar from "@/components/UserAvatar";

const ROUTE_TITLES: Record<string, string> = {
  "/admin": "Інформаційна панель",
  "/admin/residents": "Мешканці",
  "/admin/complaints": "Всі звернення",
  "/admin/settings": "Налаштування",
};

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  // Page-specific ("semantic") actions pushed up into the header via
  // useAdminHeaderActions; the global chrome (export + bell) is always present.
  const [pageActions, setPageActions] = useState<ReactNode>(null);

  // Real office from the admin's profile; empty when they have no place assigned
  // (no invented "Головний офіс").
  const placeName = user?.place?.place_name || "";
  const title = ROUTE_TITLES[currentPath] || "";

  const navItems = [
    { name: "Загальний огляд", path: "/admin", icon: <HugeiconsIcon icon={DashboardSquare01Icon} className="size-5" /> },
    { name: "Мешканці", path: "/admin/residents", icon: <HugeiconsIcon icon={UserMultipleIcon} className="size-5" /> },
    { name: "Всі звернення", path: "/admin/complaints", icon: <HugeiconsIcon icon={File01Icon} className="size-5" /> },
    { name: "Налаштування", path: "/admin/settings", icon: <HugeiconsIcon icon={Settings01Icon} className="size-5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background bg-dot-grid relative">
      <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col md:sticky md:top-0 md:h-screen z-40 relative">
        <div className="h-20 px-6 flex items-center border-b border-border">
          <Logo to="/admin" className="gap-3" />
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
          const isActive = item.path !== "#" && (currentPath === item.path || (item.path !== '/admin' && currentPath.startsWith(item.path + "/")));
            if (item.disabled) {
              return (
                <span
                  key={item.name}
                  aria-disabled="true"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold border-l-4 border-transparent text-muted-foreground/50 cursor-not-allowed select-none"
                >
                  {item.icon}
                  {item.name}
                </span>
              );
            }
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all border-l-4 ${
                  isActive
                    ? "border-blue-500 bg-primary/5 text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="ghost" onClick={() => setIsProfileOpen(true)} className="h-auto w-full justify-start gap-3 px-4 py-3 text-left hover:bg-muted/50 focus-visible:ring-2">
            <UserAvatar user={user} size="md" fallback="AD" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-foreground truncate">
                {user ? `${user.first_name} ${user.last_name}` : "Адмін"}
              </span>
              <span className="text-xs text-muted-foreground font-semibold truncate">
                {placeName}
              </span>
            </div>
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 ml-auto shrink-0 text-muted-foreground" />
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-card flex items-center justify-between px-6 shrink-0 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <div className="flex items-center gap-3">
            {pageActions}
            <AdminGlobalActions />
          </div>
        </header>
        <AdminHeaderProvider setActions={setPageActions}>
          {children}
        </AdminHeaderProvider>
      </main>

      <SettingsModal open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </div>
  );
};

export default AdminLayout;
