import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Role, type Prisma, type StudentStatus } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getRolesForHref } from "@/lib/permissions/nav"
import { STATUS_OPTIONS } from "@/lib/students/options"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { StudentFilters } from "@/components/students/student-filters"
import { StudentAvatar } from "@/components/students/student-avatar"
import { StudentStatusBadge } from "@/components/students/student-status-badge"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { UserPlus, Users } from "lucide-react"

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
    prisma.section.findMany({
      where: { class: { schoolId: user.schoolId } },
      orderBy: { name: "asc" },
    }),
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
        title={t("title")}
        actions={
          canManage && (
            <Button nativeButton={false} render={<Link href="/students/new" />}>
              <UserPlus />
              {t("addStudent")}
            </Button>
          )
        }
      />

      <StudentFilters classes={classes} sections={sections} />

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? t("empty.noResultsTitle") : t("empty.title")}
          description={hasFilters ? t("empty.noResultsDescription") : t("empty.description")}
        />
      ) : (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.student")}</TableHead>
                <TableHead>{t("table.admissionNo")}</TableHead>
                <TableHead>{t("table.class")}</TableHead>
                <TableHead>{t("table.section")}</TableHead>
                <TableHead>{t("table.roll")}</TableHead>
                <TableHead>{t("table.guardian")}</TableHead>
                <TableHead>{t("table.phone")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead className="text-right">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const primaryGuardian = student.guardians[0]?.guardian
                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Link href={`/students/${student.id}`} className="flex items-center gap-2.5">
                        <StudentAvatar name={student.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{student.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{student.studentUid}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>{student.admissionNumber}</TableCell>
                    <TableCell>{student.class.name}</TableCell>
                    <TableCell>{student.section.name}</TableCell>
                    <TableCell>{student.roll}</TableCell>
                    <TableCell>{primaryGuardian?.name ?? "—"}</TableCell>
                    <TableCell>{primaryGuardian?.phone ?? "—"}</TableCell>
                    <TableCell>
                      <StudentStatusBadge status={student.status} label={t(`status.${student.status}`)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button nativeButton={false} variant="ghost" size="sm" render={<Link href={`/students/${student.id}`} />}>
                          {t("table.view")}
                        </Button>
                        {canManage && (
                          <Button
                            nativeButton={false}
                            variant="ghost"
                            size="sm"
                            render={<Link href={`/students/${student.id}/edit`} />}
                          >
                            {t("table.edit")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
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
