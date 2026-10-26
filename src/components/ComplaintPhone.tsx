import { Phone } from "lucide-react";

// Design system §§2,4: contact metadata is a plain, keyboard-accessible link.
export default function ComplaintPhone({ phone }: { phone?: string | null }) {
  if (!phone?.trim()) return null;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="text-muted-foreground">Телефон автора:</span>
      <a
        href={"tel:" + phone.replace(/[^+0-9]/g, "")}
        className="inline-flex min-h-6 max-w-full items-center gap-1.5 text-link hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
      >
        <Phone className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="break-all">{phone}</span>
      </a>
    </div>
  );
}
