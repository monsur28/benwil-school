import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { Megaphone, ChevronRight } from "lucide-react"
import type { VisibleNoticeListItem } from "@/lib/notices/notice-visibility"
import { formatDate, pickLocalized } from "@/lib/format"
import { EmptyState } from "@/components/shared/empty-state"
import { Panel } from "@/components/shared/panel"

/**
 * The portal notice board.
 *
 * A single divided panel rather than a stack of separate cards: consecutive
 * notices are one list, and hairlines carry that relationship far better than
 * a gap between bordered boxes.
 */
export async function SharedNoticesList({
  notices,
  basePath,
}: {
  notices: VisibleNoticeListItem[]
  basePath: string
}) {
  const [tPortal, locale] = await Promise.all([getTranslations("portal"), getLocale()])

  if (notices.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title={tPortal("empty.noNoticesTitle")}
        description={tPortal("empty.noNotices")}
      />
    )
  }

  return (
    <Panel>
      <ul className="divide-y divide-border-light">
        {notices.map((notice) => (
          <li key={notice.id}>
            <Link
              href={`${basePath}/${notice.id}`}
              className="group flex items-start gap-4 px-4 py-4 transition-colors hover:bg-subtle sm:px-5"
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="eyebrow">
                    {pickLocalized(notice.category.name, notice.category.nameBn, locale)}
                  </span>
                  <span aria-hidden="true" className="text-border-strong">
                    ·
                  </span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {formatDate(notice.publishAt, locale)}
                  </span>
                </span>
                <span className="mt-1.5 block text-[15px] font-semibold leading-snug text-foreground">
                  {pickLocalized(notice.title, notice.titleBn, locale)}
                </span>
                <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-muted-foreground">
                  {pickLocalized(notice.content, notice.contentBn, locale)}
                </span>
              </span>
              <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
