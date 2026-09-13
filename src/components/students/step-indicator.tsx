import { Check } from "lucide-react"
import { cn } from "cn"

export function StepIndicator({
  steps,
  currentStep,
}: {
  steps: string[]
  currentStep: number
}) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {steps.map((label, index) => {
        const isDone = index < currentStep
        const isCurrent = index === currentStep

        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                isDone && "border-primary bg-primary text-primary-foreground",
                isCurrent && "border-primary text-primary",
                !isDone && !isCurrent && "border-border text-muted-foreground"
              )}
            >
              {isDone ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span
              className={cn(
                "whitespace-nowrap",
                isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {index < steps.length - 1 && (
              <span className="mx-1 h-px w-4 shrink-0 bg-border sm:w-8" aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
