import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CreditCard,
  BookOpen,
  Copy,
  Check,
  ChevronRight,
  Clock,
  Users,
  Flame,
  Sparkles,
} from "lucide-react";

export function DormRequisitesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const IBAN_NUMBER = "UA213223130000026001234567890";
  const EDRPOU_CODE = "02070944";
  const RECIPIENT_NAME = "КП «Студентське містечко»";
  const BANK_NAME = "АТ КБ «ПриватБанк»";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border rounded-none p-5">
        <DialogHeader className="text-left pb-2 border-b border-border">
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <CreditCard className="size-4 text-primary" strokeWidth={2} />
            Реквізити для онлайн-оплати
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Використовуйте ці дані для оплати проживання через інтернет-банкінг або касу банку.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2 text-xs">
          <div className="p-3 border border-border bg-muted/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">IBAN:</span>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => copyToClipboard(IBAN_NUMBER, "iban")}
                className="h-6 px-1.5 text-[11px] gap-1 cursor-pointer"
              >
                {copiedField === "iban" ? (
                  <>
                    <Check className="size-3 text-emerald-500" strokeWidth={2} />
                    <span className="text-emerald-500 font-semibold">Скопійовано</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" strokeWidth={1.5} />
                    <span>Скопіювати</span>
                  </>
                )}
              </Button>
            </div>
            <p
              onClick={() => copyToClipboard(IBAN_NUMBER, "iban")}
              className="font-mono text-sm font-bold text-foreground tracking-wide cursor-pointer hover:text-primary transition-colors break-all select-all"
              title="Натисніть для копіювання"
            >
              {IBAN_NUMBER}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 border border-border bg-card">
              <span className="text-muted-foreground block text-[11px]">Код ЄДРПОУ:</span>
              <span
                onClick={() => copyToClipboard(EDRPOU_CODE, "edrpou")}
                className="font-mono font-bold text-foreground cursor-pointer hover:text-primary inline-flex items-center gap-1 mt-0.5"
                title="Натисніть для копіювання"
              >
                {EDRPOU_CODE}
                {copiedField === "edrpou" ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3 text-muted-foreground opacity-60" />
                )}
              </span>
            </div>

            <div className="p-2.5 border border-border bg-card">
              <span className="text-muted-foreground block text-[11px]">Банк:</span>
              <span className="font-semibold text-foreground block mt-0.5">{BANK_NAME}</span>
            </div>
          </div>

          <div className="p-2.5 border border-border bg-card">
            <span className="text-muted-foreground block text-[11px]">Одержувач:</span>
            <span className="font-semibold text-foreground block mt-0.5">{RECIPIENT_NAME}</span>
          </div>

          <div className="p-3 border border-border bg-muted/20 space-y-1">
            <span className="text-muted-foreground font-semibold block text-[11px]">
              Шаблон призначення платежу:
            </span>
            <p className="font-mono text-xs text-foreground bg-background p-2 border border-border leading-relaxed select-all">
              Оплата за проживання у гуртожитку, кімната [№], [ПІБ студента]
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DormRulesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border rounded-none p-5">
        <DialogHeader className="text-left pb-2 border-b border-border">
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <BookOpen className="size-4 text-primary" strokeWidth={2} />
            Правила внутрішнього розпорядку
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Основні норми та вимоги проживання у гуртожитку.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2 text-xs leading-relaxed">
          <div className="flex items-start gap-2.5 p-2.5 border border-border bg-card">
            <Clock className="size-4 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="font-bold text-foreground">Години тиші: 22:00 – 08:00</p>
              <p className="text-muted-foreground mt-0.5">
                У нічний час забороняється шуміти, голосно слухати музику та заважати відпочинку інших мешканців.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 border border-border bg-card">
            <Users className="size-4 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="font-bold text-foreground">Відвідування гостей: 08:00 – 22:00</p>
              <p className="text-muted-foreground mt-0.5">
                Вхід гостей здійснюється за пред'явленням документа, що посвідчує особу. Мешканець несе персональну відповідальність за гостя.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 border border-border bg-card">
            <Flame className="size-4 text-destructive shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="font-bold text-foreground">Пожежна безпека</p>
              <p className="text-muted-foreground mt-0.5">
                Категорично заборонено палити в приміщеннях, залишати ввімкнені плити та користуватися несправними електроприладами.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 border border-border bg-card">
            <Sparkles className="size-4 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="font-bold text-foreground">Чистота та майно</p>
              <p className="text-muted-foreground mt-0.5">
                Мешканці зобов'язані підтримувати чистоту в кімнаті, блоці та місцях спільного користування, а також дбайливо ставитися до майна.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DormInfoWidget() {
  const [requisitesOpen, setRequisitesOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <>
      <Card className="border-border shadow-none bg-card">
        <CardContent>
          <h4 className="text-xs font-normal text-muted-foreground mb-3">
            Оплата та правила
          </h4>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setRequisitesOpen(true)}
              className="flex items-center justify-between w-full p-2 -mx-1 text-left rounded-none border border-transparent hover:border-border hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-7 items-center justify-center border border-border bg-card text-primary shrink-0">
                  <CreditCard className="size-3.5" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  Реквізити для оплати
                </span>
              </div>
              <ChevronRight className="size-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
            </button>

            <button
              type="button"
              onClick={() => setRulesOpen(true)}
              className="flex items-center justify-between w-full p-2 -mx-1 text-left rounded-none border border-transparent hover:border-border hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-7 items-center justify-center border border-border bg-card text-primary shrink-0">
                  <BookOpen className="size-3.5" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  Правила розпорядку
                </span>
              </div>
              <ChevronRight className="size-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
            </button>
          </div>
        </CardContent>
      </Card>

      <DormRequisitesDialog open={requisitesOpen} onOpenChange={setRequisitesOpen} />
      <DormRulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </>
  );
}

export default DormInfoWidget;
