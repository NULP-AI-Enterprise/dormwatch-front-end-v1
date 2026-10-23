import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Settings, Megaphone, Coins, Menu } from "lucide-react";
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
  const [navOpen, setNavOpen] = useState(false);
  const [pageActions, setPageActions] = useState<ReactNode>(null);

  const title = ROUTE_TITLES[currentPath] || "";

  const navItems: Array<{ name: string; path: string; icon: React.ReactElement; disabled?: boolean }> = [
    { name: "Загальний огляд", path: "/admin", icon: <LayoutDashboard className="size-5" strokeWidth={1.5} /> },
    { name: "Всі звернення", path: "/admin/complaints", icon: <ClipboardList className="size-5" strokeWidth={1.5} /> },
    { name: "Оголошення", path: "/admin/announcements", icon: <Megaphone className="size-5" strokeWidth={1.5} /> },
    { name: "Ресурси", path: "/admin/resources", icon: <Coins className="size-5" strokeWidth={1.5} /> },
    { name: "Налаштування", path: "/admin/settings", icon: <Settings className="size-5" strokeWidth={1.5} /> },
  ];

  const navigation = (
<nav aria-label="Навігація адміністратора" className="flex-1 py-6 px-4 space-y-2">
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
                aria-current={isActive ? "page" : undefined}
                onClick={() => setNavOpen(false)}
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
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background relative">
      <aside className="hidden lg:flex w-64 shrink-0 bg-card border-r border-border flex-col sticky top-0 h-screen z-40">
        <div className="h-20 px-6 flex items-center border-b border-border">
          <Logo to="/admin" className="gap-3" />
        </div>

        {navigation}
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="min-h-20 bg-card flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6 shrink-0 border-b border-border sticky top-0 z-30">
          <div className="flex w-full min-w-0 flex-none items-center gap-3 lg:min-w-max lg:w-auto lg:flex-1">
            <Sheet open={navOpen} onOpenChange={setNavOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Відкрити навігацію">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 max-w-[calc(100%-2rem)] p-0">
                <div className="border-b border-border p-5 pr-12">
                  <SheetTitle>Навігація</SheetTitle>
                  <SheetDescription className="sr-only">Розділи адміністратора DormWatch</SheetDescription>
                </div>
                {navigation}
              </SheetContent>
            </Sheet>
            <h1 className="min-w-0 text-lg sm:text-2xl font-bold text-foreground break-words">{title}</h1>
          </div>
          <div className="flex w-full min-w-0 max-w-full flex-wrap items-center justify-between gap-2 lg:ml-auto lg:w-auto lg:justify-end">
            {pageActions && <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 [&>*]:max-w-full">{pageActions}</div>}
            <AdminExportButton />
            <UserNavProfile compact={Boolean(pageActions)} />
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
