import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Separator } from "./ui/separator";

const Footer = () => {
  return (
    <footer className="bg-stone-900 py-12">
      <Separator className="mb-12" />
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 text-stone-500 font-bold text-lg tracking-tight">
          <Building2 className="w-5 h-5" strokeWidth={1.5} />
          <span>DormWatch</span>
        </div>

        <div className="flex gap-6 text-sm text-stone-500 font-semibold">
          <Link to="/account" className="hover:text-stone-300 transition-colors">Конфіденційність</Link>
          <Link to="/account" className="hover:text-stone-300 transition-colors">Умови використання</Link>
          <Link to="/dashboard" className="hover:text-stone-300 transition-colors">Статус системи</Link>
          <a href="mailto:support@dormwatch.edu" className="hover:text-stone-300 transition-colors">Контакти</a>
        </div>

        <p className="text-stone-600 text-xs">
          &copy; 2025 DormWatch Systems. Всі права захищено.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
