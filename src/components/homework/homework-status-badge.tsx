import type { HomeworkStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"

const VARIANT: Record<HomeworkStatus, "default" | "secondary"> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
}

// Takes an already-translated label so this stays a plain server-renderable
// component instead of needing its own "use client" translation hook.
export function HomeworkStatusBadge({ status, label }: { status: HomeworkStatus; label: string }) {
  return <Badge variant={VARIANT[status]}>{label}</Badge>
}
