interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  loading?: boolean;
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

const StatCard = ({ icon, label, value, loading }: StatCardProps) => {
  if (loading) return <StatCardSkeleton />;

  return (
    <div className="group/stat bg-card border border-border p-5 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-xs font-semibold">{label}</span>
        </div>
        <div className="text-3xl font-bold text-foreground mb-2">{value}</div>
      </div>
    </div>
  );
};

export { StatCard, StatCardSkeleton };
