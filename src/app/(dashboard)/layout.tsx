import type { ReactNode } from "react"
import { requireAuth } from "@/lib/auth/dal"
import { AppShell } from "@/components/shared/app-shell"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireAuth()

  return <AppShell user={user}>{children}</AppShell>
}
