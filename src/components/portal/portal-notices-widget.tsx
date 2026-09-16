import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { Megaphone } from "lucide-react"
import type { VisibleNoticeListItem } from "@/lib/notices/notice-visibility"
import { pickLocalized } from "@/lib/format"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { EmptyState } from "@/components/shared/empty-state"

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
    <Panel className="h-full">
      <PanelHeader
        title={t("portal.recentTitle")}
        href={viewAllHref}
        hrefLabel={t("actions.viewAll")}
      />

      {notices.length === 0 ? (
        <EmptyState inset icon={Megaphone} title={tPortal("empty.noNoticesTitle")} description={tPortal("empty.noNotices")} />
      ) : (
        <ul className="divide-y divide-border-light">
          {notices.map((notice) => (
            <li key={notice.id}>
              <Link
                href={`${viewAllHref}/${notice.id}`}
                className="block px-4 py-3.5 transition-colors hover:bg-subtle sm:px-5"
              >
                <span className="block truncate text-[13.5px] font-semibold text-foreground">
                  {pickLocalized(notice.title, notice.titleBn, locale)}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {pickLocalized(notice.category.name, notice.category.nameBn, locale)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
