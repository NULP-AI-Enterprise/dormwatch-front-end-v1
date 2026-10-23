import { PrintDocument, PrintStyles } from "@/components/PrintDocument";
import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Printer, ChevronLeft } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Printable invite sheet for a provisioned worker: the QR encodes the
// redemption link so onboarding can happen face-to-face at the commandant's
// desk (the token is single-use and never expires).
const AdminWorkerInvitePrintPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const name = searchParams.get("name") || "";

  const redeemUrl = useMemo(
    () =>
      token
        ? `${window.location.origin}/auth?tab=register&invite=${encodeURIComponent(token)}`
        : "",
    [token]
  );

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      window.close();
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-sm font-semibold">Посилання-запрошення не знайдено.</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen p-4 sm:p-8 print-container font-sans antialiased">
      <PrintStyles />

      {/* Control bar for screen rendering */}
      <div className="no-print flex flex-wrap gap-3 justify-between items-center bg-muted border border-border p-4 mb-8 rounded-none shadow-sm">
        <Button variant="outline" className="gap-2 text-foreground border-border hover:bg-muted" onClick={handleClose}>
          <ChevronLeft className="size-4" strokeWidth={1.5} />
          Назад
        </Button>
        <Button size="touch" className="max-w-full whitespace-normal gap-2" onClick={handlePrint}>
          <Printer className="size-4" strokeWidth={1.5} />
          Друкувати / Зберегти як PDF
        </Button>
      </div>

      <PrintDocument className="min-w-0 max-w-xl">
        <header className="border-b-2 border-foreground pb-4 mb-6">
          <Logo />
          <p className="text-xs text-muted-foreground font-semibold mt-1">
            Система прямої комунікації між студентами та адміністрацією
          </p>
        </header>

        <h2 className="text-xl font-bold text-foreground mb-1">Запрошення до DormWatch</h2>
        {name && <p className="text-sm text-muted-foreground font-semibold mb-6">{name}</p>}

        <div className="border border-border p-4 sm:p-8 flex flex-col items-center gap-6">
          <QRCodeSVG value={redeemUrl} size={224} level="M" marginSize={4} className="max-w-full h-auto shrink-0" />

          <div className="text-center space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">
              Або введіть посилання вручну
            </p>
            <p className="text-xs text-foreground break-all">{redeemUrl}</p>
          </div>

          <Separator className="bg-muted" />

          <ol className="text-sm text-foreground space-y-2 list-decimal list-inside">
            <li>Відскануйте QR-код камерою телефона.</li>
            <li>На сторінці реєстрації вкажіть свою електронну пошту та придумайте пароль.</li>
            <li>Підтвердіть пошту кодом із листа — після цього увійдіть у систему.</li>
          </ol>

          <p className="text-xs text-muted-foreground text-center">
            Запрошення одноразове й не має строку давності. Якщо ви вже зареєструвалися — просто увійдіть на{' '}
            <span className="font-semibold">{window.location.origin}/auth</span>.
          </p>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Видано: {new Date().toLocaleDateString("uk-UA")}
        </p>
      </PrintDocument>
    </div>
  );
};

export default AdminWorkerInvitePrintPage;
