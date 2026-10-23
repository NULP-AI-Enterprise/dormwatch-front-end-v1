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
import { Phone, Copy, Check } from "lucide-react";
import { useUser } from "@/context/UserContext";

export function DormContactsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);
  const building = user?.place?.building ?? user?.building;
  const commandantPhone = building?.commandant_phone;
  const buildingName = building?.name;

  const handleCopy = () => {
    if (!commandantPhone) return;
    navigator.clipboard.writeText(commandantPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border rounded-none p-5">
        <DialogHeader className="text-left pb-2 border-b border-border">
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Phone className="size-4 text-primary" strokeWidth={2} />
            Контакти гуртожитку
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Контактна інформація адміністрації вашого гуртожитку.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2 text-xs">
          {building ? (
            <div className="p-4 border border-border bg-card space-y-3">
              <div>
                <span className="text-muted-foreground block text-[11px]">Гуртожиток:</span>
                <span className="text-sm font-bold text-foreground block mt-0.5">
                  {buildingName || "Гуртожиток"}
                </span>
                {building.address && (
                  <p className="text-xs text-muted-foreground mt-0.5">{building.address}</p>
                )}
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-muted-foreground block text-[11px] mb-1">Комендант:</span>
                {commandantPhone ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 bg-muted/30 border border-border">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {commandantPhone}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={handleCopy}
                        className="h-7 px-2 text-xs gap-1 cursor-pointer"
                      >
                        {copied ? (
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
                      <Button
                        size="xs"
                        asChild
                        className="h-7 px-2.5 text-xs gap-1"
                      >
                        <a href={`tel:${commandantPhone}`}>
                          <Phone className="size-3" strokeWidth={2} />
                          Подзвонити
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Номер коменданта не вказано</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground italic p-4 text-center">
              Гуртожиток не закріплено за вашим профілем.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Phone numbers widget showing the dorm manager's number with click-to-copy.
const PhoneNumbersWidget = () => {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);
  const building = user?.place?.building ?? user?.building;
  const commandantPhone = building?.commandant_phone;
  const buildingName = building?.name;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!commandantPhone) return;
    navigator.clipboard.writeText(commandantPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border shadow-none bg-card">
      <CardContent>
        <div>
          <h4 className="text-xs font-normal text-muted-foreground mb-3">
            Контакти гуртожитку
          </h4>
          {building ? (
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center border border-border bg-card text-primary shrink-0">
                <Phone className="size-4" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-normal text-muted-foreground truncate">
                  Комендант {buildingName ? `(${buildingName})` : ""}
                </p>
                {commandantPhone ? (
                  <button
                    type="button"
                    onClick={handleCopy}
                    title="Натисніть, щоб скопіювати номер"
                    className="group inline-flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors mt-0.5 cursor-pointer text-left"
                  >
                    <span>{commandantPhone}</span>
                    {copied ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-normal text-emerald-500">
                        <Check className="size-3" strokeWidth={2} />
                        Скопійовано
                      </span>
                    ) : (
                      <Copy
                        className="size-3 text-muted-foreground group-hover:text-primary transition-opacity opacity-70 group-hover:opacity-100"
                        strokeWidth={1.5}
                      />
                    )}
                  </button>
                ) : (
                  <p className="text-xs font-bold text-muted-foreground mt-0.5">
                    Не вказано
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic font-normal">
              Гуртожиток не закріплено
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PhoneNumbersWidget;
