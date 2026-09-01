import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { ACCENT } from "@/lib/theme";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  loading?: boolean;
  // Triage shortcut: when set, the whole card links into a filtered queue and
  // the optional actionLabel names the action ("the count becomes the click").
  // `state` carries the queue's pre-applied filters (location.state).
  to?: string;
  actionLabel?: string;
  state?: Record<string, unknown>;
}

const SKELETON_HEIGHTS = [12, 18, 8, 22, 14, 20, 10];

const StatCardSkeleton = () => (
  <div className="bg-card border border-border p-5 animate-pulse">
    <div className="h-3 w-20 bg-muted/50 mb-4" />
    <div className="h-8 w-16 bg-muted/50 mb-3" />
    <div className="flex gap-px h-12 items-end">
      {SKELETON_HEIGHTS.map((h, i) => (
        <div key={i} className="flex-1 bg-muted/30" style={{ height: `${h}px` }} />
      ))}
    </div>
  </div>
);

const StatCard = ({ icon, label, value, loading, to, actionLabel, state }: StatCardProps) => {
  if (loading) return <StatCardSkeleton />;

  const body = (
    <>
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-xs font-normal">{label}</span>
        </div>
        <div className="text-3xl font-bold text-foreground mb-2">{value}</div>
        {to && actionLabel && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${ACCENT}`}>
            {actionLabel}
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" strokeWidth={2} />
          </span>
        )}
      </div>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        state={state}
        className="group/stat block bg-card border border-border p-5 relative overflow-hidden hover:bg-muted/50 transition-colors"
      >
        {body}
      </Link>
    );
  }

  return (
    <div className="group/stat bg-card border border-border p-5 relative overflow-hidden">
      {body}
    </div>
  );
};

export { StatCard, StatCardSkeleton };
