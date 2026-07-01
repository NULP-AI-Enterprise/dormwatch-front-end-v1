import { NavLink, Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { DashboardSquare01Icon, ClipboardIcon, GroupIcon, Megaphone01Icon, SettingsIcon, Logout01Icon, Building03Icon } from "@hugeicons/core-free-icons";
import { logoutUser } from "../services/problemsApi";
import { Separator } from "./ui/separator";
import { SettingsModal } from "./SettingsModal";
import { useState } from "react";

interface AdminSidebarProps {
  userName?: string;
  userRole?: string;
  initials?: string;
}

const navItems = [
  { to: "/admin", icon: DashboardSquare01Icon, label: "Огляд" },
  { to: "#", icon: GroupIcon, label: "Мешканці" },
  { to: "/admin/complaints", icon: ClipboardIcon, label: "Всі заявки" },
  { to: "#", icon: Megaphone01Icon, label: "Оголошення" },
];

const AdminSidebar = ({ userName = "Адмін", userRole = "Адміністратор", initials = "AD" }: AdminSidebarProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <aside className="hidden md:flex md:flex-col md:w-56 lg:w-64 bg-background border-r border-border min-h-screen shrink-0">
        <div className="h-20 px-6 flex items-center border-b border-border">
          <Link to="/admin" className="flex items-center gap-2 text-primary font-bold text-xl">
            <HugeiconsIcon icon={Building03Icon} className="size-6" strokeWidth={1.5} />
            <span>DormWatch</span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors border-l-4",
                  item.to === "#" && "pointer-events-none",
                  isActive && item.to !== "#"
                    ? "border-blue-500 bg-primary/5 text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border/80 hover:text-foreground"
                )
              }
            >
              <HugeiconsIcon icon={item.icon} className="size-5" strokeWidth={1.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-4">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l-4 border-transparent text-left"
          >
            <HugeiconsIcon icon={SettingsIcon} className="size-5" strokeWidth={1.5} />
            Налаштування
          </button>

          <div className="flex items-center gap-3 px-3">
            <div className="w-10 h-10 bg-card border border-border flex items-center justify-center text-muted-foreground font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-foreground truncate">{userName}</span>
              <span className="text-xs text-muted-foreground font-semibold">{userRole}</span>
            </div>
            <button
              onClick={logoutUser}
              className="ml-auto p-1.5 text-muted-foreground hover:text-red-400 transition-colors shrink-0"
              title="Вийти"
            >
              <HugeiconsIcon icon={Logout01Icon} className="size-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};

export default AdminSidebar;
