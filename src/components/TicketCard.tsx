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
  <div className="bg-card border border-border overflow-hidden animate-pulse">
    <div className="p-6">
      <div className="flex justify-between items-start mb-3">
        <div className="h-4 w-16 bg-muted/50" />
        <div className="h-3 w-12 bg-muted/30" />
      </div>
      <div className="h-5 w-3/4 bg-muted/50 mb-2" />
      <div className="h-3 w-full bg-muted/30 mb-1" />
      <div className="h-3 w-2/3 bg-muted/30 mb-4" />
      <Separator className="mb-4" />
      <div className="h-1.5 bg-muted/50 rounded-none" />
    </div>
  </div>
);

const TicketCard = ({ id, title, description, category, date, status, location, categoryLabel }: TicketCardProps) => {
  const step = stageMap[status] || "submitted";

  return (
    <div className="group/ticket bg-card border border-border relative overflow-hidden hover:border-border transition-colors">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover/ticket:opacity-100 transition-opacity" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">
              {categoryLabel || category}
            </span>
            <span className="w-1 h-1 bg-border" />
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(status)}`}>
            {statusLabel(status)}
          </span>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground group-hover/ticket:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed break-all whitespace-pre-wrap">
            {description}
          </p>
        </div>

        <Separator className="my-5" />

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <ProgressStepper stage={step} />
          </div>
          <Separator orientation="vertical" dashed className="border-border h-6" />
          <span className="ml-3 text-xs font-semibold text-muted-foreground shrink-0 pl-3">
            #{id}
          </span>
        </div>
        {location && (
          <p className="text-xs text-muted-foreground mt-2">{location}</p>
        )}
      </div>
    </div>
  );
};

export { TicketCard, TicketCardSkeleton };
