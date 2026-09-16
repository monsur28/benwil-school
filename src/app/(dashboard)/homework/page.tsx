import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { Role } from "@prisma/client"
import { NotebookPen, Plus } from "lucide-react"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { getHomeworkList } from "@/lib/homework/get-homework"
import { formatDate, pickLocalized } from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { FilterBar } from "@/components/shared/filter-bar"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { HomeworkFilters } from "@/components/homework/homework-filters"
import { HomeworkStatusBadge } from "@/components/homework/homework-status-badge"
import { HomeworkSubNav } from "@/components/homework/homework-subnav"

const PAGE_SIZE = 20

export default async function HomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireRole(...getRolesForHref("/homework"))
  const [t, locale] = await Promise.all([getTranslations("homework"), getLocale()])
  const params = await searchParams

  const q = typeof params.q === "string" ? params.q.trim() : ""
  const status = typeof params.status === "string" ? params.status : ""
  const classId = typeof params.classId === "string" ? params.classId : ""
  const sectionId = typeof params.sectionId === "string" ? params.sectionId : ""
  const subjectId = typeof params.subjectId === "string" ? params.subjectId : ""
  const page = Math.max(1, Number(params.page) || 1)

  const isValidStatus = status === "DRAFT" || status === "PUBLISHED"
  // Teachers only ever see their own homework - the list is scoped at the
  // query, not merely filtered in the UI (see spec's "never trust the
  // client" posture, already enforced server-side by every mutation too).
  const teacherId = user.role === Role.TEACHER ? user.userId : undefined

  const [{ homework, total }, classes, subjects] = await Promise.all([
    getHomeworkList({
      schoolId: user.schoolId,
      q: q || undefined,
      status: isValidStatus ? status : undefined,
      classId: classId || undefined,
      sectionId: sectionId || undefined,
      subjectId: subjectId || undefined,
      teacherId,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.class.findMany({ where: { schoolId: user.schoolId }, orderBy: { order: "asc" } }),
    prisma.subject.findMany({ where: { schoolId: user.schoolId }, orderBy: { name: "asc" } }),
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
    if (classId) url.set("classId", classId)
    if (sectionId) url.set("sectionId", sectionId)
    if (subjectId) url.set("subjectId", subjectId)
    url.set("page", String(targetPage))
    return `/homework?${url.toString()}`
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <Button nativeButton={false} size="sm" render={<Link href="/homework/new" />}>
            <Plus />
            {t("actions.createHomework")}
          </Button>
        }
      />

      <HomeworkSubNav showCategories={user.role !== Role.TEACHER} />
      <FilterBar>
        <HomeworkFilters classes={classes} sections={sections} subjects={subjects} />
      </FilterBar>

      {homework.length === 0 ? (
        <EmptyState icon={NotebookPen} title={t("list.empty")} />
      ) : (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.title")}</TableHead>
                <TableHead>{t("fields.subject")}</TableHead>
                <TableHead>{t("fields.class")}</TableHead>
                <TableHead>{t("fields.section")}</TableHead>
                <TableHead>{t("fields.assignedDate")}</TableHead>
                <TableHead>{t("fields.dueDate")}</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {homework.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link href={`/homework/${item.id}`} className="font-medium text-foreground hover:underline">
                      {item.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {pickLocalized(item.subject.name, item.subject.nameBn, locale)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.class.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.section.name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(item.assignedDate, locale)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(item.dueDate, locale)}</TableCell>
                  <TableCell>
                    <HomeworkStatusBadge status={item.status} label={t(`status.${item.status}`)} />
                  </TableCell>
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
