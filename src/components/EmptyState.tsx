import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

interface EmptyStateProps {
  icon: IconSvgElement;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

// Shared dashed-border empty-state placeholder (DESIGN.md §5 "Intentional
// Empty States"). The `Empty` primitive itself is DESIGN.md-compliant — the
// `icon` media variant renders the `w-12 h-12 border border-border bg-card`
// box and the title uses `text-sm font-semibold` — so this only supplies the
// content (icon, copy, action) around it.
const EmptyState = ({ icon, title, subtitle, action }: EmptyStateProps) => (
  <Empty>
    <EmptyHeader>
      <EmptyMedia variant="icon" className="mb-4">
        <HugeiconsIcon icon={icon} className="size-5" strokeWidth={1.5} />
      </EmptyMedia>
      <EmptyTitle>{title}</EmptyTitle>
      {subtitle && (
        <EmptyDescription className="text-xs">{subtitle}</EmptyDescription>
      )}
    </EmptyHeader>
    {action && <EmptyContent>{action}</EmptyContent>}
  </Empty>
);

export default EmptyState;
