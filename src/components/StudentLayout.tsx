import { Link, useLocation } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon, BellIcon, ChevronDownIcon } from "@hugeicons/core-free-icons";
import { type ReactNode, useState } from "react";
import { isAdminUser, getUserInitials } from "../lib/complaintUtils";
import { useUser } from "../context/UserContext";
import { Button } from "./ui/button";
import { SettingsModal } from "./SettingsModal";

const StudentLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useUser();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const initials = getUserInitials(user, "Г");
  const admin = isAdminUser(user);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl cursor-pointer hover:text-primary/80 transition-colors">
              <HugeiconsIcon icon={Building03Icon} className="size-6" />
              <span>DormWatch</span>
            </Link>

            <div className="hidden md:flex items-center">
              <Link
                to="/"
                className={`px-4 py-5 text-sm font-semibold transition-colors border-b-2 ${
                  currentPath === "/"
                    ? "border-blue-500 text-foreground bg-muted/50"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Головна
              </Link>
              <Link
                to="/dashboard"
                className={`px-4 py-5 text-sm font-semibold transition-colors border-b-2 ${
                  currentPath === "/dashboard"
                    ? "border-blue-500 text-foreground bg-muted/50"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Дашборд
              </Link>
              {admin && (
                <Link
                  to="/admin"
                  className={`px-4 py-5 text-sm font-semibold transition-colors border-b-2 ${
                    currentPath === "/admin"
                      ? "border-blue-500 text-foreground bg-muted/50"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Адмін-панель
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <HugeiconsIcon icon={BellIcon} className="size-5" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 border border-border" />
            </Button>

            <Button variant="ghost" onClick={() => setIsSettingsOpen(true)} className="gap-2 pl-4 border-l border-border hover:opacity-80">
              <div className="w-8 h-8 bg-background border border-border flex items-center justify-center text-muted-foreground font-bold text-xs">
                {initials}
              </div>
              <HugeiconsIcon icon={ChevronDownIcon} className="size-4 text-muted-foreground" />
            </Button>
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
