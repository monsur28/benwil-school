import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { Megaphone } from "lucide-react"
import type { VisibleNoticeListItem } from "@/lib/notices/notice-visibility"
import { formatDate, pickLocalized } from "@/lib/format"
import { EmptyState } from "@/components/shared/empty-state"
import { Card } from "@/components/ui/card"

export async function SharedNoticesList({
  notices,
  basePath,
}: {
  notices: VisibleNoticeListItem[]
  basePath: string
}) {
  const [tPortal, locale] = await Promise.all([getTranslations("portal"), getLocale()])

  if (notices.length === 0) {
    return <EmptyState icon={Megaphone} title={tPortal("empty.noNoticesTitle")} description={tPortal("empty.noNotices")} />
  }

  return (
    <div className="space-y-3">
      {notices.map((notice) => (
        <Link key={notice.id} href={`${basePath}/${notice.id}`}>
          <Card className="gap-2 p-4 transition-colors hover:bg-muted/40">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {pickLocalized(notice.category.name, notice.category.nameBn, locale)}
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(notice.publishAt, locale)}</span>
            </div>
            <h3 className="font-medium text-foreground">
              {pickLocalized(notice.title, notice.titleBn, locale)}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {pickLocalized(notice.content, notice.contentBn, locale)}
            </p>
          </Card>
        </Link>
      ))}
    </div>
  )
}
