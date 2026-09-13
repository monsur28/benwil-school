import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { CalendarRange, Layers, BookOpen, Users2 } from "lucide-react"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function AcademicsPage() {
  await requireRole(...getRolesForHref("/academics"))
  const t = await getTranslations("academics")

  const cards = [
    { href: "/academics/years", icon: CalendarRange, title: t("years.title"), description: t("years.description") },
    { href: "/academics/classes", icon: Layers, title: t("classes.title"), description: t("classes.description") },
    { href: "/academics/subjects", icon: BookOpen, title: t("subjects.title"), description: t("subjects.description") },
    { href: "/academics/assignments", icon: Users2, title: t("assignments.title"), description: t("assignments.description") },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <card.icon className="size-5 text-muted-foreground" />
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
