import { cn } from "@/lib/utils";
import { STATUS_LABELS, statusColor } from "@/lib/complaintUtils";

// The resident stepper over the single status machine:
// Очікує → Схвалено → В роботі → На перевірці → Вирішено.
// Terminal outcomes off the pipeline (Відхилено / Не прийнято / Скасовано)
// render as one full-width marker instead of lighting up the path.
const PIPELINE = ["pending", "approved", "in_progress", "review", "resolved"] as const;

interface ProgressStepperProps {
  status: string;
}

const ProgressStepper = ({ status }: ProgressStepperProps) => {
  const s = String(status || "").toLowerCase();
  const tone = statusColor(s);

  if (!PIPELINE.includes(s as (typeof PIPELINE)[number])) {
    return (
      <div className="w-full">
        <div className="mb-1.5">
          <span className={cn("text-xs font-semibold", tone.text)}>
            {STATUS_LABELS[s] ?? s}
          </span>
        </div>
        <div className="flex h-1.5 gap-0.5">
          <div className={cn("flex-1 h-full", tone.fill)} />
        </div>
      </div>
    );
  }

  const currentIdx = PIPELINE.indexOf(s as (typeof PIPELINE)[number]);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1.5">
        {PIPELINE.map((key, i) => (
          <span
            key={key}
            className={cn(
              "text-xs font-semibold transition-colors",
              i <= currentIdx ? statusColor(key).text : "text-muted-foreground"
            )}
          >
            {STATUS_LABELS[key]}
          </span>
        ))}
      </div>
      <div className="flex h-1.5 gap-0.5">
        {PIPELINE.map((key, i) => {
          const isReached = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div
              key={key}
              className={cn(
                "flex-1 h-full transition-all duration-500",
                isReached ? tone.fill : "bg-muted",
                isCurrent && key === "in_progress" && "animate-pulse"
              )}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ProgressStepper;
