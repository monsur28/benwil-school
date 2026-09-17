import type { StudentStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"

// Mapped onto the semantic badge tones rather than the neutral ones: a
// student's status is a state, so it should be readable by colour alone
// (green = enrolled and attending, red = withdrawn) as well as by label.
const VARIANT: Record<StudentStatus, "success" | "muted" | "info" | "destructive"> = {
  ACTIVE: "success",
  INACTIVE: "muted",
  GRADUATED: "info",
  WITHDRAWN: "destructive",
}

// Takes an already-translated label so this stays a plain server-renderable
// component instead of needing its own "use client" translation hook.
export function StudentStatusBadge({ status, label }: { status: StudentStatus; label: string }) {
  return <Badge variant={VARIANT[status]}>{label}</Badge>
}
