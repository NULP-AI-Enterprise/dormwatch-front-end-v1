import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PrinterIcon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
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
    <div className="bg-white text-black min-h-screen p-8 print-container font-sans antialiased">
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Control bar for screen rendering */}
      <div className="no-print flex justify-between items-center bg-gray-100 border border-gray-200 p-4 mb-8 rounded-none shadow-sm">
        <Button variant="outline" className="gap-2 text-gray-700 border-gray-300 hover:bg-gray-200" onClick={handleClose}>
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          Назад
        </Button>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-white" onClick={handlePrint}>
          <HugeiconsIcon icon={PrinterIcon} className="size-4" />
          Друкувати / Зберегти як PDF
        </Button>
      </div>

      <div className="max-w-xl mx-auto">
        <header className="border-b-2 border-black pb-4 mb-6">
          <Logo />
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Система прямої комунікації між студентами та адміністрацією
          </p>
        </header>

        <h2 className="text-xl font-bold text-gray-800 mb-1">Запрошення до DormWatch</h2>
        {name && <p className="text-sm text-gray-600 font-semibold mb-6">{name}</p>}

        <div className="border border-gray-300 p-8 flex flex-col items-center gap-6">
          <QRCodeSVG value={redeemUrl} size={224} level="M" />

          <div className="text-center space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Або введіть посилання вручну
            </p>
            <p className="text-xs text-gray-800 break-all">{redeemUrl}</p>
          </div>

          <Separator className="bg-gray-300" />

          <ol className="text-sm text-gray-800 space-y-2 list-decimal list-inside">
            <li>Відскануйте QR-код камерою телефона.</li>
            <li>На сторінці реєстрації вкажіть свою електронну пошту та придумайте пароль.</li>
            <li>Підтвердіть пошту кодом із листа — після цього увійдіть у систему.</li>
          </ol>

          <p className="text-xs text-gray-500 text-center">
            Запрошення одноразове й не має строку давності. Якщо ви вже зареєструвалися — просто увійдіть на{' '}
            <span className="font-semibold">{window.location.origin}/auth</span>.
          </p>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Видано: {new Date().toLocaleDateString("uk-UA")}
        </p>
      </div>
    </div>
  );
};

export default AdminWorkerInvitePrintPage;
