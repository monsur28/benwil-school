import type { ReactNode } from "react"
import { getTranslations } from "next-intl/server"
import { Users, Megaphone } from "lucide-react"
import { requireGuardianIdentity } from "@/lib/portal/identity"
import { AppShell } from "@/components/shared/app-shell"

export default async function GuardianPortalLayout({ children }: { children: ReactNode }) {
  const { user } = await requireGuardianIdentity()
  const t = await getTranslations()

  const customNavGroups = [
    {
      titleKey: "nav.groups.overview",
      title: t("nav.dashboard", { fallback: "Dashboard" }),
      items: [
        { href: "/portal/guardian", label: t("nav.myChildren", { fallback: "My Children" }), icon: <Users className="size-4" /> },
      ],
    },
    {
      titleKey: "nav.groups.communication",
      title: t("nav.groups.communication", { fallback: "Communication" }),
      items: [
        { href: "/portal/guardian/notices", label: t("nav.notices"), icon: <Megaphone className="size-4" /> },
      ],
    },
  ]

  const customNavItems = customNavGroups.flatMap(g => g.items)

  return (
    <AppShell user={user} customNavGroups={customNavGroups} customNavItems={customNavItems}>
      {children}
    </AppShell>
  )
}
