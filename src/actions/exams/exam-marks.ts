"use server"
import { ActionResult } from '@/lib/types/action'

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { requireAuth } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { checkScheduleAccess, type ScheduleAccessResult } from "@/lib/exams/schedule-access"
import { saveExamMarksSchema } from "@/lib/validations/exams"

export type SaveExamMarksResult = ActionResult<{ saved: number }>

function accessErrorMessage(
  access: Extract<ScheduleAccessResult, { ok: false }>,
  t: (key: string) => string
) {
  return access.reason === "unauthorized" ? t("errors.unauthorized") : t("errors.notFound")
}

// This is the only place ExamMark rows are written. Authorization is a
// single re-check against the database via checkScheduleAccess — never
// trust examScheduleId/sectionId merely because they came from the client;
// admins/principal pass because their role is unrestricted there, a teacher
// passes only with a matching TeacherAssignment for this exact
// class+section+subject.
export async function saveExamMarks(input: unknown): Promise<SaveExamMarksResult> {
  const user = await requireAuth()
  const t = await getTranslations("exams")

  const parsed = saveExamMarksSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  const access = await checkScheduleAccess(user, parsed.data.examScheduleId, parsed.data.sectionId)
  if (!access.ok) return { success: false, error: accessErrorMessage(access, t) }
  const { schedule, section } = access

  // Phase 6: once an exam's results are finalized, marks become read-only
  // for everyone (including admins) until an explicit Reopen Results action
  // - checked here on the write path, not just hidden in the UI, since a
  // direct request must not be able to bypass the lock.
  if (schedule.resultStatus === "FINALIZED") {
    return { success: false, error: t("errors.resultsFinalized") }
  }

  const studentIds = parsed.data.entries.map((entry) => entry.studentId)
  const validStudents = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      schoolId: user.schoolId,
      classId: schedule.classId,
      sectionId: section.id,
      academicYearId: schedule.academicYearId,
    },
    select: { id: true },
  })
  if (validStudents.length !== new Set(studentIds).size) {
    return { success: false, error: t("errors.invalidStudent") }
  }

  // A schedule with a homework component reserves part of fullMarks for it -
  // the written mark entered here is capped at what's left over, not the
  // full total (the homework portion is never typed in directly; see
  // getStudentHomeworkAssessmentSummary / buildMarksByStudentId).
  const writtenMaxMarks = schedule.fullMarks - (schedule.homeworkMaxMarks ?? 0)
  for (const entry of parsed.data.entries) {
    if (!entry.isAbsent && (entry.marks === null || entry.marks < 0 || entry.marks > writtenMaxMarks)) {
      return { success: false, error: t("errors.marksOutOfRange") }
    }
  }

  await prisma.$transaction(
    parsed.data.entries.map((entry) =>
      prisma.examMark.upsert({
        where: {
          examScheduleId_studentId: {
            examScheduleId: schedule.id,
            studentId: entry.studentId,
          },
        },
        create: {
          schoolId: user.schoolId,
          examScheduleId: schedule.id,
          studentId: entry.studentId,
          marks: entry.isAbsent ? null : entry.marks,
          isAbsent: entry.isAbsent,
          enteredById: user.userId,
        },
        update: {
          marks: entry.isAbsent ? null : entry.marks,
          isAbsent: entry.isAbsent,
          enteredById: user.userId,
        },
      })
    )
  )

  revalidatePath(`/exams/${schedule.examId}/marks`)
  revalidatePath(`/exams/${schedule.examId}`)
  return { success: true, data: { saved: parsed.data.entries.length } }
}

export async function markAllAbsent(examScheduleId: string, sectionId: string): Promise<SaveExamMarksResult> {
  const user = await requireAuth()
  const t = await getTranslations("exams")

  const access = await checkScheduleAccess(user, examScheduleId, sectionId)
  if (!access.ok) return { success: false, error: accessErrorMessage(access, t) }
  const { schedule, section } = access

  if (schedule.resultStatus === "FINALIZED") {
    return { success: false, error: t("errors.resultsFinalized") }
  }

  const students = await prisma.student.findMany({
    where: {
      schoolId: user.schoolId,
      classId: schedule.classId,
      sectionId: section.id,
      academicYearId: schedule.academicYearId,
      status: "ACTIVE",
    },
    select: { id: true },
  })

  await prisma.$transaction(
    students.map((student) =>
      prisma.examMark.upsert({
        where: {
          examScheduleId_studentId: { examScheduleId: schedule.id, studentId: student.id },
        },
        create: {
          schoolId: user.schoolId,
          examScheduleId: schedule.id,
          studentId: student.id,
          marks: null,
          isAbsent: true,
          enteredById: user.userId,
        },
        update: { marks: null, isAbsent: true, enteredById: user.userId },
      })
    )
  )

  revalidatePath(`/exams/${schedule.examId}/marks`)
  return { success: true, data: { saved: students.length } }
}
