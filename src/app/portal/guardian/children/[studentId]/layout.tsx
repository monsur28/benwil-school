import type { ReactNode } from "react"
import { getTranslations } from "next-intl/server"
import { requireGuardianIdentity, requireGuardianChild } from "@/lib/portal/identity"
import { ChildSwitcher } from "@/components/portal/child-switcher"
import { PortalNav } from "@/components/portal/portal-nav"

export default async function GuardianChildLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ studentId: string }>
}) {
  const { user, guardian, children: linkedChildren } = await requireGuardianIdentity()
  const { studentId } = await params
  const t = await getTranslations("portal")

  // Never trust the studentId in the URL alone - re-verify the link every
  // request, the same way checkResultAccess re-verifies a teacher's
  // assignment rather than trusting a dropdown's earlier filtering.
  await requireGuardianChild(guardian.id, studentId, user.schoolId)

  const base = `/portal/guardian/children/${studentId}`
  const links = [
    { href: base, label: t("nav.dashboard"), exact: true },
    { href: `${base}/profile`, label: t("nav.profile") },
    { href: `${base}/attendance`, label: t("nav.attendance") },
    { href: `${base}/results`, label: t("nav.results") },
    { href: `${base}/fees`, label: t("nav.fees") },
    { href: `${base}/homework`, label: t("nav.homework") },
  ]

  return (
    <div className="space-y-4">
      <ChildSwitcher options={linkedChildren} selectedId={studentId} />
      <PortalNav links={links} />
      {children}
    </div>
  )
}
