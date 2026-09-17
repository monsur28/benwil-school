import Link from "next/link"
import { Role, type Prisma } from "@prisma/client"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { FilterBar } from "@/components/shared/filter-bar"
import { StatRow, StatTile } from "@/components/shared/stat-tile"
import { DataPanel, RecordTable, PaginationBar } from "@/components/shared/data-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Users } from "lucide-react"

const MANAGERS: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]
const PAGE_SIZE = 20

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; department?: string; page?: string }>
}) {
  const user = await requireRole(...MANAGERS, Role.HR)
  const t = await getTranslations("teachers")
  const params = await searchParams
  const q = params.q?.trim() ?? ""
  const status = params.status === "inactive" ? false : params.status === "active" ? true : undefined
  const department = params.department ?? ""
  const page = Math.max(1, Number(params.page) || 1)

  const where: Prisma.UserWhereInput = {
    schoolId: user.schoolId,
    role: Role.TEACHER,
    ...(status !== undefined && { isActive: status }),
    ...(department && { department }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { employeeId: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ],
    }),
  }

  const [teachers, total, departments, summaryTotal, summaryActive, summaryInactive, summaryUnassigned] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        teacherAssignments: {
          where: { schoolId: user.schoolId },
          include: { class: true, section: true, subject: true },
        },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.findMany({
      where: { schoolId: user.schoolId, role: Role.TEACHER, department: { not: null } },
      select: { department: true },
      distinct: ["department"],
    }),
    prisma.user.count({ where: { schoolId: user.schoolId, role: Role.TEACHER } }),
    prisma.user.count({ where: { schoolId: user.schoolId, role: Role.TEACHER, isActive: true } }),
    prisma.user.count({ where: { schoolId: user.schoolId, role: Role.TEACHER, isActive: false } }),
    prisma.user.count({
      where: { schoolId: user.schoolId, role: Role.TEACHER, isActive: true, teacherAssignments: { none: {} } },
    }),
  ])

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const canManage = MANAGERS.includes(user.role)

  function pageHref(target: number) {
    const url = new URLSearchParams()
    if (q) url.set("q", q)
    if (params.status) url.set("status", params.status)
    if (department) url.set("department", department)
    url.set("page", String(target))
    return `/teachers?${url.toString()}`
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        actions={
          canManage && (
            <Button nativeButton={false} render={<Link href="/teachers/new" />}>
              <Plus />
              {t("actions.addTeacher")}
            </Button>
          )
        }
      />

      {/* Staffing at a glance. `unassigned` is the one that needs action, so
          it carries the warning tone; the rest are neutral facts. */}
      <StatRow columns={4}>
        <StatTile label={t("summary.total")} value={summaryTotal} tone="brand" />
        <StatTile label={t("summary.active")} value={summaryActive} tone="success" />
        <StatTile label={t("summary.inactive")} value={summaryInactive} tone="neutral" />
        <StatTile
          label={t("summary.unassigned")}
          value={summaryUnassigned}
          tone={summaryUnassigned > 0 ? "warning" : "neutral"}
        />
      </StatRow>

      <FilterBar>
        <form className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Input name="q" defaultValue={q} placeholder={t("searchPlaceholder")} className="sm:flex-1" />
          <NativeSelect name="status" defaultValue={params.status ?? ""}>
            <NativeSelectOption value="">{t("filters.allStatuses")}</NativeSelectOption>
            <NativeSelectOption value="active">{t("status.active")}</NativeSelectOption>
            <NativeSelectOption value="inactive">{t("status.inactive")}</NativeSelectOption>
          </NativeSelect>
          <NativeSelect name="department" defaultValue={department}>
            <NativeSelectOption value="">{t("filters.allDepartments")}</NativeSelectOption>
            {departments.flatMap((item) =>
              item.department ? (
                <NativeSelectOption key={item.department} value={item.department}>
                  {item.department}
                </NativeSelectOption>
              ) : []
            )}
          </NativeSelect>
          <Button type="submit" variant="outline">
            {t("filters.filter")}
          </Button>
        </form>
      </FilterBar>

      {teachers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("list.empty")}
          description={t("list.emptyDescription")}
          action={
            canManage && (
              <Button nativeButton={false} render={<Link href="/teachers/new" />}>
                <Plus />
                {t("actions.addTeacher")}
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
              label={t("pagination.pageInfo", { page, totalPages: pages })}
              previousHref={page > 1 ? pageHref(page - 1) : undefined}
              nextHref={page < pages ? pageHref(page + 1) : undefined}
              previousLabel={t("pagination.previous")}
              nextLabel={t("pagination.next")}
            />
          }
        >
          {/* One table, two layouts: a directory on desktop, a stacked card
              per member of staff below `md` (see `.table-cards`). */}
          <RecordTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fields.teacher")}</TableHead>
                  <TableHead>{t("fields.employeeId")}</TableHead>
                  <TableHead>{t("fields.designation")}</TableHead>
                  <TableHead>{t("fields.assignments")}</TableHead>
                  <TableHead>{t("fields.status")}</TableHead>
                  <TableHead className="text-right">{t("fields.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell data-cell="primary" className="py-3">
                      <Link href={`/teachers/${teacher.id}`} className="block">
                        <span className="block text-[13.5px] font-semibold text-foreground">{teacher.name}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{teacher.email}</span>
                      </Link>
                    </TableCell>
                    <TableCell
                      data-label={t("fields.employeeId")}
                      className="tabular-nums text-muted-foreground"
                    >
                      {teacher.employeeId ?? "—"}
                    </TableCell>
                    <TableCell data-label={t("fields.designation")}>
                      <span className="block font-medium">{teacher.designation ?? t("fields.teacher")}</span>
                      <span className="block text-xs text-muted-foreground">{teacher.department ?? "—"}</span>
                    </TableCell>
                    <TableCell data-label={t("fields.assignments")} className="max-w-64">
                      <span className="block font-medium tabular-nums">
                        {t("list.assignmentsCount", { count: teacher.teacherAssignments.length })}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[...new Set(teacher.teacherAssignments.map((item) => item.subject.name))].join(", ") ||
                          t("list.unassigned")}
                      </span>
                    </TableCell>
                    <TableCell data-label={t("fields.status")}>
                      <Badge variant={teacher.isActive ? "success" : "muted"}>
                        {teacher.isActive ? t("status.active") : t("status.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell data-cell="actions" className="text-right">
                      <Button
                        nativeButton={false}
                        variant="outline"
                        size="sm"
                        render={<Link href={`/teachers/${teacher.id}`} />}
                      >
                        {t("actions.view")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </RecordTable>
        </DataPanel>
      )}
    </div>
  )
}
