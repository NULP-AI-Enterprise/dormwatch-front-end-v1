import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/complaintUtils";

// The resident stepper over the single status machine:
// Очікує → Схвалено → В роботі → На перевірці → Вирішено.
// Terminal outcomes off the pipeline (Відхилено / Не прийнято / Скасовано)
// render as one full-width marker instead of lighting up the path.
//
// Design system §5: the pipeline itself is information — bars are monochrome
// (reached = `bg-foreground`, future = `bg-muted`). Color appears only for a
// genuinely alert terminal: rejected renders a `--destructive` bar.
const PIPELINE = ["pending", "approved", "in_progress", "review", "resolved"] as const;

// Terminal label tones — same four-hue status set as badges (§4). "rejected"
// is the alert outcome that colors the bar; the other terminals stay neutral.
const TERMINAL_TEXT: Record<string, string> = {
  rejected: "text-red-500",
};

interface ProgressStepperProps {
  status: string;
}

const ProgressStepper = ({ status }: ProgressStepperProps) => {
  const s = String(status || "").toLowerCase();

  if (!PIPELINE.includes(s as (typeof PIPELINE)[number])) {
    return (
      <div className="w-full">
        <div className="mb-1.5">
          <span className={cn("text-xs font-semibold", TERMINAL_TEXT[s] ?? "text-muted-foreground")}>
            {STATUS_LABELS[s] ?? s}
          </span>
        </div>
        <div className="flex h-1.5 gap-0.5">
          <div
            className={cn(
              "flex-1 h-full",
              s === "rejected" ? "bg-red-500" : "bg-foreground"
            )}
          />
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
              "text-xs font-semibold",
              i <= currentIdx ? "text-foreground" : "text-muted-foreground"
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
                isReached ? "bg-foreground" : "bg-muted",
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