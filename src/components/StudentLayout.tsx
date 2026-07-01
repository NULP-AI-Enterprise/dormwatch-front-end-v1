import { Link, useLocation } from "react-router-dom";
import { Building2, Bell, ChevronDown } from "lucide-react";
import { type ReactNode, useState } from "react";
import { isAdminUser, getUserInitials } from "../lib/complaintUtils";
import { useUser } from "../context/UserContext";
import { SettingsModal } from "./SettingsModal";

const StudentLayout = ({ children }: { children: ReactNode }) => {
  const { user, refreshUser } = useUser();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const initials = getUserInitials(user, "Г");
  const admin = isAdminUser(user);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-stone-900 border-b border-stone-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight cursor-pointer hover:text-primary/80 transition-colors">
            <Building2 className="w-6 h-6" />
            <span>Dormwatch</span>
          </Link>

          <div className="flex items-center gap-4">
            {admin && (
              <Link to="/admin" className="text-xs font-bold text-stone-400 hover:text-blue-400 transition-colors hidden sm:block mr-2">
                Панель адміністратора
              </Link>
            )}

            <button className="p-2 text-stone-400 hover:text-stone-50 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 border border-stone-900" />
            </button>

            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 pl-4 border-l border-stone-700 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-bold text-xs">
                {initials}
              </div>
              <ChevronDown className="w-4 h-4 text-stone-500" />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
};

export default StudentLayout;
