import { NavLink, Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { LayoutDashboard, ClipboardList, Users, Megaphone, Settings, LogOut, Building2 } from "lucide-react";
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
  { to: "/admin", icon: LayoutDashboard, label: "Огляд" },
  { to: "#", icon: Users, label: "Мешканці" },
  { to: "/admin/complaints", icon: ClipboardList, label: "Всі заявки" },
  { to: "#", icon: Megaphone, label: "Оголошення" },
];

const AdminSidebar = ({ userName = "Адмін", userRole = "Адміністратор", initials = "AD" }: AdminSidebarProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <aside className="hidden md:flex md:flex-col md:w-56 lg:w-64 bg-stone-900 border-r border-stone-700 min-h-screen shrink-0">
        <div className="h-20 px-6 flex items-center border-b border-stone-700">
          <Link to="/admin" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Building2 className="w-6 h-6" strokeWidth={1.5} />
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
                    ? "border-blue-500 bg-blue-500/5 text-stone-50"
                    : "border-transparent text-stone-400 hover:border-stone-500 hover:text-stone-200"
                )
              }
            >
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-700 space-y-4">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors text-stone-400 hover:text-stone-300 hover:bg-stone-800/50 border-l-4 border-transparent text-left"
          >
            <Settings className="w-5 h-5" strokeWidth={1.5} />
            Налаштування
          </button>

          <div className="flex items-center gap-3 px-3">
            <div className="w-10 h-10 bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-stone-50 truncate">{userName}</span>
              <span className="text-xs text-stone-500 font-semibold">{userRole}</span>
            </div>
            <button
              onClick={logoutUser}
              className="ml-auto p-1.5 text-stone-500 hover:text-red-400 transition-colors shrink-0"
              title="Вийти"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};

export default AdminSidebar;
