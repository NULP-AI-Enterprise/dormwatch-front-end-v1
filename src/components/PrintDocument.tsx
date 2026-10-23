import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PrintStyles() {
  return <style>{`
    .print-container table { border-collapse: collapse; width: 100%; table-layout: fixed; }
    .print-container th, .print-container td {
      border: 1px solid var(--border); padding: 8px; vertical-align: middle;
      overflow-wrap: anywhere;
    }
    .print-container th, .print-container td:not(:first-child) { text-align: center; }
    .print-container td:first-child, .print-container .print-title,
    .print-container .print-description { text-align: left; }
    @media print {
      @page { margin: 12mm; }
      body { background: var(--background); color: var(--foreground); print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .print-container .no-print { display: none !important; }
      .print-container { width: 100%; padding: 0 !important; margin: 0; }
      .print-container .print-scroll { overflow: visible; }
      .print-container .print-document { min-width: 0; width: 100%; max-width: none; }
      .print-container th, .print-container td { padding: 4px; }
      .print-container th { font-size: 12px; overflow-wrap: normal; }
      .print-container h2 { break-after: avoid; }
      .print-container tr { break-inside: avoid; }
      .print-container .print-photo { break-inside: avoid; }
      .print-container .print-photo img { max-height: 80mm; }
      .print-container thead { display: table-header-group; }
      .print-container .print-page { break-before: page; }
      .print-container img { max-height: 180mm; object-fit: contain; }
    }
  `}</style>;
}

export function PrintDocument({ children, className }: { children: ReactNode; className?: string }) {
  return <div className="print-scroll max-w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-ring"
    role="region" aria-label="Попередній перегляд документа — прокрутіть горизонтально" tabIndex={0}>
    <div className={cn("print-document min-w-3xl mx-auto bg-background text-foreground", className)}>{children}</div>
  </div>;
}
