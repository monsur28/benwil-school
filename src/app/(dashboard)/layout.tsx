import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"
import { requireAuth } from "@/lib/auth/dal"
import { portalHomeForRole } from "@/lib/portal/routes"
import { AppShell } from "@/components/shared/app-shell"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireAuth()

  // Students/guardians live entirely under /portal - one redirect here
  // keeps the whole admin shell (every route under this layout) unreachable
  // for them, rather than relying on each individual page to check.
  if (user.role === Role.STUDENT || user.role === Role.GUARDIAN) {
    redirect(portalHomeForRole(user.role))
  }

  return <AppShell user={user}>{children}</AppShell>
}
