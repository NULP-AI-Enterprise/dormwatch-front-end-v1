import { Link, useLocation } from "react-router-dom";
import { type ReactNode, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isAdminUser } from "@/lib/complaintUtils";
import { useUser } from "@/context/UserContext";
import { NotificationBell } from "@/components/NotificationBell";
import ComplaintSidePanel from "@/components/ComplaintSidePanel";
import Logo from "@/components/Logo";
import UserNavProfile from "@/components/UserNavProfile";
import { StudentMobileMenu } from "@/components/StudentMobileMenu";
import type { Complaint } from "@/lib/types";
import { fetchComplaintDetail } from "@/services/problemsApi";

const StudentLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useUser();
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const admin = isAdminUser(user);

  // Single tab spine (the nav is the only tab structure — no in-page tabs).
  // The primary "Створити звернення" CTA lives front-and-center in page bodies,
  // not here. The resident tab (/user) is a blockAdmin route, so it must NOT
  // be shown to an admin who reaches this layout via /dashboard — they'd
  // bounce straight back to /admin. Admins get only the two routes they can
  // actually stay on.
  const navItems = admin
    ? [
        { to: "/dashboard", label: "Дошка звернень" },
        { to: "/admin", label: "Адмін-панель" },
      ]
    : [
        { to: "/user", label: "Головна" },
        { to: "/dashboard", label: "Звернення" },
      ];

  return (
    <div className="min-h-screen flex flex-col w-full max-w-full">
      <nav className="bg-card border-b border-border sticky top-0 z-50 w-full">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-8">
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden cursor-pointer"
              aria-label="Меню навігації"
              aria-expanded={mobileMenuOpen}
              aria-haspopup="dialog"
              title="Меню навігації"
            >
              <Menu className="size-5" strokeWidth={1.75} />
            </Button>
            {/* Logo route matches the layout: residents → /user (their home),
                admins landing here via /dashboard → /admin (avoid a bounce). */}
            <Logo to={admin ? "/admin" : "/user"} className="hidden lg:flex" />

            <div className="hidden lg:flex items-center">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={currentPath === item.to ? "page" : undefined}
                  className={`px-4 py-5 text-sm font-semibold transition-colors border-b-2 ${
                    currentPath === item.to
                      // Design system §5: neutral nav surface, foreground text, accent underline.
                      ? "border-link bg-muted/30 text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop right controls: [UserNavProfile] [NotificationBell] */}
          <div className="hidden lg:flex items-center gap-3">
            <UserNavProfile />
            <NotificationBell onSelectComplaint={setSelectedComplaint} />
          </div>

          {/* Mobile/tablet: content-sized account and notifications align to the right. */}
          <div className="flex min-w-0 flex-1 lg:hidden items-center justify-end gap-3">
            <UserNavProfile allowFullWidth />
            <NotificationBell onSelectComplaint={setSelectedComplaint} />
          </div>
        </div>
      </nav>

      <StudentMobileMenu
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        currentPath={currentPath}
        admin={admin}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 min-w-0">
        {children}
      </main>

      {selectedComplaint && (
        <ComplaintSidePanel
          complaint={selectedComplaint}
          open={!!selectedComplaint}
          onOpenChange={(open) => {
            if (!open) setSelectedComplaint(null);
          }}
          onStatusChange={() => {
            if (!selectedComplaint) return;
            fetchComplaintDetail(selectedComplaint.id)
              .then((fresh) => {
                if (fresh) setSelectedComplaint(fresh);
              })
              .catch(() => setSelectedComplaint(null));
          }}
          currentUserId={user?.user}
          isAdmin={admin}
        />
      )}
    </div>
  );
};

export default StudentLayout;
