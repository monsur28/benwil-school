"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { requireRole } from "@/lib/auth/dal"
import { isTeacherAssignedToSection } from "@/lib/academics/teacher-assignments"
import { saveAttendanceSchema, type SaveAttendanceInput } from "@/lib/validations/attendance"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL, Role.TEACHER]

export type SaveAttendanceResult =
  | { error: string }
  | { counts: Record<"PRESENT" | "ABSENT" | "LATE" | "LEAVE", number> }

export async function saveAttendance(input: SaveAttendanceInput): Promise<SaveAttendanceResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("attendance")

  const parsed = saveAttendanceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: t("errors.invalidForm") }
  }
  const data = parsed.data

  const section = await prisma.section.findFirst({
    where: { id: data.sectionId, classId: data.classId, class: { schoolId: user.schoolId } },
  })
  const academicYear = await prisma.academicYear.findFirst({
    where: { id: data.academicYearId, schoolId: user.schoolId },
  })
  if (!section || !academicYear) {
    return { error: t("errors.invalidSelection") }
  }

  // Academic Management (Phase 4) now provides teacher-class-section
  // assignments: a TEACHER may only take attendance for a section they're
  // actually assigned to (any subject in that section is enough — this is
  // a per-section permission, not per-subject). Admin/Principal roles are
  // exempt and can manage attendance for any class/section in the school.
  if (user.role === Role.TEACHER) {
    const isAssigned = await isTeacherAssignedToSection(user.userId, data.classId, data.sectionId)
    if (!isAssigned) {
      return { error: t("errors.notAssigned") }
    }
  }

  const validStudents = await prisma.student.findMany({
    where: {
      schoolId: user.schoolId,
      classId: data.classId,
      sectionId: data.sectionId,
      academicYearId: data.academicYearId,
      status: "ACTIVE",
    },
    select: { id: true },
  })
  const validStudentIds = new Set(validStudents.map((student) => student.id))
  const hasInvalidStudent = data.entries.some((entry) => !validStudentIds.has(entry.studentId))
  if (hasInvalidStudent) {
    return { error: t("errors.invalidStudents") }
  }

  const date = new Date(data.date)
  const counts: Record<"PRESENT" | "ABSENT" | "LATE" | "LEAVE", number> = {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    LEAVE: 0,
  }

  try {
    await prisma.$transaction(
      data.entries.map((entry) => {
        counts[entry.status] += 1
        return prisma.attendance.upsert({
          where: {
            schoolId_studentId_date: {
              schoolId: user.schoolId,
              studentId: entry.studentId,
              date,
            },
          },
          update: { status: entry.status, markedById: user.userId },
          create: {
            schoolId: user.schoolId,
            studentId: entry.studentId,
            classId: data.classId,
            sectionId: data.sectionId,
            academicYearId: data.academicYearId,
            date,
            status: entry.status,
            markedById: user.userId,
          },
        })
      })
    )
  } catch {
    return { error: t("errors.saveFailed") }
  }

  revalidatePath("/attendance")
  return { counts }
}
