import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function StatCard({
  icon: Icon,
  label,
  placeholder,
}: {
  icon: LucideIcon
  label: string
  placeholder: string
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-muted-foreground/50">—</p>
          <p className="text-xs text-muted-foreground/70">{placeholder}</p>
        </div>
        <Icon className="size-5 shrink-0 text-muted-foreground/50" />
      </CardContent>
    </Card>
  )
}
