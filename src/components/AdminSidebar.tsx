import { NavLink, Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { LayoutDashboard, ClipboardList, Settings, LogOut, Building2 } from "lucide-react";
import { logoutUser } from "../services/problemsApi";

interface AdminSidebarProps {
  userName?: string;
  userRole?: string;
  initials?: string;
}

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Огляд" },
  { to: "/admin/complaints", icon: ClipboardList, label: "Всі заявки" },
];

const AdminSidebar = ({ userName = "Адмін", userRole = "Адміністратор", initials = "AD" }: AdminSidebarProps) => {
  return (
    <aside className="hidden md:flex md:flex-col md:w-56 lg:w-64 bg-stone-800 border-r border-stone-700 min-h-screen shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-stone-700">
        <Link to="/admin" className="flex items-center gap-2 text-blue-500 font-bold text-2xl tracking-tight">
          <Building2 className="w-6 h-6" strokeWidth={1.5} />
          <span>DormWatch</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 text-base font-semibold transition-colors",
                isActive
                  ? "bg-stone-700 text-stone-50"
                  : "text-stone-300 hover:bg-stone-700 hover:text-stone-50"
              )
            }
          >
            <item.icon className="w-5 h-5 text-stone-400" strokeWidth={1.5} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-stone-700">
        <NavLink
          to="/account"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2 text-base font-semibold transition-colors",
              isActive
                ? "bg-stone-700 text-stone-50"
                : "text-stone-300 hover:bg-stone-700 hover:text-stone-50"
            )
          }
        >
          <Settings className="w-5 h-5 text-stone-400" strokeWidth={1.5} />
          Налаштування
        </NavLink>
        <div className="mt-4 px-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-stone-700 flex items-center justify-center text-stone-300 font-semibold text-sm">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-stone-50">{userName}</span>
            <span className="text-sm text-stone-400">{userRole}</span>
          </div>
          <button
            onClick={logoutUser}
            className="ml-auto p-1.5 text-stone-500 hover:text-red-400 transition-colors"
            title="Вийти"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
