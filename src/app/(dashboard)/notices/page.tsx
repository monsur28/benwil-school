import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { Megaphone } from "lucide-react"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { getAdminNoticeList } from "@/lib/notices/notice-visibility"
import { formatDateTime, pickLocalized } from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { NoticesSubNav } from "@/components/notices/notices-subnav"
import { NoticeFilters } from "@/components/notices/notice-filters"
import { NoticeDialog } from "@/components/notices/notice-dialog"
import { NoticeStatusBadge } from "@/components/notices/notice-status-badge"

const PAGE_SIZE = 20

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireRole(...getRolesForHref("/notices"))
  const [t, locale] = await Promise.all([getTranslations("notices"), getLocale()])
  const params = await searchParams

  const q = typeof params.q === "string" ? params.q.trim() : ""
  const status = typeof params.status === "string" ? params.status : ""
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : ""
  const page = Math.max(1, Number(params.page) || 1)

  const isValidStatus = status === "DRAFT" || status === "PUBLISHED" || status === "ARCHIVED"

  const [{ notices, total }, categories, classes] = await Promise.all([
    getAdminNoticeList({
      schoolId: user.schoolId,
      q: q || undefined,
      status: isValidStatus ? status : undefined,
      categoryId: categoryId || undefined,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.noticeCategory.findMany({ where: { schoolId: user.schoolId, isActive: true }, orderBy: { name: "asc" } }),
    prisma.class.findMany({ where: { schoolId: user.schoolId }, orderBy: { order: "asc" } }),
  ])
  const sections = await prisma.section.findMany({
    where: { class: { schoolId: user.schoolId } },
    orderBy: { name: "asc" },
  })

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function pageHref(targetPage: number) {
    const url = new URLSearchParams()
    if (q) url.set("q", q)
    if (status) url.set("status", status)
    if (categoryId) url.set("categoryId", categoryId)
    url.set("page", String(targetPage))
    return `/notices?${url.toString()}`
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={<NoticeDialog categories={categories} classes={classes} sections={sections} />}
      />

      <NoticesSubNav />
      <NoticeFilters categories={categories} />

      {notices.length === 0 ? (
        <EmptyState icon={Megaphone} title={t("list.empty")} />
      ) : (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.title")}</TableHead>
                <TableHead>{t("fields.category")}</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
                <TableHead>{t("fields.audience")}</TableHead>
                <TableHead>{t("fields.publishAt")}</TableHead>
                <TableHead>{t("fields.expiresAt")}</TableHead>
                <TableHead>{t("fields.createdBy")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notices.map((notice) => (
                <TableRow key={notice.id}>
                  <TableCell>
                    <Link href={`/notices/${notice.id}`} className="font-medium text-foreground hover:underline">
                      {pickLocalized(notice.title, notice.titleBn, locale)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {pickLocalized(notice.category.name, notice.category.nameBn, locale)}
                  </TableCell>
                  <TableCell>
                    <NoticeStatusBadge status={notice.status} label={t(`status.${notice.status}`)} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t(`audience.${notice.audienceType}`)}
                    {notice.class && ` • ${notice.class.name}`}
                    {notice.section && ` ${notice.section.name}`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(notice.publishAt, locale)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {notice.expiresAt ? formatDateTime(notice.expiresAt, locale) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{notice.createdBy.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t("pagination.pageInfo", { page, totalPages })}</span>
            <div className="flex gap-2">
              {page <= 1 ? (
                <Button variant="outline" size="sm" disabled>
                  {t("pagination.previous")}
                </Button>
              ) : (
                <Button nativeButton={false} variant="outline" size="sm" render={<Link href={pageHref(page - 1)} />}>
                  {t("pagination.previous")}
                </Button>
              )}
              {page >= totalPages ? (
                <Button variant="outline" size="sm" disabled>
                  {t("pagination.next")}
                </Button>
              ) : (
                <Button nativeButton={false} variant="outline" size="sm" render={<Link href={pageHref(page + 1)} />}>
                  {t("pagination.next")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
