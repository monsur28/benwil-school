import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Role, type Prisma, type StudentStatus } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getRolesForHref } from "@/lib/permissions/nav"
import { STATUS_OPTIONS } from "@/lib/students/options"
import { EmptyState } from "@/components/shared/empty-state"
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
    <div className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-border/75 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-red">People</p>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t("title")}</h1>
        </div>
        {canManage && (
          <Button nativeButton={false} className="h-10 rounded-lg shadow-[0_8px_18px_rgba(201,35,43,0.2)]" render={<Link href="/students/new" />}>
            <UserPlus className="size-4" />
            {t("addStudent")}
          </Button>
        )}
      </header>

      <div className="rounded-2xl border border-border/75 bg-card p-3 shadow-[0_8px_22px_rgba(25,49,90,0.04)]">
        <StudentFilters classes={classes} sections={sections} />
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? t("empty.noResultsTitle") : t("empty.title")}
          description={hasFilters ? t("empty.noResultsDescription") : t("empty.description")}
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border/75 bg-card shadow-[0_10px_28px_rgba(25,49,90,0.055)]">
          <div className="flex items-center justify-between border-b border-border/75 bg-muted/30 px-4 py-3 sm:px-5">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-bold text-foreground">{t("title")}</h2>
              <span className="font-mono text-xs font-semibold text-muted-foreground tabular-nums">{total}</span>
            </div>
          </div>
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 px-4 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground sm:px-5">{t("table.student")}</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">{t("table.admissionNo")}</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">{t("table.class")}</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">{t("table.section")}</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">{t("table.roll")}</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">{t("table.guardian")}</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">{t("table.phone")}</TableHead>
                <TableHead className="h-9 text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">{t("table.status")}</TableHead>
                <TableHead className="h-9 pr-4 text-right text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground sm:pr-5">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const primaryGuardian = student.guardians[0]?.guardian
                return (
                  <TableRow key={student.id} className="group/row h-[68px] hover:bg-brand-navy/[0.025]">
                    <TableCell className="px-4 sm:px-5">
                      <Link href={`/students/${student.id}`} className="flex items-center gap-3">
                        <StudentAvatar name={student.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{student.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{student.studentUid}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium tabular-nums">{student.admissionNumber}</TableCell>
                    <TableCell>{student.class.name}</TableCell>
                    <TableCell>{student.section.name}</TableCell>
                    <TableCell className="font-mono text-sm font-semibold tabular-nums">{student.roll}</TableCell>
                    <TableCell>{primaryGuardian?.name ?? "-"}</TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">{primaryGuardian?.phone ?? "-"}</TableCell>
                    <TableCell>
                      <StudentStatusBadge status={student.status} label={t(`status.${student.status}`)} />
                    </TableCell>
                    <TableCell className="pr-4 text-right sm:pr-5">
                      <div className="flex justify-end gap-1 opacity-75 transition-opacity group-hover/row:opacity-100">
                        <Button
                          nativeButton={false}
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("table.view")}
                          title={t("table.view")}
                          className="text-muted-foreground hover:bg-brand-navy-light hover:text-brand-navy"
                          render={<Link href={`/students/${student.id}`} />}
                        >
                          <Eye className="size-3.5" strokeWidth={2} />
                        </Button>
                        {canManage && (
                          <Button
                            nativeButton={false}
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("table.edit")}
                            title={t("table.edit")}
                            className="text-muted-foreground hover:bg-amber-50 hover:text-amber-700"
                            render={<Link href={`/students/${student.id}/edit`} />}
                          >
                            <Pencil className="size-3.5" strokeWidth={2} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-border/75 bg-muted/20 px-4 py-3 text-sm text-muted-foreground sm:px-5">
            <span>{t("pagination.pageInfo", { page, totalPages })}</span>
            <div className="flex gap-2">
              {page <= 1 ? (
                <Button variant="outline" size="sm" disabled>{t("pagination.previous")}</Button>
              ) : (
                <Button nativeButton={false} variant="outline" size="sm" render={<Link href={pageHref(page - 1)} />}>{t("pagination.previous")}</Button>
              )}
              {page >= totalPages ? (
                <Button variant="outline" size="sm" disabled>{t("pagination.next")}</Button>
              ) : (
                <Button nativeButton={false} variant="outline" size="sm" render={<Link href={pageHref(page + 1)} />}>{t("pagination.next")}</Button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
