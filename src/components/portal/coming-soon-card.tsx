import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "cn"

export function ComingSoonCard({
  icon: Icon,
  title,
  description,
  badgeLabel,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  badgeLabel: string
  className?: string
}) {
  return (
    <Card className={cn("p-6 h-full flex flex-col border-dashed bg-card", className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-full bg-muted p-2 text-muted-foreground">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8 text-center">
        <Icon className="w-8 h-8 text-muted-foreground/40" aria-hidden />
        <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
          {badgeLabel}
        </Badge>
        <p className="text-xs text-muted-foreground max-w-[26ch]">{description}</p>
      </div>
    </Card>
  )
}
