import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon } from "@hugeicons/core-free-icons";
import { Separator } from "./ui/separator";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12 text-foreground mt-12 shrink-0">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <HugeiconsIcon icon={Building03Icon} className="size-5 text-primary" />
            <span className="text-lg font-bold">DormWatch</span>
          </div>
          <p className="text-muted-foreground text-xs">Система прямої комунікації між студентами та адміністрацією.</p>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground font-semibold">
          <a href="#" className="hover:text-foreground transition-colors">Конфіденційність</a>
          <a href="#" className="hover:text-foreground transition-colors">Умови використання</a>
          <Link to="/dashboard" className="hover:text-foreground transition-colors">Статус системи</Link>
        </div>

        <div className="flex flex-col items-center md:items-end gap-1">
          <a href="mailto:support@dormwatch.edu.ua" className="text-primary hover:text-blue-300 font-bold text-sm text-xs transition-colors">
            support@dormwatch.edu.ua
          </a>
          <span className="text-muted-foreground text-xs">
            &copy; 2025 DormWatch Systems. Всі права захищено.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
