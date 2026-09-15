import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { ArrowLeft } from "lucide-react"
import type { VisibleNoticeListItem } from "@/lib/notices/notice-visibility"
import { formatDateTime, pickLocalized } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export async function SharedNoticeDetail({
  notice,
  basePath,
}: {
  notice: VisibleNoticeListItem
  basePath: string
}) {
  const [t, locale] = await Promise.all([getTranslations("notices"), getLocale()])

  return (
    <div className="space-y-4">
      <Button nativeButton={false} variant="ghost" size="sm" className="gap-1.5" render={<Link href={basePath} />}>
        <ArrowLeft className="size-4" />
        {t("portal.backToList")}
      </Button>

      <Card>
        <CardHeader className="space-y-2">
          <span className="w-fit rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {pickLocalized(notice.category.name, notice.category.nameBn, locale)}
          </span>
          <CardTitle className="text-lg">{pickLocalized(notice.title, notice.titleBn, locale)}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {t("portal.publishedOn", { date: formatDateTime(notice.publishAt, locale) })}
          </p>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-sm text-foreground">
            {pickLocalized(notice.content, notice.contentBn, locale)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
