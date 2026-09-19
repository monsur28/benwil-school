import type { ReactNode } from "react"
import { getLocale, getTranslations } from "next-intl/server"
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
  const [t, locale] = await Promise.all([getTranslations("portal"), getLocale()])

  // Never trust the studentId in the URL alone - re-verify the link every
  // request, the same way checkResultAccess re-verifies a teacher's
  // assignment rather than trusting a dropdown's earlier filtering.
  await requireGuardianChild(guardian.id, studentId, user.schoolId)

  const base = `/portal/guardian/children/${studentId}`
  const links = [
    { href: base, label: t("nav.dashboard"), exact: true, iconKey: "dashboard" as const },
    {
      href: `${base}/profile`,
      label: locale === "bn" ? "শিক্ষার্থীর প্রোফাইল" : "Student Profile",
      iconKey: "profile" as const,
    },
    { href: `${base}/attendance`, label: t("nav.attendance"), iconKey: "attendance" as const },
    { href: `${base}/routine`, label: t("nav.routine"), iconKey: "routine" as const },
    { href: `${base}/results`, label: t("nav.results"), iconKey: "results" as const },
    { href: `${base}/fees`, label: t("nav.fees"), iconKey: "fees" as const },
    { href: `${base}/homework`, label: t("nav.homework"), iconKey: "homework" as const },
  ]

  return (
    <div className="space-y-4">
      <ChildSwitcher options={linkedChildren} selectedId={studentId} />
      <PortalNav links={links} />
      {children}
    </div>
  )
}
