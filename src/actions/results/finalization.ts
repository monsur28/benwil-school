"use server"
import { ActionResult } from "@/lib/types/action"

import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { RESULT_ADMIN_ROLES } from "@/lib/results/result-access"
import { scaleHomeworkContribution, type GradeLookupRule } from "@/lib/results/calculate-result"
import { getHomeworkAssessmentSummaries } from "@/lib/homework/homework-assessment-summary"

export type GradingActionResult = ActionResult

// Finalizing/reopening applies to the whole exam (every schedule, every
// class/section) - matching the spec's suggested Exam.resultStatus field
// exactly, and keeping this a single simple lock rather than a per-class
// approval workflow. Both directions are ADMIN_ROLES-only; a teacher
// cannot reach either action (requireRole redirects before any DB call).
//
// Phase 8: When finalizing, the currently active GradingScale and its rules
// are permanently snapshotted directly onto the Exam record. Subsequent
// changes to the active grading scale will never mutate published results.
export async function finalizeExamResults(examId: string): Promise<GradingActionResult> {
  const user = await requireRole(...RESULT_ADMIN_ROLES)
  const t = await getTranslations("results")

  const [exam, scale] = await Promise.all([
    prisma.exam.findFirst({
      where: { id: examId, schoolId: user.schoolId },
      select: { id: true, resultStatus: true, academicYearId: true },
    }),
    prisma.gradingScale.findFirst({
      where: { schoolId: user.schoolId, isActive: true },
      include: { gradeRules: true },
    }),
  ])

  if (!exam) return { success: false, error: t("errors.notFound") }
  if (exam.resultStatus === "FINALIZED") return { success: false, error: t("errors.alreadyFinalized") }
  if (!scale || scale.gradeRules.length === 0) {
    return { success: false, error: t("errors.noActiveGradingScale") }
  }

  const rules: GradeLookupRule[] = scale.gradeRules
    .map((rule) => ({
      id: rule.id,
      minPercentage: rule.minPercentage.toNumber(),
      maxPercentage: rule.maxPercentage.toNumber(),
      minPercentageScaled: rule.minPercentage.times(100).toNumber(),
      maxPercentageScaled: rule.maxPercentage.times(100).toNumber(),
      grade: rule.grade,
      gradeBn: rule.gradeBn,
      gradePoint: rule.gradePoint.toNumber(),
    }))
    .sort((a, b) => a.minPercentageScaled - b.minPercentageScaled)

  // Phase 12: freeze each student's homework contribution for every
  // schedule that has a homework component, so a later homework mark edit
  // never silently changes this now-finalized result (see
  // src/lib/results/get-results.ts buildMarksByStudentId, which reads this
  // frozen value instead of recomputing live once the exam is FINALIZED).
  const homeworkSchedules = await prisma.examSchedule.findMany({
    where: { examId, schoolId: user.schoolId, homeworkMaxMarks: { not: null, gt: 0 } },
    select: { id: true, classId: true, subjectId: true, homeworkMaxMarks: true },
  })

  const homeworkMarkUpdates: { id: string; homeworkMarks: number | null }[] = []
  for (const schedule of homeworkSchedules) {
    const marks = await prisma.examMark.findMany({
      where: { examScheduleId: schedule.id },
      select: { id: true, studentId: true },
    })
    if (marks.length === 0) continue

    const summaries = await getHomeworkAssessmentSummaries({
      schoolId: user.schoolId,
      studentIds: marks.map((mark) => mark.studentId),
      classId: schedule.classId,
      subjectId: schedule.subjectId,
      academicYearId: exam.academicYearId,
    })

    for (const mark of marks) {
      const summary = summaries.get(mark.studentId)
      homeworkMarkUpdates.push({
        id: mark.id,
        homeworkMarks: summary
          ? scaleHomeworkContribution(summary.totalMarks, summary.totalMaxMarks, schedule.homeworkMaxMarks!)
          : null,
      })
    }
  }

  await prisma.$transaction([
    prisma.exam.update({
      where: { id: examId },
      data: {
        resultStatus: "FINALIZED",
        resultStatusChangedAt: new Date(),
        resultStatusChangedById: user.userId,
        gradingScaleName: scale.name,
        gradingRulesSnapshot: rules,
      },
    }),
    ...homeworkMarkUpdates.map((update) =>
      prisma.examMark.update({ where: { id: update.id }, data: { homeworkMarks: update.homeworkMarks } })
    ),
  ])

  revalidatePath("/results")
  return { success: true }
}

export async function reopenExamResults(examId: string): Promise<GradingActionResult> {
  const user = await requireRole(...RESULT_ADMIN_ROLES)
  const t = await getTranslations("results")

  const exam = await prisma.exam.findFirst({
    where: { id: examId, schoolId: user.schoolId },
    select: { id: true, resultStatus: true },
  })
  if (!exam) return { success: false, error: t("errors.notFound") }
  if (exam.resultStatus === "DRAFT") return { success: false, error: t("errors.alreadyDraft") }

  await prisma.$transaction([
    prisma.exam.update({
      where: { id: examId },
      data: {
        resultStatus: "DRAFT",
        resultStatusChangedAt: new Date(),
        resultStatusChangedById: user.userId,
        gradingScaleName: null,
        gradingRulesSnapshot: Prisma.DbNull,
      },
    }),
    // Clear the frozen homework snapshot too, so it goes back to being
    // computed live from HomeworkSubmission while the exam is DRAFT again.
    prisma.examMark.updateMany({
      where: { examSchedule: { examId }, homeworkMarks: { not: null } },
      data: { homeworkMarks: null },
    }),
  ])

  revalidatePath("/results")
  return { success: true }
}
