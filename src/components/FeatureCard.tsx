import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";

interface FeatureCardProps {
  icon: IconSvgElement;
  iconColor?: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon, iconColor = "text-blue-400", title, description }: FeatureCardProps) {
  return (
    <div className="bg-card border border-border p-8 relative group hover:border-border/80 transition-colors">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-12 h-12 bg-background border border-border mb-6 flex items-center justify-center">
        <HugeiconsIcon icon={icon} className={`size-6 ${iconColor}`} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}