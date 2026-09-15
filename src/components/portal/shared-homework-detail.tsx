import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { ArrowLeft } from "lucide-react"
import type { HomeworkListItem } from "@/lib/homework/get-homework"
import { formatDate, pickLocalized } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export async function SharedHomeworkDetail({
  homework,
  basePath,
}: {
  homework: HomeworkListItem
  basePath: string
}) {
  const [t, locale] = await Promise.all([getTranslations("homework"), getLocale()])

  return (
    <div className="space-y-4">
      <Button nativeButton={false} variant="ghost" size="sm" className="gap-1.5" render={<Link href={basePath} />}>
        <ArrowLeft className="size-4" />
        {t("actions.back")}
      </Button>

      <Card>
        <CardHeader className="space-y-2">
          <span className="w-fit rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {pickLocalized(homework.subject.name, homework.subject.nameBn, locale)}
          </span>
          <CardTitle className="text-lg">{homework.title}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {t("portal.assignedOn", { date: formatDate(homework.assignedDate, locale) })} ·{" "}
            {t("portal.dueOn", { date: formatDate(homework.dueDate, locale) })}
          </p>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-sm text-foreground">{homework.instructions}</p>

          <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">{t("fields.teacher")}</dt>
              <dd>{homework.teacher.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("fields.category")}</dt>
              <dd>{homework.category?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("fields.class")}</dt>
              <dd>
                {homework.class.name} {homework.section.name}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
