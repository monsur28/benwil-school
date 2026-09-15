import type { ReactNode } from "react"
import { getTranslations } from "next-intl/server"
import { requireGuardianIdentity } from "@/lib/portal/identity"
import { PortalShell } from "@/components/portal/portal-shell"
import { PortalNav } from "@/components/portal/portal-nav"

export default async function GuardianPortalLayout({ children }: { children: ReactNode }) {
  const { user } = await requireGuardianIdentity()
  const t = await getTranslations("portal")

  const links = [
    { href: "/portal/guardian", label: t("nav.myChildren"), exact: true },
    { href: "/portal/guardian/notices", label: t("nav.notices") },
  ]

  return (
    <PortalShell user={user} nav={<PortalNav links={links} />}>
      {children}
    </PortalShell>
  )
}
