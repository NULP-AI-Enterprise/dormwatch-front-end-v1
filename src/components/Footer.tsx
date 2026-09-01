import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon } from "@hugeicons/core-free-icons";
import { LINK, LINK_HOVER } from "@/lib/theme";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12 text-foreground mt-12 shrink-0">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <HugeiconsIcon icon={Building03Icon} className="size-5 text-primary" />
            <span className="text-lg font-bold">DormWatch</span>
          </div>
          <p className="text-muted-foreground text-sm">Система прямої комунікації між студентами та адміністрацією.</p>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground font-semibold">
          {/* TODO: add privacy/terms pages, then re-enable these as links. */}
          <span className="opacity-50 cursor-not-allowed" aria-disabled="true">Конфіденційність</span>
          <span className="opacity-50 cursor-not-allowed" aria-disabled="true">Умови використання</span>
        </div>

        <div className="flex flex-col items-center md:items-end gap-1">
          <a href="mailto:support@dormwatch.edu.ua" className={`${LINK} ${LINK_HOVER} font-bold text-xs transition-colors`}>
            support@dormwatch.edu.ua
          </a>
          <span className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} DormWatch. Всі права захищено.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
