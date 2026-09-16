import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { NotebookPen } from "lucide-react"
import type { HomeworkListItem } from "@/lib/homework/get-homework"
import { formatDate, pickLocalized } from "@/lib/format"
import { Card } from "@/components/ui/card"

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
    <Card className="p-6 h-full flex flex-col bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">{t("portal.upcomingTitle")}</h3>
        <Link href={viewAllHref} className="shrink-0 whitespace-nowrap text-sm text-info hover:underline">
          {t("actions.viewAll")}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
        {homework.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tPortal("empty.noHomework")}</p>
        ) : (
          homework.map((item) => (
            <Link
              key={item.id}
              href={`${viewAllHref}/${item.id}`}
              className="flex items-start gap-4 p-3 rounded-lg border border-border hover:bg-muted transition-colors group"
            >
              <div className="bg-warning/15 text-warning rounded-full p-2 mt-1 group-hover:bg-warning group-hover:text-white transition-colors">
                <NotebookPen className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {pickLocalized(item.subject.name, item.subject.nameBn, locale)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("portal.dueOn", { date: formatDate(item.dueDate, locale) })}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </Card>
  )
}
