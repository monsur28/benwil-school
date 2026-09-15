import { notFound } from "next/navigation"
import { getTranslations, getLocale } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { getAdminNotice } from "@/lib/notices/notice-visibility"
import { formatDateTime, pickLocalized } from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { NoticeStatusBadge } from "@/components/notices/notice-status-badge"
import { NoticeDialog } from "@/components/notices/notice-dialog"
import { NoticePublishButton } from "@/components/notices/notice-publish-button"
import { NoticeArchiveButton } from "@/components/notices/notice-archive-button"

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ noticeId: string }>
}) {
  const user = await requireRole(...getRolesForHref("/notices"))
  const [t, locale] = await Promise.all([getTranslations("notices"), getLocale()])
  const { noticeId } = await params

  const notice = await getAdminNotice({ schoolId: user.schoolId, noticeId })
  if (!notice) notFound()

  const [categories, classes, sections] = await Promise.all([
    prisma.noticeCategory.findMany({ where: { schoolId: user.schoolId, isActive: true }, orderBy: { name: "asc" } }),
    prisma.class.findMany({ where: { schoolId: user.schoolId }, orderBy: { order: "asc" } }),
    prisma.section.findMany({ where: { class: { schoolId: user.schoolId } }, orderBy: { name: "asc" } }),
  ])

  const isEditable = notice.status === "DRAFT" || notice.status === "PUBLISHED"

  return (
    <div className="space-y-6">
      <PageHeader
        title={pickLocalized(notice.title, notice.titleBn, locale)}
        actions={
          <div className="flex gap-2">
            {isEditable && (
              <NoticeDialog
                notice={{
                  id: notice.id,
                  title: notice.title,
                  titleBn: notice.titleBn,
                  content: notice.content,
                  contentBn: notice.contentBn,
                  categoryId: notice.category.id,
                  audienceType: notice.audienceType,
                  classId: notice.classId,
                  sectionId: notice.sectionId,
                  publishAt: notice.publishAt,
                  expiresAt: notice.expiresAt,
                }}
                categories={categories}
                classes={classes}
                sections={sections}
              />
            )}
            {notice.status === "DRAFT" && <NoticePublishButton id={notice.id} />}
            {isEditable && <NoticeArchiveButton id={notice.id} />}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <NoticeStatusBadge status={notice.status} label={t(`status.${notice.status}`)} />
        <span className="text-sm text-muted-foreground">
          {t(`audience.${notice.audienceType}`)}
          {notice.class && ` • ${notice.class.name}`}
          {notice.section && ` ${notice.section.name}`}
        </span>
      </div>

      <div className="rounded-lg border p-4 whitespace-pre-line text-sm">
        {pickLocalized(notice.content, notice.contentBn, locale)}
      </div>

      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">{t("fields.category")}</dt>
          <dd>{pickLocalized(notice.category.name, notice.category.nameBn, locale)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("fields.publishAt")}</dt>
          <dd>{formatDateTime(notice.publishAt, locale)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("fields.expiresAt")}</dt>
          <dd>{notice.expiresAt ? formatDateTime(notice.expiresAt, locale) : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("fields.createdBy")}</dt>
          <dd>{notice.createdBy.name}</dd>
        </div>
        {notice.updatedBy && (
          <div>
            <dt className="text-muted-foreground">{t("fields.updatedBy")}</dt>
            <dd>{notice.updatedBy.name}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
