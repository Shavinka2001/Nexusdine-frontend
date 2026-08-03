import { cn } from "@/lib/cn";

const STEPS = [
  { id: 1, label: "Personal" },
  { id: 2, label: "Business" },
  { id: 3, label: "Setup" },
] as const;

interface StepProgressProps {
  current: 1 | 2 | 3;
}

export function StepProgress({ current }: StepProgressProps) {
  const progress = ((current - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between text-xs font-medium text-secondary-400">
        <span>
          Step {current} of {STEPS.length}
        </span>
        <span>{STEPS[current - 1].label}</span>
      </div>

      <div className="relative h-1.5 overflow-hidden rounded-full bg-secondary-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="mt-4 flex justify-between">
        {STEPS.map((step) => {
          const done = step.id < current;
          const active = step.id === current;

          return (
            <li key={step.id} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  done && "bg-primary text-white",
                  active && "bg-primary text-white ring-4 ring-primary/20",
                  !done && !active && "bg-secondary-100 text-secondary-400",
                )}
              >
                {step.id}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active || done ? "text-secondary" : "text-secondary-400",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
