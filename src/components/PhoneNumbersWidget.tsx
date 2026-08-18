import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import { CallIcon, ShieldIcon } from "@hugeicons/core-free-icons";
import { useUser } from "@/context/UserContext";

// Phone numbers widget showing the dorm manager's number and emergency services.
// Uses custom design-system patterns: sharp borders, named typography scale,
// Ukrainian only copy, and Hugeicons.
const PhoneNumbersWidget = () => {
  const { user } = useUser();
  const building = user?.place?.building ?? user?.building;
  const commandantPhone = building?.commandant_phone;
  const buildingName = building?.name;

  return (
    <Card className="border-border shadow-none bg-card">
      <CardContent>
        <div className="flex flex-col gap-4">
          <div>
            <h4 className="text-xs font-normal text-muted-foreground mb-3">
              Контакти гуртожитку
            </h4>
            {building ? (
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center border border-border bg-card text-primary shrink-0">
                  <HugeiconsIcon icon={CallIcon} className="size-4" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-normal text-muted-foreground truncate">
                    Комендант {buildingName ? `(${buildingName})` : ""}
                  </p>
                  {commandantPhone ? (
                    <a
                      href={`tel:${commandantPhone}`}
                      className="text-xs font-bold text-foreground hover:text-primary transition-colors block mt-0.5"
                    >
                      {commandantPhone}
                    </a>
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

          <Separator dashed />

          <div>
            <h4 className="text-xs font-normal text-muted-foreground mb-3">
              Екстрені служби
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center border border-border bg-card text-destructive shrink-0">
                  <HugeiconsIcon icon={ShieldIcon} className="size-4" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-normal text-muted-foreground">
                    Єдина служба порятунку
                  </p>
                  <a
                    href="tel:112"
                    className="text-xs font-bold text-foreground hover:text-primary transition-colors block mt-0.5"
                  >
                    112
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center border border-border bg-card text-destructive shrink-0">
                  <HugeiconsIcon icon={ShieldIcon} className="size-4" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-normal text-muted-foreground">
                    Пожежна / Поліція / Швидка
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs font-bold">
                    <a
                      href="tel:101"
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      101
                    </a>
                    <span className="text-muted-foreground font-normal">/</span>
                    <a
                      href="tel:102"
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      102
                    </a>
                    <span className="text-muted-foreground font-normal">/</span>
                    <a
                      href="tel:103"
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      103
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhoneNumbersWidget;
