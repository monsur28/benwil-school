import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { ArrowUpRight } from "lucide-react"
import type { HomeworkListItem } from "@/lib/homework/get-homework"
import { formatDate, pickLocalized } from "@/lib/format"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export async function PortalHomeworkWidget({
  homework,
  viewAllHref,
}: {
  homework: HomeworkListItem[]
  viewAllHref: string
}) {
  const [t, tPortal, locale] = await Promise.all([
    getTranslations("homework"),
    getTranslations("portal"),
    getLocale(),
  ])

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t("portal.upcomingTitle")}</CardTitle>
        <Link href={viewAllHref} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          {t("actions.viewAll")}
          <ArrowUpRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {homework.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tPortal("empty.noHomework")}</p>
        ) : (
          <div className="space-y-3">
            {homework.map((item) => (
              <Link key={item.id} href={`${viewAllHref}/${item.id}`} className="block space-y-0.5">
                <p className="text-sm font-medium text-foreground hover:underline">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {pickLocalized(item.subject.name, item.subject.nameBn, locale)} ·{" "}
                  {t("portal.dueOn", { date: formatDate(item.dueDate, locale) })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
