import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

interface ArrowLinkButtonProps {
  to: string;
  children: React.ReactNode;
  size?: "default" | "sm" | "lg";
  className?: string;
}

// Primary link-button with a right arrow that nudges forward on hover. A thin
// wrapper over the shadcn Button (default variant) rendered as a Link via
// asChild — all color / hover / focus / active / typography styling comes from
// Button, not bespoke classes. The arrow reuses Button's own `group/button`
// hover scope for the nudge, and `data-icon="inline-end"` lets Button apply its
// trailing-icon padding.
export default function ArrowLinkButton({
  to,
  children,
  size = "default",
  className,
}: ArrowLinkButtonProps) {
  return (
    <Button asChild size={size} className={className}>
      <Link to={to}>
        {children}
        <HugeiconsIcon
          icon={ArrowRight02Icon}
          data-icon="inline-end"
          strokeWidth={2}
          className="group-hover/button:translate-x-1 transition-transform"
        />
      </Link>
    </Button>
  );
}
