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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Реквізити для оплати</DialogTitle>
          <DialogDescription>
            Платіжні реквізити недоступні. Зверніться до адміністрації вашого
            гуртожитку, щоб отримати підтверджені дані для оплати.
          </DialogDescription>
        </DialogHeader>
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
            <BookOpen className="size-4 text-link" strokeWidth={2} />
            Правила внутрішнього розпорядку
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Основні норми та вимоги проживання у гуртожитку.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2 text-xs leading-relaxed">
          <div className="flex items-start gap-2.5 p-2.5 border border-border bg-card">
            <Clock className="size-4 text-link shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="font-bold text-foreground">Години тиші: 22:00 – 08:00</p>
              <p className="text-muted-foreground mt-0.5">
                У нічний час забороняється шуміти, голосно слухати музику та заважати відпочинку інших мешканців.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 border border-border bg-card">
            <Users className="size-4 text-link shrink-0 mt-0.5" strokeWidth={1.5} />
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
            <Sparkles className="size-4 text-link shrink-0 mt-0.5" strokeWidth={1.5} />
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
            <Button variant="ghost" size="content"
              type="button"
              onClick={() => setRequisitesOpen(true)}
              className="flex items-center justify-between w-full p-2 -mx-1 text-left rounded-none border border-transparent hover:border-border hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-7 items-center justify-center border border-border bg-card text-link shrink-0">
                  <CreditCard className="size-3.5" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium text-foreground group-hover:text-link transition-colors truncate">
                  Реквізити для оплати
                </span>
              </div>
              <ChevronRight className="size-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
            </Button>

            <Button variant="ghost" size="content"
              type="button"
              onClick={() => setRulesOpen(true)}
              className="flex items-center justify-between w-full p-2 -mx-1 text-left rounded-none border border-transparent hover:border-border hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-7 items-center justify-center border border-border bg-card text-link shrink-0">
                  <BookOpen className="size-3.5" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium text-foreground group-hover:text-link transition-colors truncate">
                  Правила розпорядку
                </span>
              </div>
              <ChevronRight className="size-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
            </Button>
          </div>
        </CardContent>
      </Card>

      <DormRequisitesDialog open={requisitesOpen} onOpenChange={setRequisitesOpen} />
      <DormRulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </>
  );
}

export default DormInfoWidget;
