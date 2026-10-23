import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Design system §5: content-sized, keyboard-operable photo preview trigger.
export function PhotoAttachment({ className, ...props }: ComponentProps<typeof Button>) {
  return <Button type="button" variant="outline" size="content" aria-label="Збільшити фото"
    className={cn("relative max-w-full overflow-hidden p-0 cursor-zoom-in", className)} {...props} />;
}
