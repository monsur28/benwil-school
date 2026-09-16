import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { Megaphone } from "lucide-react"
import type { VisibleNoticeListItem } from "@/lib/notices/notice-visibility"
import { formatDate, pickLocalized } from "@/lib/format"
import { TintedPanel, TintedPanelHeader, TintedPanelBody } from "@/components/shared/tinted-panel"

/**
 * The school's recent announcements.
 *
 * Blue — the information tint — at the edges, with the feed itself on an
 * inset white sheet. Each notice keeps a small blue indicator so the list
 * belongs to its section visually without the whole feed being tinted, which
 * would cost readability for no gain.
 */
export async function StudentNoticesCard({
  notices,
  basePath,
}: {
  notices: VisibleNoticeListItem[]
  basePath: string
}) {
  const [t, tPortal, locale] = await Promise.all([
    getTranslations("notices"),
    getTranslations("portal"),
    getLocale(),
  ])

  return (
    <TintedPanel tint="blue">
      <TintedPanelHeader
        tint="blue"
        title={t("portal.recentTitle")}
        icon={<Megaphone />}
        href={basePath}
        hrefLabel={t("actions.viewAll")}
      />

      <TintedPanelBody>
        {notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <Megaphone className="size-6 text-muted-foreground/50" strokeWidth={1.75} />
            <p className="mt-3 text-sm font-semibold text-foreground">
              {tPortal("empty.noNoticesTitle")}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">{tPortal("empty.noNotices")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border-light">
            {notices.map((notice) => (
              <li key={notice.id}>
                <Link
                  href={`${basePath}/${notice.id}`}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-blue/40"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-surface-blue-foreground/60"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-foreground">
                      {pickLocalized(notice.title, notice.titleBn, locale)}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span className="truncate font-medium text-surface-blue-foreground/80">
                        {pickLocalized(notice.category.name, notice.category.nameBn, locale)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{formatDate(notice.publishAt, locale)}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </TintedPanelBody>
    </TintedPanel>
  )
}
