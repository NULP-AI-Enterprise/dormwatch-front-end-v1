import Sparkline from "./Sparkline";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sparklineColor?: string;
  sparklineData?: number[];
  loading?: boolean;
}

const SKELETON_HEIGHTS = [12, 18, 8, 22, 14, 20, 10];

const StatCardSkeleton = () => (
  <div className="bg-stone-800 border border-stone-700 p-5 animate-pulse">
    <div className="h-3 w-20 bg-stone-700/50 mb-4" />
    <div className="h-8 w-16 bg-stone-700/50 mb-3" />
    <div className="flex gap-px h-12 items-end">
      {SKELETON_HEIGHTS.map((h, i) => (
        <div key={i} className="flex-1 bg-stone-700/30" style={{ height: `${h}px` }} />
      ))}
    </div>
  </div>
);

const StatCard = ({ icon, label, value, sparklineColor = "var(--primary)", sparklineData, loading }: StatCardProps) => {
  if (loading) return <StatCardSkeleton />;

  return (
    <div className="group/stat bg-stone-800 border border-stone-700 p-5 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-stone-400 mb-4">
          <span className="text-stone-400">{icon}</span>
          <span className="text-xs font-semibold uppercase tracking-widest">{label}</span>
        </div>
        <div className="text-3xl font-bold text-stone-50 mb-2">{value}</div>
      </div>
      {sparklineData && (
        <div className="absolute bottom-0 right-0 left-0 px-5 pt-0 opacity-20 group-hover/stat:opacity-100 transition-opacity duration-300 pointer-events-none">
          <Sparkline data={sparklineData} color={sparklineColor} />
        </div>
      )}
    </div>
  );
};

export { StatCard, StatCardSkeleton };
