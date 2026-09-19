import "server-only"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { isTeacherAssignedToSubjectInSection } from "@/lib/academics/teacher-assignments"
import type { SessionData } from "@/lib/auth/session"

const ADMIN_ROLES: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export type ScheduleAccessSchedule = {
  id: string
  examId: string
  classId: string
  subjectId: string
  fullMarks: number
  passMarks: number
  homeworkMaxMarks: number | null
  academicYearId: string
  resultStatus: "DRAFT" | "FINALIZED"
}

export type ScheduleAccessResult =
  | { ok: true; schedule: ScheduleAccessSchedule; section: { id: string; name: string } }
  | { ok: false; reason: "not_found" | "invalid_section" | "unauthorized" }

// The single authorization gate for reading or writing exam marks. Admins and
// the Principal are unrestricted; a TEACHER must have a TeacherAssignment
// matching the exact class + section + subject, re-checked here against the
// database on every call (never trust classId/sectionId/subjectId that
// merely arrived via a URL, form, or query parameter).
export async function checkScheduleAccess(
  user: SessionData,
  examScheduleId: string,
  sectionId: string
): Promise<ScheduleAccessResult> {
  const schedule = await prisma.examSchedule.findFirst({
    where: { id: examScheduleId, schoolId: user.schoolId },
    select: {
      id: true,
      examId: true,
      classId: true,
      subjectId: true,
      fullMarks: true,
      passMarks: true,
      homeworkMaxMarks: true,
      exam: { select: { academicYearId: true, resultStatus: true } },
    },
  })
  if (!schedule) {
    return { ok: false, reason: "not_found" }
  }

  const section = await prisma.section.findFirst({
    where: { id: sectionId, classId: schedule.classId },
    select: { id: true, name: true },
  })
  if (!section) {
    return { ok: false, reason: "invalid_section" }
  }

  if (!ADMIN_ROLES.includes(user.role)) {
    if (user.role !== Role.TEACHER) {
      return { ok: false, reason: "unauthorized" }
    }
    const allowed = await isTeacherAssignedToSubjectInSection(
      user.userId,
      user.schoolId,
      schedule.exam.academicYearId,
      schedule.classId,
      sectionId,
      schedule.subjectId
    )
    if (!allowed) {
      return { ok: false, reason: "unauthorized" }
    }
  }

  return {
    ok: true,
    schedule: {
      id: schedule.id,
      examId: schedule.examId,
      classId: schedule.classId,
      subjectId: schedule.subjectId,
      fullMarks: schedule.fullMarks,
      passMarks: schedule.passMarks,
      homeworkMaxMarks: schedule.homeworkMaxMarks,
      academicYearId: schedule.exam.academicYearId,
      resultStatus: schedule.exam.resultStatus,
    },
    section,
  }
}
