import { Building2 } from "lucide-react";
import { Separator } from "./ui/separator";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-stone-800 border-t border-stone-700 py-12 text-stone-50 mt-12 shrink-0">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold tracking-tight">DormWatch</span>
          </div>
          <p className="text-stone-400 text-xs">Система прямої комунікації між студентами та адміністрацією.</p>
        </div>

        <div className="flex gap-6 text-sm text-stone-500 font-semibold">
          <a href="#" className="hover:text-stone-300 transition-colors">Конфіденційність</a>
          <a href="#" className="hover:text-stone-300 transition-colors">Умови використання</a>
          <Link to="/dashboard" className="hover:text-stone-300 transition-colors">Статус системи</Link>
        </div>

        <div className="flex flex-col items-center md:items-end gap-1">
          <a href="mailto:support@dormwatch.edu.ua" className="text-blue-400 hover:text-blue-300 font-bold text-sm text-xs transition-colors">
            support@dormwatch.edu.ua
          </a>
          <span className="text-stone-600 text-xs">
            &copy; 2025 DormWatch Systems. Всі права захищено.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
