import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { ArrowUpRight } from "lucide-react"
import type { VisibleNoticeListItem } from "@/lib/notices/notice-visibility"
import { pickLocalized } from "@/lib/format"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export async function PortalNoticesWidget({
  notices,
  viewAllHref,
}: {
  notices: VisibleNoticeListItem[]
  viewAllHref: string
}) {
  const [t, tPortal, locale] = await Promise.all([
    getTranslations("notices"),
    getTranslations("portal"),
    getLocale(),
  ])

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t("portal.recentTitle")}</CardTitle>
        <Link href={viewAllHref} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          {t("actions.viewAll")}
          <ArrowUpRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {notices.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tPortal("empty.noNotices")}</p>
        ) : (
          <div className="space-y-3">
            {notices.map((notice) => (
              <Link key={notice.id} href={`${viewAllHref}/${notice.id}`} className="block space-y-0.5">
                <p className="text-sm font-medium text-foreground hover:underline">
                  {pickLocalized(notice.title, notice.titleBn, locale)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pickLocalized(notice.category.name, notice.category.nameBn, locale)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
