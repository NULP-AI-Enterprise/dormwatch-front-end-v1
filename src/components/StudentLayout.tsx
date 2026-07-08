import { Link, useLocation } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronDownIcon } from "@hugeicons/core-free-icons";
import { type ReactNode, useState } from "react";
import { isAdminUser } from "@/lib/complaintUtils";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/SettingsModal";
import { NotificationBell } from "@/components/NotificationBell";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import Logo from "@/components/Logo";
import UserAvatar from "@/components/UserAvatar";
import type { Complaint } from "@/lib/types";

const StudentLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useUser();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const admin = isAdminUser(user);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo to="/" />

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
                Всі заявки
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
            <NotificationBell onSelectComplaint={setSelectedComplaint} />

            <Button variant="ghost" onClick={() => setIsSettingsOpen(true)} className="h-auto gap-2 py-1.5">
              <UserAvatar user={user} size="sm" fallback="Г" />
              <HugeiconsIcon icon={ChevronDownIcon} className="size-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      {selectedComplaint && (
        <ComplaintSidePanel
          complaint={selectedComplaint}
          open={!!selectedComplaint}
          onOpenChange={(open) => {
            if (!open) setSelectedComplaint(null);
          }}
          onStatusChange={() => {}}
          currentUserId={user?.user}
          isAdmin={admin}
        />
      )}
    </div>
  );
};

export default StudentLayout;
