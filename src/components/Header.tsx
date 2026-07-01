import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchUserProfile, logoutUser } from "../services/problemsApi";
import { getUserInitials } from "../lib/complaintUtils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon, BellIcon, SettingsIcon, Logout01Icon, AddIcon } from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SettingsModal } from "./SettingsModal";

const Header = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [user, setUser] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    fetchUserProfile()
      .then((u) => setUser(u))
      .catch(() => {});

    const onProfileUpdate = () => {
      fetchUserProfile()
        .then((u) => setUser(u))
        .catch(() => {});
    };
    window.addEventListener("profileUpdated", onProfileUpdate);
    return () => window.removeEventListener("profileUpdated", onProfileUpdate);
  }, []);

  const initials = getUserInitials(user, "U");

  return (
    <>
      <nav className="bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
              <HugeiconsIcon icon={Building03Icon} className="size-6" strokeWidth={1.5} />
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
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button asChild variant="default" size="sm" className="gap-2">
              <Link to="/create-report"><HugeiconsIcon icon={AddIcon} className="size-4" strokeWidth={2} />Повідомити</Link>
            </Button>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
                <HugeiconsIcon icon={BellIcon} className="size-5" strokeWidth={1.5} />
              </Button>
              <Separator orientation="vertical" className="hidden sm:block h-6" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-2 cursor-pointer hover:opacity-80 transition-opacity outline-none">
                    <div className="w-8 h-8 bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm">
                      {initials}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    className="text-xs font-semibold cursor-pointer"
                    onSelect={() => setSettingsOpen(true)}
                  >
                    <HugeiconsIcon icon={SettingsIcon} className="size-3.5 mr-2" strokeWidth={1.5} />
                    Налаштування
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-xs font-semibold text-destructive cursor-pointer"
                    onSelect={logoutUser}
                  >
                    <HugeiconsIcon icon={Logout01Icon} className="size-3.5 mr-2" strokeWidth={2} />
                    Вийти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <Separator />
      </nav>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};

export default Header;
