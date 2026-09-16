import type { LucideIcon } from "lucide-react"
import { cn } from "cn"

export interface StatCardProps {
  icon: LucideIcon
  label: string
  value?: string | number
  placeholder?: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  description?: string
  tag?: string
  tagColor?: "green" | "blue" | "yellow" | "red"
  className?: string
}

/**
 * A standalone metric tile, for grids where the surrounding rhythm is a
 * regular grid rather than the divided `StatRow` band (teacher dashboard,
 * module summaries).
 *
 * Number-forward, with the label as a micro-caption above it. A metric with
 * no value yet shows an em dash plus the "coming soon" caption — never a
 * placeholder figure that could be mistaken for real data.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  placeholder,
  change,
  changeType = "neutral",
  description,
  tag,
  tagColor = "blue",
  className,
}: StatCardProps) {
  const tagStyles = {
    green: "border-success-border bg-success-light text-success",
    blue: "border-info-border bg-info-light text-info",
    yellow: "border-warning-border bg-warning-light text-warning",
    red: "border-danger-border bg-danger-light text-danger",
  }[tagColor]

  return (
    <div className={cn("panel flex flex-col justify-between gap-4 px-4 py-4 sm:px-5", className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="eyebrow min-w-0 truncate">{label}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          {tag && (
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                tagStyles
              )}
            >
              {tag}
            </span>
          )}
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </div>

      <div>
        {value !== undefined ? (
          <p className="metric text-[1.75rem] text-foreground">{value}</p>
        ) : (
          <p className="metric text-[1.75rem] text-muted-foreground/40">—</p>
        )}

        <div className="mt-2 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={cn(
                "font-semibold tabular-nums",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-danger",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </span>
          )}
          <span className="truncate text-muted-foreground">{description || placeholder}</span>
        </div>
      </div>
    </div>
  )
}
