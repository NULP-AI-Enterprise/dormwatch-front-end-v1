import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

// Shared dashed-border empty-state placeholder (design-system.md §5 "Intentional
// Empty States"). The `Empty` primitive itself is design-system.md-compliant — the
// `icon` media variant renders the `w-12 h-12 border border-border bg-card`
// box and the title uses `text-sm font-semibold` — so this only supplies the
// content (icon, copy, action) around it.
const EmptyState = ({ icon: Icon, title, subtitle, action }: EmptyStateProps) => (
  <Empty>
    <EmptyHeader>
      <EmptyMedia variant="icon" className="mb-4">
        <Icon className="size-5" strokeWidth={1.5} />
      </EmptyMedia>
      <EmptyTitle>{title}</EmptyTitle>
      {subtitle && (
        <EmptyDescription className="text-sm">{subtitle}</EmptyDescription>
      )}
    </EmptyHeader>
    {action && <EmptyContent>{action}</EmptyContent>}
  </Empty>
);

export default EmptyState;
