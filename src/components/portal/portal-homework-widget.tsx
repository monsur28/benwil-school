import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { NotebookPen } from "lucide-react"
import type { HomeworkListItem } from "@/lib/homework/get-homework"
import { formatDate, pickLocalized } from "@/lib/format"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { EmptyState } from "@/components/shared/empty-state"

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
    <Panel className="h-full">
      <PanelHeader
        title={t("portal.upcomingTitle")}
        href={viewAllHref}
        hrefLabel={t("actions.viewAll")}
      />

      {homework.length === 0 ? (
        <EmptyState
          inset
          icon={NotebookPen}
          title={tPortal("empty.noHomeworkTitle")}
          description={tPortal("empty.noHomework")}
        />
      ) : (
        <ul className="divide-y divide-border-light">
          {homework.map((item) => (
            <li key={item.id}>
              <Link
                href={`${viewAllHref}/${item.id}`}
                className="flex items-start justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-subtle sm:px-5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-semibold text-foreground">{item.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {pickLocalized(item.subject.name, item.subject.nameBn, locale)}
                  </span>
                </span>
                {/* The due date is why a student opens this list, so it is the
                    one thing held right and given its own micro-label. */}
                <span className="shrink-0 text-right">
                  <span className="eyebrow block">{t("portal.dueLabel")}</span>
                  <span className="mt-0.5 block text-xs font-semibold tabular-nums text-foreground">
                    {formatDate(item.dueDate, locale)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
