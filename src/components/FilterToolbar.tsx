import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Refresh01Icon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";

// Compact single-row filter toolbar. Replaces the 4-section filter sidebar
// (status/priority/category/date stacked vertically on a 25% column) with a
// single horizontal card that holds the controls inline. On narrow widths the
// children wrap; on `sm:` and up they sit side by side.
//
// One reset button is provided automatically (caller passes `onReset`); the
// caller decides which controls to show and which state they bind to. This
// keeps the toolbar shape consistent across sibling pages and guarantees the
// "data first" mobile order — the toolbar is one short row, the data renders
// below it.

type FilterToolbarProps = {
  children: ReactNode;
  onReset: () => void;
  resetLabel?: string;
  // When true, the "Скинути фільтри" button is hidden (the caller's state is
  // always-empty by design, e.g. a default landing tab).
  hideReset?: boolean;
};

export function FilterToolbar({
  children,
  onReset,
  resetLabel = "Скинути фільтри",
  hideReset = false,
}: FilterToolbarProps) {
  return (
    <Card className="border-border shadow-none bg-card">
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          {children}
          {!hideReset && (
            <Button
              variant="outline"
              size="xs"
              onClick={onReset}
              className="sm:ml-auto"
            >
              <HugeiconsIcon
                icon={Refresh01Icon}
                className="size-3 mr-1"
                strokeWidth={2}
              />
              {resetLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
