import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ACCENT } from "@/lib/theme";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: React.ReactNode;
  loading?: boolean;
  // Triage shortcut: when set, the whole card links into a filtered queue and
  // the optional actionLabel names the action ("the count becomes the click").
  // `state` carries the queue's pre-applied filters (location.state).
  to?: string;
  actionLabel?: string;
  state?: Record<string, unknown>;
}

const StatCardSkeleton = () => (
  <div className="bg-card border border-border p-5 animate-pulse flex flex-col items-center justify-center text-center">
    <div className="h-3 w-20 bg-muted/50 mb-4" />
    <div className="h-8 w-16 bg-muted/50" />
  </div>
);

const StatCard = ({ icon, label, value, subtitle, loading, to, actionLabel, state }: StatCardProps) => {
  if (loading) return <StatCardSkeleton />;

  const body = (
    <>
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        </div>
        <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
        {subtitle && (
          <div className="text-xs text-muted-foreground font-normal">
            {subtitle}
          </div>
        )}
        {to && actionLabel && (
          <span className={`flex items-center justify-center gap-1 text-xs font-semibold mt-2 ${ACCENT}`}>
            {actionLabel}
            <ChevronRight className="size-3" strokeWidth={2} />
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
