import { Building2, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-10">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-primary flex items-center justify-center">
              <Building2 className="w-3 h-3 text-primary-foreground" strokeWidth={2} />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">
              DormWatch
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Система прямої комунікації між студентами та адміністрацією гуртожитків.
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="w-3.5 h-3.5" strokeWidth={2} />
          <span className="text-xs font-semibold text-primary">
            support@dormwatch.edu.ua
          </span>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 mt-8 pt-6 border-t border-dashed border-border">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">
          DormWatch &middot; 2024 &middot; Моніторинг проблем гуртожитків
        </p>
      </div>
    </footer>
  );
};

export default Footer;
