import { Link, useLocation } from "react-router-dom";
import { Building2, Plus, User } from "lucide-react";

const navLinks = [
  { to: "/", label: "Головна" },
  { to: "/dashboard", label: "Дашборд" },
  { to: "/admin", label: "Комендант-центр" },
];

const Header = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-foreground" strokeWidth={2} />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              DormWatch
            </span>
          </Link>
          <nav className="hidden md:flex gap-0">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 text-xs font-medium transition-all border-l-4 ${
                  currentPath === link.to
                    ? "border-l-primary text-foreground bg-primary/5 translate-x-0"
                    : "border-l-transparent text-muted-foreground hover:translate-x-1 hover:border-l-primary hover:text-foreground hover:bg-primary/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/create-report"
            className="bg-primary text-primary-foreground px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-primary/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            Створити заявку
          </Link>

          <div className="flex items-center gap-2 pl-3 border-l border-border">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-foreground leading-tight">
                Олексій Коваленко
              </p>
              <p className="text-[10px] text-muted-foreground font-medium tracking-wide">
                Гуртожиток №4, Кімн. 512
              </p>
            </div>
            <Link to="/account">
              <div className="w-8 h-8 bg-muted flex items-center justify-center border border-border cursor-pointer hover:border-primary transition-colors">
                <User className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
