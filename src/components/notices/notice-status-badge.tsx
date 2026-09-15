import type { NoticeStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"

const VARIANT: Record<NoticeStatus, "default" | "outline" | "secondary" | "destructive"> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  ARCHIVED: "outline",
}

// Takes an already-translated label so this stays a plain server-renderable
// component instead of needing its own "use client" translation hook.
export function NoticeStatusBadge({ status, label }: { status: NoticeStatus; label: string }) {
  return <Badge variant={VARIANT[status]}>{label}</Badge>
}
