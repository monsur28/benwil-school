import "server-only"
import type { AttendanceStatus } from "@prisma/client"
import { prisma } from "@/lib/db/client"

export type AttendanceCounts = Record<AttendanceStatus, number>

export type AttendanceSummary = {
  percentage: number | null
  counts: AttendanceCounts
  total: number
  recent: { date: Date; status: AttendanceStatus }[]
}

// The one place attendance percentage/counts are computed - reused by the
// admin student-profile tab and the student/guardian portal, so a change to
// what counts as "present" only ever has to happen here.
export async function getStudentAttendanceSummary(params: {
  studentId: string
  academicYearId?: string
  from?: Date
  to?: Date
  recentLimit?: number
}): Promise<AttendanceSummary> {
  const { studentId, academicYearId, from, to, recentLimit = 10 } = params

  const where = {
    studentId,
    ...(academicYearId ? { academicYearId } : {}),
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  }

  const [grouped, recent] = await Promise.all([
    prisma.attendance.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
      take: recentLimit,
      select: { date: true, status: true },
    }),
  ])

  const counts: AttendanceCounts = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 }
  for (const group of grouped) counts[group.status] = group._count._all
  const total = counts.PRESENT + counts.ABSENT + counts.LATE + counts.LEAVE
  const percentage = total > 0 ? Math.round((counts.PRESENT / total) * 100) : null

  return { percentage, counts, total, recent }
}
