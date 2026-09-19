import "server-only"
import { DayOfWeek } from "@prisma/client"
import { prisma } from "@/lib/db/client"

export const ORDERED_DAYS_OF_WEEK: DayOfWeek[] = [
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
]

export const JS_DAY_TO_DAY_OF_WEEK: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
}

export function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 < end2 && end1 > start2
}

export async function getRoutineForClassSection({
  schoolId,
  academicYearId,
  classId,
  sectionId,
}: {
  schoolId: string
  academicYearId: string
  classId: string
  sectionId: string
}) {
  return prisma.routineEntry.findMany({
    where: {
      schoolId,
      academicYearId,
      classId,
      sectionId,
    },
    include: {
      subject: { select: { id: true, name: true, nameBn: true, code: true } },
      teacher: { select: { id: true, name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
  })
}

export async function getStudentRoutine({
  schoolId,
  studentId,
}: {
  schoolId: string
  studentId: string
}) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    include: { class: true, section: true, academicYear: true },
  })
  if (!student) return null

  const entries = await getRoutineForClassSection({
    schoolId,
    academicYearId: student.academicYearId,
    classId: student.classId,
    sectionId: student.sectionId,
  })

  return { student, entries }
}

export async function getGuardianChildRoutine({
  guardianId,
  studentId,
  schoolId,
}: {
  guardianId: string
  studentId: string
  schoolId: string
}) {
  const link = await prisma.studentGuardian.findFirst({
    where: {
      guardianId,
      studentId,
      student: { schoolId },
    },
    include: {
      student: {
        include: { class: true, section: true, academicYear: true },
      },
    },
  })
  if (!link) return null

  const student = link.student
  const entries = await getRoutineForClassSection({
    schoolId,
    academicYearId: student.academicYearId,
    classId: student.classId,
    sectionId: student.sectionId,
  })

  return { student, relation: link.relation, entries }
}

export async function getTodaysStudentSchedule({
  schoolId,
  studentId,
  targetDate,
}: {
  schoolId: string
  studentId: string
  targetDate?: Date
}) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    include: { class: true, section: true, academicYear: true },
  })
  if (!student) return null

  const now = targetDate ?? new Date()
  const todayEnum = JS_DAY_TO_DAY_OF_WEEK[now.getDay()]

  const entries = await prisma.routineEntry.findMany({
    where: {
      schoolId,
      academicYearId: student.academicYearId,
      classId: student.classId,
      sectionId: student.sectionId,
      dayOfWeek: todayEnum,
    },
    include: {
      subject: { select: { id: true, name: true, nameBn: true, code: true } },
      teacher: { select: { id: true, name: true } },
    },
    orderBy: { periodNumber: "asc" },
  })

  return { student, dayOfWeek: todayEnum, entries }
}

export type ConflictErrorKey =
  | "errors.classConflict"
  | "errors.teacherConflict"
  | "errors.timeConflict"

export type ConflictCheckResult =
  | { hasConflict: false }
  | { hasConflict: true; errorKey: ConflictErrorKey }

export async function checkRoutineConflicts({
  schoolId,
  academicYearId,
  classId,
  sectionId,
  teacherId,
  dayOfWeek,
  periodNumber,
  startTime,
  endTime,
  excludeId,
}: {
  schoolId: string
  academicYearId: string
  classId: string
  sectionId: string
  teacherId: string
  dayOfWeek: DayOfWeek
  periodNumber: number
  startTime: string
  endTime: string
  excludeId?: string
}): Promise<ConflictCheckResult> {
  // 1. Same class + section + day + period
  const classPeriodConflict = await prisma.routineEntry.findFirst({
    where: {
      schoolId,
      academicYearId,
      classId,
      sectionId,
      dayOfWeek,
      periodNumber,
      ...(excludeId && { id: { not: excludeId } }),
    },
    include: { subject: true },
  })
  if (classPeriodConflict) {
    return { hasConflict: true, errorKey: "errors.classConflict" }
  }

  // 2. Same teacher + day + period in another class/section
  const teacherPeriodConflict = await prisma.routineEntry.findFirst({
    where: {
      schoolId,
      academicYearId,
      teacherId,
      dayOfWeek,
      periodNumber,
      ...(excludeId && { id: { not: excludeId } }),
    },
    include: { class: true, section: true },
  })
  if (teacherPeriodConflict) {
    return { hasConflict: true, errorKey: "errors.teacherConflict" }
  }

  // 3. Class/Section time range overlap on the same day
  const classDayEntries = await prisma.routineEntry.findMany({
    where: {
      schoolId,
      academicYearId,
      classId,
      sectionId,
      dayOfWeek,
      ...(excludeId && { id: { not: excludeId } }),
    },
    select: { id: true, startTime: true, endTime: true, periodNumber: true },
  })
  const classOverlap = classDayEntries.find((e) =>
    timesOverlap(startTime, endTime, e.startTime, e.endTime)
  )
  if (classOverlap) {
    return { hasConflict: true, errorKey: "errors.timeConflict" }
  }

  // 4. Teacher time range overlap on the same day
  const teacherDayEntries = await prisma.routineEntry.findMany({
    where: {
      schoolId,
      academicYearId,
      teacherId,
      dayOfWeek,
      ...(excludeId && { id: { not: excludeId } }),
    },
    select: { id: true, startTime: true, endTime: true, periodNumber: true },
  })
  const teacherOverlap = teacherDayEntries.find((e) =>
    timesOverlap(startTime, endTime, e.startTime, e.endTime)
  )
  if (teacherOverlap) {
    return { hasConflict: true, errorKey: "errors.teacherConflict" }
  }

  return { hasConflict: false }
}
