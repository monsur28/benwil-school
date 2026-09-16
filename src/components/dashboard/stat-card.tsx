import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
    green: "bg-success/10 text-success border-success/20",
    blue: "bg-info/10 text-info border-info/20",
    yellow: "bg-warning/10 text-warning border-warning/20",
    red: "bg-destructive/10 text-destructive border-destructive/20",
  }[tagColor]

  return (
    <Card className={cn("transition-all duration-200 hover:border-foreground/20", className)}>
      <CardContent className="flex flex-col justify-between gap-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <div className="flex items-center gap-1.5">
            {tag && (
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase", tagStyles)}>
                {tag}
              </span>
            )}
            <div className="flex size-7 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-muted-foreground">
              <Icon className="size-3.5" />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {value !== undefined ? (
            <p className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {value}
            </p>
          ) : (
            <p className="text-2xl font-semibold tracking-tight text-muted-foreground/40">—</p>
          )}

          <div className="flex items-center gap-2 pt-0.5 text-xs">
            {change && (
              <span
                className={cn(
                  "font-mono font-medium",
                  changeType === "positive" && "text-success",
                  changeType === "negative" && "text-destructive",
                  changeType === "neutral" && "text-muted-foreground"
                )}
              >
                {change}
              </span>
            )}
            <span className="truncate text-muted-foreground">
              {description || placeholder}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
