import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { History, CalendarX, UserX } from "lucide-react"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getRolesForHref } from "@/lib/permissions/nav"
import { getTeacherClassSectionPairs } from "@/lib/academics/teacher-assignments"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { AttendanceControls } from "@/components/attendance/attendance-controls"
import { AttendanceSheet } from "@/components/attendance/attendance-sheet"
import { Button } from "@/components/ui/button"

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireRole(...getRolesForHref("/attendance"))
  const t = await getTranslations("attendance")
  const params = await searchParams

  const [allClasses, allSections, activeAcademicYear] = await Promise.all([
    prisma.class.findMany({
      where: { schoolId: user.schoolId, isActive: true },
      orderBy: { order: "asc" },
    }),
    prisma.section.findMany({
      where: { class: { schoolId: user.schoolId }, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.academicYear.findFirst({ where: { schoolId: user.schoolId, isActive: true } }),
  ])

  // A teacher can only take attendance for a class/section they have an
  // Academic Management assignment for (any subject in it is enough — see
  // actions/attendance/save-attendance.ts, which enforces this server-side
  // regardless of what this picker shows). Admin/Principal see everything.
  let classes = allClasses
  let sections = allSections
  if (user.role === Role.TEACHER) {
    // "Take attendance today" is a current-operations page - scope to the
    // active academic year, not every year this teacher has ever taught.
    const assignedPairs = await getTeacherClassSectionPairs(user.userId, activeAcademicYear?.id ?? null)
    const assignedClassIds = new Set(assignedPairs.map((pair) => pair.classId))
    const assignedSectionIds = new Set(assignedPairs.map((pair) => pair.sectionId))
    classes = allClasses.filter((klass) => assignedClassIds.has(klass.id))
    sections = allSections.filter((section) => assignedSectionIds.has(section.id))
  }

  const academicYearId = activeAcademicYear?.id ?? ""

  // Re-validate classId/sectionId from the URL against `classes`/`sections`
  // (already role-filtered above) rather than trusting them outright — a
  // teacher could otherwise view another class's attendance, including
  // already-saved statuses, just by editing the query string. Falling back
  // to their own first assignment is a no-op for admins, whose lists are
  // unrestricted anyway.
  let classId = typeof params.classId === "string" ? params.classId : (classes[0]?.id ?? "")
  if (!classes.some((klass) => klass.id === classId)) {
    classId = classes[0]?.id ?? ""
  }
  let sectionId =
    typeof params.sectionId === "string"
      ? params.sectionId
      : (sections.find((section) => section.classId === classId)?.id ?? "")
  if (!sections.some((section) => section.id === sectionId && section.classId === classId)) {
    sectionId = sections.find((section) => section.classId === classId)?.id ?? ""
  }
  const date = typeof params.date === "string" ? params.date : todayIso()

  const showSheet = Boolean(classId && sectionId && academicYearId)

  const students = showSheet
    ? await prisma.student.findMany({
        where: { schoolId: user.schoolId, classId, sectionId, academicYearId, status: "ACTIVE" },
        orderBy: { roll: "asc" },
        select: { id: true, name: true, roll: true },
      })
    : []

  const existingRecords = showSheet
    ? await prisma.attendance.findMany({
        where: { schoolId: user.schoolId, classId, sectionId, date: new Date(date) },
        select: { studentId: true, status: true, updatedAt: true },
      })
    : []

  const initialStatuses = Object.fromEntries(
    existingRecords.map((record) => [record.studentId, record.status])
  )
  const lastUpdated = existingRecords.length
    ? existingRecords
        .reduce((latest, record) => (record.updatedAt > latest ? record.updatedAt : latest), existingRecords[0].updatedAt)
        .toISOString()
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        eyebrow={t("eyebrow")}
        actions={
          <Button variant="outline" render={<Link href="/attendance/history" />} nativeButton={false}>
            <History className="size-4" />
            {t("viewHistory")}
          </Button>
        }
      />

      {classes.length === 0 || !academicYearId ? (
        <EmptyState
          icon={user.role === Role.TEACHER ? UserX : CalendarX}
          title={
            user.role === Role.TEACHER && allClasses.length > 0
              ? t("empty.noAssignments")
              : t("empty.noAcademicSetup")
          }
        />
      ) : (
        <>
          <AttendanceControls classes={classes} sections={sections} />
          {showSheet ? (
            <AttendanceSheet
              // Force a remount on every class/section/date change: this
              // component keeps its own status state internally, and without
              // a key React would reuse the same instance and leak the
              // previous selection's in-progress edits into the new one.
              key={`${classId}-${sectionId}-${date}`}
              classId={classId}
              sectionId={sectionId}
              academicYearId={academicYearId}
              date={date}
              students={students}
              initialStatuses={initialStatuses}
              lastUpdated={lastUpdated}
            />
          ) : (
            <EmptyState icon={CalendarX} title={t("empty.selectClassSection")} />
          )}
        </>
      )}
    </div>
  )
}
