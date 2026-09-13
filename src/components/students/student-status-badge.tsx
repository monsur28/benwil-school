import type { StudentStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"

const VARIANT: Record<StudentStatus, "default" | "outline" | "secondary" | "destructive"> = {
  ACTIVE: "default",
  INACTIVE: "outline",
  GRADUATED: "secondary",
  WITHDRAWN: "destructive",
}

// Takes an already-translated label so this stays a plain server-renderable
// component instead of needing its own "use client" translation hook.
export function StudentStatusBadge({ status, label }: { status: StudentStatus; label: string }) {
  return <Badge variant={VARIANT[status]}>{label}</Badge>
}
