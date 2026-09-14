import { requireStudentIdentity } from "@/lib/portal/identity"
import { prisma } from "@/lib/db/client"
import { getStudentAttendanceSummary } from "@/lib/attendance/get-attendance"
import { AttendanceSummaryCard } from "@/components/portal/attendance-summary-card"
import { AttendanceRecentList } from "@/components/portal/attendance-recent-list"
import { AttendanceFilters } from "@/components/portal/attendance-filters"

export default async function StudentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { student } = await requireStudentIdentity()
  const params = await searchParams

  const getParam = (key: string) => {
    const value = params[key]
    return typeof value === "string" && value ? value : undefined
  }

  const academicYearId = getParam("academicYearId")
  const from = getParam("from")
  const to = getParam("to")

  const [academicYears, summary] = await Promise.all([
    prisma.academicYear.findMany({ where: { schoolId: student.schoolId }, orderBy: { name: "desc" } }),
    getStudentAttendanceSummary({
      studentId: student.id,
      academicYearId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      recentLimit: 30,
    }),
  ])

  return (
    <div className="space-y-4">
      <AttendanceFilters academicYears={academicYears} />
      <AttendanceSummaryCard percentage={summary.percentage} counts={summary.counts} />
      <AttendanceRecentList records={summary.recent} />
    </div>
  )
}
