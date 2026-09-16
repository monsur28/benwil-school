import { Card } from "@/components/ui/card"
import { Calendar } from "lucide-react"

interface PortalTodayCardProps {
  quote?: string
}

export function PortalTodayCard({
  quote = "Be curious, be consistent, be your best!",
}: PortalTodayCardProps) {
  const today = new Date()
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <Card className="p-6 flex flex-col justify-between h-full bg-card border-border">
      <div className="space-y-1">
        <div className="flex items-center space-x-2 text-muted-foreground mb-2">
          <Calendar className="w-4 h-4 text-info" />
          <h3 className="text-sm font-medium uppercase tracking-wider">Today</h3>
        </div>
        <p className="text-xl font-bold text-foreground">{dateString}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-sm italic text-muted-foreground">&quot;{quote}&quot;</p>
      </div>
    </Card>
  )
}
