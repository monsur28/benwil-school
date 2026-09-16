import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { School, Palette, LogIn, SlidersHorizontal } from "lucide-react"
import { requireSettingsAccess } from "@/lib/settings/settings-access"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function SettingsPage() {
  await requireSettingsAccess()
  const t = await getTranslations("settings")

  const cards = [
    { href: "/settings/school", icon: School, title: t("school.title"), description: t("school.description") },
    { href: "/settings/branding", icon: Palette, title: t("branding.title"), description: t("branding.description") },
    { href: "/settings/branding#login", icon: LogIn, title: t("loginExperience.title"), description: t("loginExperience.description") },
    { href: "/settings/system", icon: SlidersHorizontal, title: t("system.title"), description: t("system.description") },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
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
