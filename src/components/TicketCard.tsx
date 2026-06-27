import ProgressStepper from "./ProgressStepper";
import { Separator } from "./ui/separator";
import { statusBadgeClass, statusLabel } from "../lib/complaintUtils";

interface TicketCardProps {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  status: string;
  location?: string;
  categoryLabel?: string;
}

const stageMap: Record<string, "submitted" | "in_progress" | "resolved"> = {
  pending: "submitted",
  approved: "in_progress",
  resolved: "resolved",
};

const TicketCardSkeleton = () => (
  <div className="bg-stone-800 border border-stone-700 overflow-hidden animate-pulse">
    <div className="p-6">
      <div className="flex justify-between items-start mb-3">
        <div className="h-4 w-16 bg-stone-700/50" />
        <div className="h-3 w-12 bg-stone-700/30" />
      </div>
      <div className="h-5 w-3/4 bg-stone-700/50 mb-2" />
      <div className="h-3 w-full bg-stone-700/30 mb-1" />
      <div className="h-3 w-2/3 bg-stone-700/30 mb-4" />
      <Separator className="bg-stone-700 mb-4" />
      <div className="h-1.5 bg-stone-700/50 rounded-none" />
    </div>
  </div>
);

const TicketCard = ({ id, title, description, category, date, status, location, categoryLabel }: TicketCardProps) => {
  const step = stageMap[status] || "submitted";

  return (
    <div className="group/ticket bg-stone-800 border border-stone-700 relative overflow-hidden hover:border-stone-600 transition-colors">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover/ticket:opacity-100 transition-opacity" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
              {categoryLabel || category}
            </span>
            <span className="w-1 h-1 bg-stone-600" />
            <span className="text-xs text-stone-500">{date}</span>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold ${statusBadgeClass(status)}`}>
            {statusLabel(status)}
          </span>
        </div>

        <div>
          <h3 className="font-bold text-lg text-stone-50 group-hover/ticket:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-stone-400 mt-1 leading-relaxed">
            {description}
          </p>
        </div>

        <Separator className="bg-stone-700 my-5" />

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <ProgressStepper stage={step} />
          </div>
          <span className="ml-3 text-[8px] font-semibold uppercase tracking-widest text-stone-600 shrink-0 border-l border-dashed border-stone-700 pl-3">
            #{id}
          </span>
        </div>
        {location && (
          <p className="text-[10px] text-stone-400 mt-2">{location}</p>
        )}
      </div>
    </div>
  );
};

export { TicketCard, TicketCardSkeleton };
