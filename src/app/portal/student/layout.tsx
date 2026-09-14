import type { ReactNode } from "react"
import { getTranslations } from "next-intl/server"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { PortalShell } from "@/components/portal/portal-shell"
import { PortalNav } from "@/components/portal/portal-nav"

export default async function StudentPortalLayout({ children }: { children: ReactNode }) {
  const { user } = await requireStudentIdentity()
  const t = await getTranslations("portal")

  const links = [
    { href: "/portal/student", label: t("nav.dashboard"), exact: true },
    { href: "/portal/student/profile", label: t("nav.profile") },
    { href: "/portal/student/attendance", label: t("nav.attendance") },
    { href: "/portal/student/results", label: t("nav.results") },
  ]

  return (
    <PortalShell user={user} nav={<PortalNav links={links} />}>
      {children}
    </PortalShell>
  )
}
