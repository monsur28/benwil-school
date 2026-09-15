import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations, getLocale } from "next-intl/server"
import { Role } from "@prisma/client"
import { Pencil } from "lucide-react"
import { requireRole } from "@/lib/auth/dal"
import { getHomeworkById } from "@/lib/homework/get-homework"
import { HOMEWORK_ROLES, checkHomeworkOwnership, checkHomeworkWriteAccess } from "@/lib/homework/homework-access"
import { formatDate, pickLocalized } from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { HomeworkStatusBadge } from "@/components/homework/homework-status-badge"
import { HomeworkPublishButton } from "@/components/homework/homework-publish-button"

export default async function HomeworkDetailPage({
  params,
}: {
  params: Promise<{ homeworkId: string }>
}) {
  const user = await requireRole(...HOMEWORK_ROLES)
  const [t, locale] = await Promise.all([getTranslations("homework"), getLocale()])
  const { homeworkId } = await params

  const homework = await getHomeworkById({ schoolId: user.schoolId, homeworkId })
  if (!homework) notFound()

  const ownership = checkHomeworkOwnership(user, homework.teacherId)
  // A teacher may only ever view their OWN homework's detail page - the
  // list already scopes them this way, and this closes the same URL-guess
  // gap requireGuardianChild closes for the portal (viewing, not just
  // editing/publishing, must be blocked, not merely have its buttons hidden).
  if (user.role === Role.TEACHER && !ownership.ok) notFound()

  const writeAccess = ownership.ok
    ? await checkHomeworkWriteAccess(user, homework.classId, homework.sectionId, homework.subjectId)
    : { ok: false as const }
  const canManage = ownership.ok && writeAccess.ok

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title={homework.title}
        actions={
          canManage && (
            <div className="flex gap-2">
              <Button
                nativeButton={false}
                variant="outline"
                size="sm"
                className="gap-1.5"
                render={<Link href={`/homework/${homework.id}/edit`} />}
              >
                <Pencil className="size-4" />
                {t("actions.edit")}
              </Button>
              {homework.status === "DRAFT" && <HomeworkPublishButton id={homework.id} />}
            </div>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <HomeworkStatusBadge status={homework.status} label={t(`status.${homework.status}`)} />
        <span className="text-sm text-muted-foreground">
          {homework.class.name} {homework.section.name} • {pickLocalized(homework.subject.name, homework.subject.nameBn, locale)}
        </span>
      </div>

      <div className="rounded-lg border p-4 whitespace-pre-line text-sm">{homework.instructions}</div>

      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">{t("fields.category")}</dt>
          <dd>{homework.category?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("fields.teacher")}</dt>
          <dd>{homework.teacher.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("fields.assignedDate")}</dt>
          <dd>{formatDate(homework.assignedDate, locale)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("fields.dueDate")}</dt>
          <dd>{formatDate(homework.dueDate, locale)}</dd>
        </div>
      </dl>
    </div>
  )
}
