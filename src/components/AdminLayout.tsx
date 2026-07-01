import { Link, useLocation } from "react-router-dom";
import { Building2, LayoutDashboard, Users, FileText, Megaphone, Settings } from "lucide-react";
import { Button } from "./ui/button";
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
    <div className="min-h-screen flex flex-col md:flex-row bg-background bg-dot-grid relative">
      <aside className="w-full md:w-64 bg-background border-r border-border flex flex-col md:sticky md:top-0 md:h-screen z-40 relative">
        <div className="h-20 px-6 flex items-center border-b border-border">
          <Link to="/admin" className="flex items-center gap-3 text-primary font-bold text-xl hover:text-primary/80 transition-colors">
            <Building2 className="w-6 h-6" />
            <span>DormWatch</span>
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
                    ? "border-blue-500 bg-card text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-4">
          <Button variant="ghost" onClick={() => setIsSettingsOpen(true)} className="w-full justify-start gap-3 px-4 py-3 text-sm font-semibold border-l-4 border-transparent text-left text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5" />
            Налаштування
          </Button>

          <Button variant="ghost" onClick={() => setIsSettingsOpen(true)} className="w-full justify-start gap-3 px-4 py-3 text-left hover:bg-muted/50">
            <div className="w-10 h-10 bg-card border border-border flex items-center justify-center text-muted-foreground font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-foreground truncate">
                {user ? `${user.first_name} ${user.last_name}` : "Адмін"}
              </span>
              <span className="text-xs text-muted-foreground font-semibold truncate">
                {placeName}
              </span>
            </div>
          </Button>
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
