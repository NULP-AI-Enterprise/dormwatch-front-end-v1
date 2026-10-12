import { useState, useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, ChevronUp, ChevronDown, X, RotateCcw, Check } from "lucide-react";

type FilterSheetProps = {
  children: ReactNode;
  onReset: () => void;
  // Number of active filters shown as a badge on the trigger.
  activeCount?: number;
  // Live count of matching rows, surfaced in the footer for feedback.
  resultCount?: number;
  title?: string;
  triggerLabel?: string;
  resetLabel?: string;
  hideReset?: boolean;
};

/**
 * FilterPopover (aliased as FilterSheet for compatibility):
 * Renders filters in a floating popover window below the trigger button.
 */
export function FilterSheet({
  children,
  onReset,
  activeCount = 0,
  resultCount,
  title = "Фільтри",
  triggerLabel = "Фільтри",
  resetLabel = "Скинути все",
  hideReset = false,
}: FilterSheetProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (containerRef.current?.contains(target)) return;
      if (
        target.closest(
          '[data-slot="combobox-content"], [data-slot="popover-content"], [role="listbox"], [role="dialog"], [role="presentation"], [data-slot="select-content"], .rdp, .react-day-picker'
        )
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant={activeCount > 0 ? "default" : "outline"}
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="h-9 gap-2 text-xs font-semibold shrink-0 cursor-pointer"
      >
        <SlidersHorizontal className="size-4" strokeWidth={2} />
        <span>{triggerLabel}</span>
        {activeCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.2 bg-background text-foreground text-[11px] font-bold border border-border">
            {activeCount}
          </span>
        )}
        {open ? (
          <ChevronUp className="size-3.5 opacity-70" strokeWidth={2} />
        ) : (
          <ChevronDown className="size-3.5 opacity-70" strokeWidth={2} />
        )}
      </Button>

      {open && (
        <div className="absolute left-0 sm:left-auto right-auto top-full mt-2 z-50 w-[min(calc(100vw-2.5rem),480px)] bg-card border border-border shadow-xl p-4 space-y-4 rounded-none animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-foreground" strokeWidth={2} />
              <span className="text-xs font-semibold text-foreground">
                {title}
              </span>
              {activeCount > 0 && (
                <Badge variant="secondary" className="text-[11px] px-1.5 py-0 font-normal">
                  Активно: {activeCount}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              title="Згорнути"
            >
              <X className="size-4" strokeWidth={2} />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {children}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            {!hideReset ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                disabled={activeCount === 0}
                className="text-xs text-muted-foreground hover:text-foreground h-8 px-2 cursor-pointer"
              >
                <RotateCcw className="size-3.5 mr-1" strokeWidth={2} />
                {resetLabel}
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              {resultCount != null && (
                <span className="text-xs text-muted-foreground mr-1">
                  Знайдено: {resultCount}
                </span>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold h-8 px-4 cursor-pointer"
              >
                <Check className="size-3.5 mr-1" strokeWidth={2} />
                Згорнути
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// One labeled filter control. The label carries the field name, so the control
// inside uses a neutral "all" placeholder instead of repeating it.
export function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
