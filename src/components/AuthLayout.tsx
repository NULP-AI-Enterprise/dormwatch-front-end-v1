import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";

function AuthLayout({ children, heading, subtitle }: { children: ReactNode; heading: string; subtitle: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 text-primary font-bold text-2xl mb-2">
            <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-8" />
            <span>DormWatch</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{heading}</h1>
          <p className="text-muted-foreground text-sm mt-2 text-center">{subtitle}</p>
        </div>

        {children}

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 group-hover:-translate-x-1 transition-transform" />
            Повернутися на головну
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-5 border border-destructive/40 bg-destructive/10 px-3 py-2.5">
      <p className="text-xs leading-relaxed text-destructive font-semibold">{message}</p>
    </div>
  );
}

export { AuthLayout, ErrorBanner };
