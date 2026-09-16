import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Role, type Prisma, type StudentStatus } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getRolesForHref } from "@/lib/permissions/nav"
import { STATUS_OPTIONS } from "@/lib/students/options"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { FilterBar } from "@/components/shared/filter-bar"
import { DataPanel, RecordTable, PaginationBar } from "@/components/shared/data-panel"
import { StudentFilters } from "@/components/students/student-filters"
import { StudentAvatar } from "@/components/students/student-avatar"
import { StudentStatusBadge } from "@/components/students/student-status-badge"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Eye, Pencil, UserPlus, Users } from "lucide-react"

const PAGE_SIZE = 20
const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireRole(...getRolesForHref("/students"))
  const t = await getTranslations("students")
  const params = await searchParams

  const q = typeof params.q === "string" ? params.q.trim() : ""
  const classId = typeof params.classId === "string" ? params.classId : ""
  const sectionId = typeof params.sectionId === "string" ? params.sectionId : ""
  const status = typeof params.status === "string" ? (params.status as StudentStatus) : ""
  const page = Math.max(1, Number(params.page) || 1)

  const where: Prisma.StudentWhereInput = {
    schoolId: user.schoolId,
    ...(classId && { classId }),
    ...(sectionId && { sectionId }),
    ...(status && STATUS_OPTIONS.includes(status) && { status }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { nameBn: { contains: q, mode: "insensitive" } },
        { admissionNumber: { contains: q, mode: "insensitive" } },
        { studentUid: { contains: q, mode: "insensitive" } },
        { guardians: { some: { guardian: { phone: { contains: q } } } } },
      ],
    }),
  }

  const [students, total, classes, sections] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        class: true,
        section: true,
        guardians: { where: { isPrimary: true }, take: 1, include: { guardian: true } },
      },
    }),
    prisma.student.count({ where }),
    prisma.class.findMany({ where: { schoolId: user.schoolId }, orderBy: { order: "asc" } }),
    prisma.section.findMany({ where: { class: { schoolId: user.schoolId } }, orderBy: { name: "asc" } }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasFilters = Boolean(q || classId || sectionId || status)
  const canManage = CAN_MANAGE.includes(user.role)

  function pageHref(targetPage: number) {
    const url = new URLSearchParams()
    if (q) url.set("q", q)
    if (classId) url.set("classId", classId)
    if (sectionId) url.set("sectionId", sectionId)
    if (status) url.set("status", status)
    url.set("page", String(targetPage))
    return `/students?${url.toString()}`
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        actions={
          canManage && (
            <Button nativeButton={false} render={<Link href="/students/new" />}>
              <UserPlus className="size-4" />
              {t("addStudent")}
            </Button>
          )
        }
      />

      <FilterBar>
        <StudentFilters classes={classes} sections={sections} />
      </FilterBar>

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? t("empty.noResultsTitle") : t("empty.title")}
          description={hasFilters ? t("empty.noResultsDescription") : t("empty.description")}
          action={
            !hasFilters &&
            canManage && (
              <Button nativeButton={false} render={<Link href="/students/new" />}>
                <UserPlus className="size-4" />
                {t("addStudent")}
              </Button>
            )
          }
        />
      ) : (
        <DataPanel
          title={t("title")}
          count={total}
          footer={
            <PaginationBar
              label={t("pagination.pageInfo", { page, totalPages })}
              previousHref={page > 1 ? pageHref(page - 1) : undefined}
              nextHref={page < totalPages ? pageHref(page + 1) : undefined}
              previousLabel={t("pagination.previous")}
              nextLabel={t("pagination.next")}
            />
          }
        >
          {/* One table, two layouts: a register on desktop, a stacked card
              per student below `md` (see `.table-cards`). */}
          <RecordTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.student")}</TableHead>
                  <TableHead>{t("table.admissionNo")}</TableHead>
                  <TableHead>{t("table.class")}</TableHead>
                  <TableHead>{t("table.roll")}</TableHead>
                  <TableHead>{t("table.guardian")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead className="text-right">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const primaryGuardian = student.guardians[0]?.guardian
                  return (
                    <TableRow key={student.id} className="group/row">
                      <TableCell data-cell="primary" className="py-3">
                        <Link href={`/students/${student.id}`} className="flex items-center gap-3">
                          <StudentAvatar name={student.name} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate text-[13.5px] font-semibold text-foreground">
                              {student.name}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {student.studentUid}
                            </span>
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell
                        data-label={t("table.admissionNo")}
                        className="text-[13px] tabular-nums text-muted-foreground"
                      >
                        {student.admissionNumber}
                      </TableCell>
                      <TableCell data-label={t("table.class")} className="font-medium">
                        {student.class.name}
                        <span className="text-muted-foreground"> · {student.section.name}</span>
                      </TableCell>
                      <TableCell data-label={t("table.roll")} className="font-semibold tabular-nums">
                        {student.roll}
                      </TableCell>
                      <TableCell data-label={t("table.guardian")}>
                        <span className="block max-w-44 truncate">{primaryGuardian?.name ?? "—"}</span>
                        <span className="block text-xs tabular-nums text-muted-foreground">
                          {primaryGuardian?.phone ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell data-label={t("table.status")}>
                        <StudentStatusBadge status={student.status} label={t(`status.${student.status}`)} />
                      </TableCell>
                      <TableCell data-cell="actions" className="text-right">
                        {/* Row actions stay visible on touch devices and simply
                            gain emphasis on hover for pointer users. */}
                        <div className="flex gap-1 opacity-70 transition-opacity group-hover/row:opacity-100 md:justify-end">
                          <Button
                            nativeButton={false}
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("table.view")}
                            title={t("table.view")}
                            render={<Link href={`/students/${student.id}`} />}
                          >
                            <Eye className="size-4" />
                          </Button>
                          {canManage && (
                            <Button
                              nativeButton={false}
                              variant="ghost"
                              size="icon-sm"
                              aria-label={t("table.edit")}
                              title={t("table.edit")}
                              render={<Link href={`/students/${student.id}/edit`} />}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </RecordTable>
        </DataPanel>
      )}
    </div>
  )
}
