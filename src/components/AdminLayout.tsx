import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Settings, Megaphone, Coins } from "lucide-react";
import React, { type ReactNode, useState } from "react";
import { SELECTED } from "@/lib/theme";
import { AdminHeaderProvider } from "@/components/AdminHeaderContext";
import { AdminExportButton, AdminNotificationBell } from "@/components/AdminGlobalActions";
import Logo from "@/components/Logo";
import UserNavProfile from "@/components/UserNavProfile";

const ROUTE_TITLES: Record<string, string> = {
  "/admin": "Інформаційна панель",
  "/admin/complaints": "Всі звернення",
  "/admin/announcements": "Оголошення",
  "/admin/resources": "Ресурси",
  "/admin/settings": "Налаштування",
};

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  // Page-specific ("semantic") actions pushed up into the header via
  // useAdminHeaderActions; the global chrome (export + bell) is always present.
  const [pageActions, setPageActions] = useState<ReactNode>(null);

  const title = ROUTE_TITLES[currentPath] || "";

  const navItems: Array<{ name: string; path: string; icon: React.ReactElement; disabled?: boolean }> = [
    { name: "Загальний огляд", path: "/admin", icon: <LayoutDashboard className="size-5" strokeWidth={1.5} /> },
    { name: "Всі звернення", path: "/admin/complaints", icon: <ClipboardList className="size-5" strokeWidth={1.5} /> },
    { name: "Оголошення", path: "/admin/announcements", icon: <Megaphone className="size-5" strokeWidth={1.5} /> },
    { name: "Ресурси", path: "/admin/resources", icon: <Coins className="size-5" strokeWidth={1.5} /> },
    { name: "Налаштування", path: "/admin/settings", icon: <Settings className="size-5" strokeWidth={1.5} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background relative">
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
                    ? SELECTED
                    : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-card flex items-center justify-between px-6 shrink-0 border-b border-border sticky top-0 z-30">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <div className="flex items-center gap-3">
            {pageActions}
            <AdminExportButton />
            <div className="h-6 w-px bg-border hidden sm:block" />
            <UserNavProfile />
            <AdminNotificationBell />
          </div>
        </header>
        <AdminHeaderProvider setActions={setPageActions}>
          {children}
        </AdminHeaderProvider>
      </main>
    </div>
  );
};

export default AdminLayout;
