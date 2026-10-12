import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Plus,
  Compass,
  Home,
  ClipboardList,
  Megaphone,
  Phone,
  FileCheck,
  CreditCard,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Logo from "@/components/Logo";
import AnnouncementsModal from "@/components/AnnouncementsModal";
import { DormContactsDialog } from "@/components/PhoneNumbersWidget";
import { DormRequisitesDialog, DormRulesDialog } from "@/components/DormInfoWidget";
import { cn } from "@/lib/utils";

interface StudentMobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string;
  admin?: boolean;
}

export function StudentMobileMenu({
  open,
  onOpenChange,
  currentPath,
  admin,
}: StudentMobileMenuProps) {
  const [navExpanded, setNavExpanded] = useState(true);
  const [rulesExpanded, setRulesExpanded] = useState(false);

  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [requisitesOpen, setRequisitesOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 flex flex-col bg-card border-l border-border">
          <SheetHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <SheetTitle className="sr-only">Меню навігації</SheetTitle>
            <Logo to={admin ? "/admin" : "/user"} onClick={() => onOpenChange(false)} />
          </SheetHeader>

          {/* Верхня головна синя кнопка Створити звернення */}
          <div className="p-4 border-b border-border bg-muted/20">
            <Link
              to="/create-report"
              onClick={() => onOpenChange(false)}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 px-4 rounded-md shadow-sm transition-all text-sm cursor-pointer"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              <span>Створити звернення</span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 text-xs">
            {/* 1. Блок Навігація */}
            <div className="rounded-md border border-border/60 bg-muted/20 overflow-hidden">
              <button
                type="button"
                onClick={() => setNavExpanded((prev) => !prev)}
                className="flex items-center justify-between w-full py-2.5 px-3 text-left font-semibold text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="size-4 text-primary" strokeWidth={2} />
                  <span className="text-sm">Навігація</span>
                </div>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform duration-200",
                    navExpanded && "rotate-180"
                  )}
                  strokeWidth={2}
                />
              </button>

              {navExpanded && (
                <div className="px-2 pb-2 pt-1 space-y-1 border-t border-border/40">
                  <Link
                    to="/user"
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors",
                      currentPath === "/user"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <Home className="size-4" strokeWidth={1.75} />
                    <span>Головна</span>
                  </Link>

                  <Link
                    to="/dashboard"
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors",
                      currentPath === "/dashboard"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <ClipboardList className="size-4" strokeWidth={1.75} />
                    <span>Звернення</span>
                  </Link>
                </div>
              )}
            </div>

            {/* 2. Оголошення */}
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                setAnnouncementsOpen(true);
              }}
              className="flex items-center justify-between w-full py-2.5 px-3 rounded-md border border-border/60 bg-muted/20 text-foreground hover:bg-muted/50 transition-colors cursor-pointer text-left font-semibold"
            >
              <div className="flex items-center gap-2.5">
                <Megaphone className="size-4 text-primary" strokeWidth={2} />
                <span className="text-sm">Оголошення</span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" strokeWidth={2} />
            </button>

            {/* 3. Контакти гуртожитку */}
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                setContactsOpen(true);
              }}
              className="flex items-center justify-between w-full py-2.5 px-3 rounded-md border border-border/60 bg-muted/20 text-foreground hover:bg-muted/50 transition-colors cursor-pointer text-left font-semibold"
            >
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 text-primary" strokeWidth={2} />
                <span className="text-sm">Контакти гуртожитку</span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" strokeWidth={2} />
            </button>

            {/* 4. Блок Оплата та правила */}
            <div className="rounded-md border border-border/60 bg-muted/20 overflow-hidden">
              <button
                type="button"
                onClick={() => setRulesExpanded((prev) => !prev)}
                className="flex items-center justify-between w-full py-2.5 px-3 text-left font-semibold text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck className="size-4 text-primary" strokeWidth={2} />
                  <span className="text-sm">Оплата та правила</span>
                </div>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform duration-200",
                    rulesExpanded && "rotate-180"
                  )}
                  strokeWidth={2}
                />
              </button>

              {rulesExpanded && (
                <div className="px-2 pb-2 pt-1 space-y-1 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      setRequisitesOpen(true);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-left text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                  >
                    <CreditCard className="size-4 text-primary" strokeWidth={1.75} />
                    <span>Реквізити для оплати</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      setRulesOpen(true);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-left text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                  >
                    <BookOpen className="size-4 text-primary" strokeWidth={1.75} />
                    <span>Правила розпорядку</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Окремі модальні вікна */}
      <AnnouncementsModal
        open={announcementsOpen}
        onOpenChange={setAnnouncementsOpen}
      />
      <DormContactsDialog
        open={contactsOpen}
        onOpenChange={setContactsOpen}
      />
      <DormRequisitesDialog
        open={requisitesOpen}
        onOpenChange={setRequisitesOpen}
      />
      <DormRulesDialog
        open={rulesOpen}
        onOpenChange={setRulesOpen}
      />
    </>
  );
}
