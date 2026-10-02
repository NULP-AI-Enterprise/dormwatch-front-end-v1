import { useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal } from "lucide-react";

// List-page filters live behind one trigger that opens a side sheet — the same
// drawer interaction as the mobile nav, but offered at every breakpoint. The
// page body keeps only the search field and the trigger, so data starts at the
// top on desktop too. Filtering is live (client-side), so the footer resets or
// dismisses; there is deliberately no "apply" step to imply.
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

export function FilterSheet({
  children,
  onReset,
  activeCount = 0,
  resultCount,
  title = "Фільтри",
  triggerLabel = "Фільтри",
  resetLabel = "Скинути",
  hideReset = false,
}: FilterSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="w-full sm:w-auto"
      >
        <span className="flex items-center gap-1.5">
          <SlidersHorizontal className="size-4" strokeWidth={2} />
          {triggerLabel}
          {activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center bg-primary px-1 text-xs leading-none font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <div className="flex min-h-full flex-col">
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>
                Звузьте список за потрібними ознаками.
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 py-4">{children}</div>

            <SheetFooter className="sticky bottom-0 mt-auto flex-row items-center gap-2 border-t border-border bg-surface-raised">
              <span className="mr-auto text-xs text-muted-foreground">
                {resultCount != null ? `Знайдено: ${resultCount}` : ""}
              </span>
              {!hideReset && (
                <Button variant="outline" onClick={onReset}>
                  {resetLabel}
                </Button>
              )}
              <Button onClick={() => setOpen(false)}>Готово</Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </>
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
      <Label className="font-semibold">{label}</Label>
      {children}
    </div>
  );
}
