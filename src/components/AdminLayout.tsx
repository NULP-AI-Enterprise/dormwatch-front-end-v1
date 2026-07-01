import { Link, useLocation } from "react-router-dom";
import { Building2, LayoutDashboard, Users, FileText, Megaphone, Settings } from "lucide-react";
import { type ReactNode, useState } from "react";
import { getUserInitials } from "../lib/complaintUtils";
import { useUser } from "../context/UserContext";
import { SettingsModal } from "./SettingsModal";

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, refreshUser } = useUser();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const initials = getUserInitials(user, "AD");
  const placeName = user?.place?.place_name || "Головний офіс";

  const navItems = [
    { name: "Загальний огляд", path: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "Мешканці", path: "#", icon: <Users className="w-5 h-5" /> },
    { name: "Всі заявки", path: "/admin/complaints", icon: <FileText className="w-5 h-5" /> },
    { name: "Оголошення", path: "#", icon: <Megaphone className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-stone-900 bg-dot-grid relative">
      <aside className="w-full md:w-64 bg-stone-900 border-r border-stone-700 flex flex-col md:sticky md:top-0 md:h-screen z-40 relative">
        <div className="h-20 px-6 flex items-center border-b border-stone-700">
          <Link to="/admin" className="flex items-center gap-3 text-primary font-bold text-xl tracking-tight hover:text-primary/80 transition-colors">
            <Building2 className="w-6 h-6" />
            <span>Dormwatch</span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = item.path !== "#" && (currentPath === item.path || currentPath.startsWith(item.path + "/"));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all border-l-4 ${
                  isActive
                    ? "border-blue-500 bg-stone-800 text-stone-50"
                    : "border-transparent text-stone-400 hover:bg-stone-800/50 hover:text-stone-300"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-700 space-y-4">
          <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-stone-400 hover:text-stone-300 hover:bg-stone-800/50 transition-colors border-l-4 border-transparent text-left">
            <Settings className="w-5 h-5" />
            Налаштування
          </button>

          <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-800/50 transition-colors text-left">
            <div className="w-10 h-10 bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-stone-50 truncate">
                {user ? `${user.first_name} ${user.last_name}` : "Адмін"}
              </span>
              <span className="text-xs text-stone-500 font-semibold truncate">
                {placeName}
              </span>
            </div>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
};

export default AdminLayout;
