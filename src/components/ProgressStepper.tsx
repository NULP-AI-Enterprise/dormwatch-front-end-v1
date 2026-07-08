import { cn } from "@/lib/utils";

interface ProgressStepperProps {
  stage: "submitted" | "in_progress" | "resolved" | "rejected";
}

const stages = [
  { key: "submitted", label: "Створено", accent: "text-blue-400" },
  { key: "in_progress", label: "В роботі", accent: "text-blue-400" },
  { key: "resolved", label: "Вирішено", accent: "text-green-500" },
] as const;

const ProgressStepper = ({ stage }: ProgressStepperProps) => {
  // A rejected complaint is not in the normal pipeline — show a single terminal
  // "Відхилено" state instead of lighting up the submitted→resolved steps.
  if (stage === "rejected") {
    return (
      <div className="w-full">
        <div className="mb-1.5">
          <span className="text-xs font-semibold text-red-500">Відхилено</span>
        </div>
        <div className="flex h-1.5 gap-0.5">
          <div className="flex-1 h-full bg-red-500" />
        </div>
      </div>
    );
  }

  const currentIdx = stages.findIndex((s) => s.key === stage);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1.5">
        {stages.map((s, i) => (
          <span
            key={s.key}
            className={cn(
              "text-xs font-semibold transition-colors",
              i === currentIdx
                ? s.accent
                : i < currentIdx
                ? "text-blue-400"
                : "text-muted-foreground"
            )}
          >
            {s.label}
          </span>
        ))}
      </div>
      <div className="flex h-1.5 gap-0.5">
        {stages.map((s, i) => {
          const isComplete = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div
              key={s.key}
              className={cn(
                "flex-1 h-full transition-all duration-500",
                isComplete && "bg-blue-500",
                isCurrent && stage === "in_progress" && "bg-blue-500 animate-pulse",
                isCurrent && stage !== "in_progress" && "bg-blue-500",
                !isComplete && !isCurrent && "bg-muted"
              )}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ProgressStepper;
