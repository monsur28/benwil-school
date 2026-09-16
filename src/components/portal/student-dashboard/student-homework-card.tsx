import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { NotebookPen } from "lucide-react"
import type { HomeworkListItem } from "@/lib/homework/get-homework"
import { formatDate, pickLocalized } from "@/lib/format"
import { TintedPanel, TintedPanelHeader, TintedPanelBody } from "@/components/shared/tinted-panel"

/**
 * Upcoming homework.
 *
 * Orange is this system's "needs your attention" tint, so homework wears it
 * at the section's edges while the list itself sits on an inset white sheet —
 * a dense, scannable list is exactly the content that earns white. The due
 * date carries the orange ink, because that is the part a student is
 * actually looking for.
 */
export async function StudentHomeworkCard({
  homework,
  basePath,
}: {
  homework: HomeworkListItem[]
  basePath: string
}) {
  const [t, tPortal, locale] = await Promise.all([
    getTranslations("homework"),
    getTranslations("portal"),
    getLocale(),
  ])

  return (
    <TintedPanel tint="orange">
      <TintedPanelHeader
        tint="orange"
        title={t("portal.upcomingTitle")}
        icon={<NotebookPen />}
        href={basePath}
        hrefLabel={t("actions.viewAll")}
      />

      <TintedPanelBody>
        {homework.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <NotebookPen className="size-6 text-muted-foreground/50" strokeWidth={1.75} />
            <p className="mt-3 text-sm font-semibold text-foreground">
              {tPortal("empty.noHomeworkTitle")}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">{tPortal("empty.noHomework")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border-light">
            {homework.map((item) => (
              <li key={item.id}>
                <Link
                  href={`${basePath}/${item.id}`}
                  className="flex items-start justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface-orange/40"
                >
                  <span className="flex min-w-0 items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-surface-orange-foreground/60"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-semibold text-foreground">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {pickLocalized(item.subject.name, item.subject.nameBn, locale)}
                      </span>
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-surface-orange-foreground/70">
                      {t("portal.dueLabel")}
                    </span>
                    <span className="mt-0.5 block text-xs font-bold tabular-nums text-surface-orange-foreground">
                      {formatDate(item.dueDate, locale)}
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
