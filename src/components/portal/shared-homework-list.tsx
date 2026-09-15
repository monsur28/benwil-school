import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { NotebookPen } from "lucide-react"
import type { HomeworkListItem } from "@/lib/homework/get-homework"
import { formatDate, pickLocalized } from "@/lib/format"
import { EmptyState } from "@/components/shared/empty-state"
import { Card } from "@/components/ui/card"

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
    return <EmptyState icon={NotebookPen} title={tPortal("empty.noHomeworkTitle")} description={tPortal("empty.noHomework")} />
  }

  return (
    <div className="space-y-3">
      {homework.map((item) => (
        <Link key={item.id} href={`${basePath}/${item.id}`}>
          <Card className="gap-2 p-4 transition-colors hover:bg-muted/40">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {pickLocalized(item.subject.name, item.subject.nameBn, locale)}
              </span>
              <span className="text-xs text-muted-foreground">{t("portal.dueOn", { date: formatDate(item.dueDate, locale) })}</span>
            </div>
            <h3 className="font-medium text-foreground">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.teacher.name}</p>
          </Card>
        </Link>
      ))}
    </div>
  )
}
