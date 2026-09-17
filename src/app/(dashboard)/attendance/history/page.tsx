import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { ArrowLeft, History as HistoryIcon } from "lucide-react"
import { Role, type AttendanceStatus, type Prisma } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getRolesForHref } from "@/lib/permissions/nav"
import { getTeacherClassSectionPairs } from "@/lib/academics/teacher-assignments"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { FilterBar } from "@/components/shared/filter-bar"
import { AttendanceHistoryFilters } from "@/components/attendance/attendance-history-filters"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

const DAYS_BACK = 30

type HistoryRow = {
  date: Date
  classId: string
  sectionId: string
  counts: Record<AttendanceStatus, number>
}

export default async function AttendanceHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireRole(...getRolesForHref("/attendance"))
  const t = await getTranslations("attendance")
  const locale = await getLocale()
  const params = await searchParams

  const [allClasses, allSections] = await Promise.all([
    prisma.class.findMany({ where: { schoolId: user.schoolId }, orderBy: { order: "asc" } }),
    prisma.section.findMany({
      where: { class: { schoolId: user.schoolId } },
      orderBy: { name: "asc" },
    }),
  ])

  // Same rule as the take-attendance picker: a teacher only sees history for
  // class/sections they're assigned to. Admin/Principal see the whole school.
  let classes = allClasses
  let sections = allSections
  if (user.role === Role.TEACHER) {
    // This page browses attendance across all time (default: last 30 days,
    // or any specific date), not just the current academic year - a
    // teacher must still see history for a class they taught in a past
    // year (existing historical-access behavior), so this deliberately
    // passes `null` for "every year this teacher has ever been assigned"
    // rather than scoping to the active year.
    const assignedPairs = await getTeacherClassSectionPairs(user.userId, null)
    const assignedClassIds = new Set(assignedPairs.map((pair) => pair.classId))
    const assignedSectionIds = new Set(assignedPairs.map((pair) => pair.sectionId))
    classes = allClasses.filter((klass) => assignedClassIds.has(klass.id))
    sections = allSections.filter((section) => assignedSectionIds.has(section.id))
  }

  // Re-validate the URL's classId/sectionId against those (already
  // role-filtered) lists rather than trusting them outright — otherwise a
  // teacher could see another class's history just by editing the query
  // string, the same gap the take-attendance page had.
  const rawClassId = typeof params.classId === "string" ? params.classId : ""
  const classId = rawClassId && classes.some((klass) => klass.id === rawClassId) ? rawClassId : ""
  const rawSectionId = typeof params.sectionId === "string" ? params.sectionId : ""
  const sectionId =
    rawSectionId && sections.some((section) => section.id === rawSectionId) ? rawSectionId : ""
  const date = typeof params.date === "string" ? params.date : ""

  const classNames = new Map(classes.map((klass) => [klass.id, klass.name]))
  const sectionNames = new Map(sections.map((section) => [section.id, section.name]))

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - DAYS_BACK)

  const where: Prisma.AttendanceWhereInput = {
    schoolId: user.schoolId,
    ...(user.role === Role.TEACHER && { sectionId: { in: sections.map((section) => section.id) } }),
    ...(classId && { classId }),
    ...(sectionId && { sectionId }),
    ...(date ? { date: new Date(date) } : { date: { gte: cutoff } }),
  }

  const grouped = await prisma.attendance.groupBy({
    by: ["date", "classId", "sectionId", "status"],
    where,
    _count: { _all: true },
  })

  const rowMap = new Map<string, HistoryRow>()
  for (const group of grouped) {
    const key = `${group.date.toISOString()}-${group.classId}-${group.sectionId}`
    let row = rowMap.get(key)
    if (!row) {
      row = {
        date: group.date,
        classId: group.classId,
        sectionId: group.sectionId,
        counts: { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 },
      }
      rowMap.set(key, row)
    }
    row.counts[group.status] += group._count._all
  }
  const rows = [...rowMap.values()].sort((a, b) => b.date.getTime() - a.date.getTime())

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" })

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("history.title")}
        actions={
          <Button variant="outline" render={<Link href="/attendance" />} nativeButton={false}>
            <ArrowLeft />
            {t("history.backToAttendance")}
          </Button>
        }
      />

      <FilterBar>
        <AttendanceHistoryFilters classes={classes} sections={sections} />
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState icon={HistoryIcon} title={t("history.empty")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.date")}</TableHead>
              <TableHead>{t("fields.class")}</TableHead>
              <TableHead>{t("fields.section")}</TableHead>
              <TableHead>{t("status.PRESENT")}</TableHead>
              <TableHead>{t("status.ABSENT")}</TableHead>
              <TableHead>{t("status.LATE")}</TableHead>
              <TableHead>{t("status.LEAVE")}</TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isoDate = row.date.toISOString().slice(0, 10)
              return (
                <TableRow key={`${isoDate}-${row.classId}-${row.sectionId}`}>
                  <TableCell>{dateFormatter.format(row.date)}</TableCell>
                  <TableCell>{classNames.get(row.classId) ?? "—"}</TableCell>
                  <TableCell>{sectionNames.get(row.sectionId) ?? "—"}</TableCell>
                  <TableCell>{row.counts.PRESENT}</TableCell>
                  <TableCell>{row.counts.ABSENT}</TableCell>
                  <TableCell>{row.counts.LATE}</TableCell>
                  <TableCell>{row.counts.LEAVE}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={
                        <Link
                          href={`/attendance?classId=${row.classId}&sectionId=${row.sectionId}&date=${isoDate}`}
                        />
                      }
                    >
                      {t("table.view")}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
