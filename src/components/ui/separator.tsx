import * as React from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  dashed = false,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root> & {
  dashed?: boolean
}) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 data-horizontal:w-full data-vertical:self-stretch",
        dashed
          ? "border-0 bg-transparent data-horizontal:h-0 data-horizontal:border-t data-vertical:w-0 data-vertical:border-l border-border"
          : "bg-border data-horizontal:h-px data-vertical:w-px",
        className,
        dashed && "border-dashed"
      )}
      {...props}
    />
  )
}

export { Separator }
