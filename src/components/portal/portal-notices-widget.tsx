import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { Megaphone } from "lucide-react"
import type { VisibleNoticeListItem } from "@/lib/notices/notice-visibility"
import { pickLocalized } from "@/lib/format"
import { Card } from "@/components/ui/card"

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
    <Card className="p-6 h-full flex flex-col bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">{t("portal.recentTitle")}</h3>
        <Link href={viewAllHref} className="shrink-0 whitespace-nowrap text-sm text-info hover:underline">
          {t("actions.viewAll")}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
        {notices.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tPortal("empty.noNotices")}</p>
        ) : (
          notices.map((notice) => (
            <Link
              key={notice.id}
              href={`${viewAllHref}/${notice.id}`}
              className="flex items-start gap-4 p-3 rounded-lg border border-border hover:bg-muted transition-colors group"
            >
              <div className="bg-dashboard-purple-light text-dashboard-purple rounded-full p-2 mt-1 group-hover:bg-dashboard-purple group-hover:text-white transition-colors">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">
                  {pickLocalized(notice.title, notice.titleBn, locale)}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {pickLocalized(notice.category.name, notice.category.nameBn, locale)}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </Card>
  )
}
