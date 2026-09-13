import { Badge } from "@/components/ui/badge"

export function ActiveBadge({ isActive, activeLabel, inactiveLabel }: { isActive: boolean; activeLabel: string; inactiveLabel: string }) {
  return (
    <Badge variant={isActive ? "default" : "outline"}>{isActive ? activeLabel : inactiveLabel}</Badge>
  )
}
