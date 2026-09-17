import { getTranslations } from "next-intl/server"
import { CalendarRange, Layers, BookOpen, Users2 } from "lucide-react"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { PageHeader } from "@/components/shared/page-header"
import { DirectoryList, type DirectoryEntry } from "@/components/shared/directory-list"

export default async function AcademicsPage() {
  await requireRole(...getRolesForHref("/academics"))
  const t = await getTranslations("academics")

  const entries: DirectoryEntry[] = [
    { href: "/academics/years", icon: CalendarRange, title: t("years.title"), description: t("years.description") },
    { href: "/academics/classes", icon: Layers, title: t("classes.title"), description: t("classes.description") },
    { href: "/academics/subjects", icon: BookOpen, title: t("subjects.title"), description: t("subjects.description") },
    { href: "/academics/assignments", icon: Users2, title: t("assignments.title"), description: t("assignments.description") },
  ]

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader title={t("title")} />
      <DirectoryList entries={entries} />
    </div>
  )
}
