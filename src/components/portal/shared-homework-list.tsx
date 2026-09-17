import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { NotebookPen, ChevronRight } from "lucide-react"
import type { HomeworkListItem } from "@/lib/homework/get-homework"
import { formatDate, pickLocalized } from "@/lib/format"
import { EmptyState } from "@/components/shared/empty-state"
import { Panel } from "@/components/shared/panel"

export async function SharedHomeworkList({
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

  if (homework.length === 0) {
    return (
      <EmptyState
        icon={NotebookPen}
        title={tPortal("empty.noHomeworkTitle")}
        description={tPortal("empty.noHomework")}
      />
    )
  }

  return (
    <Panel>
      <ul className="divide-y divide-border-light">
        {homework.map((item) => (
          <li key={item.id}>
            <Link
              href={`${basePath}/${item.id}`}
              className="group flex items-start gap-4 px-4 py-4 transition-colors hover:bg-subtle sm:px-5"
            >
              <span className="min-w-0 flex-1">
                <span className="eyebrow block">
                  {pickLocalized(item.subject.name, item.subject.nameBn, locale)}
                </span>
                <span className="mt-1.5 block text-[15px] font-semibold leading-snug text-foreground">
                  {item.title}
                </span>
                <span className="mt-1 block text-[13px] text-muted-foreground">{item.teacher.name}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="eyebrow block">{t("portal.dueLabel")}</span>
                <span className="mt-1 block text-[13px] font-semibold tabular-nums text-foreground">
                  {formatDate(item.dueDate, locale)}
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
