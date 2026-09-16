import type { ReactNode } from "react"
import { getTranslations } from "next-intl/server"
import { LayoutDashboard, User, ClipboardCheck, Award, Wallet, Megaphone, NotebookPen } from "lucide-react"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { AppShell } from "@/components/shared/app-shell"

export default async function StudentPortalLayout({ children }: { children: ReactNode }) {
  const { user } = await requireStudentIdentity()
  const t = await getTranslations()

  const customNavGroups = [
    {
      titleKey: "nav.groups.overview",
      title: t("nav.groups.overview"),
      items: [
        { href: "/portal/student", label: t("nav.dashboard"), icon: <LayoutDashboard className="size-4" /> },
        { href: "/portal/student/profile", label: t("nav.profile", { fallback: "Profile" }), icon: <User className="size-4" /> },
      ],
    },
    {
      titleKey: "nav.groups.academics",
      title: t("nav.groups.academics", { fallback: "Academics" }),
      items: [
        { href: "/portal/student/attendance", label: t("nav.attendance"), icon: <ClipboardCheck className="size-4" /> },
        { href: "/portal/student/results", label: t("nav.examsResults", { fallback: "Results" }), icon: <Award className="size-4" /> },
        { href: "/portal/student/homework", label: t("nav.homework"), icon: <NotebookPen className="size-4" /> },
      ],
    },
    {
      titleKey: "nav.groups.finance",
      title: t("nav.groups.finance", { fallback: "Finance" }),
      items: [
        { href: "/portal/student/fees", label: t("nav.fees"), icon: <Wallet className="size-4" /> },
      ],
    },
    {
      titleKey: "nav.groups.communication",
      title: t("nav.groups.communication", { fallback: "Communication" }),
      items: [
        { href: "/portal/student/notices", label: t("nav.notices"), icon: <Megaphone className="size-4" /> },
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
