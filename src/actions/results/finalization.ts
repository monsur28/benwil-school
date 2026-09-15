"use server"
import { ActionResult } from "@/lib/types/action"

import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { RESULT_ADMIN_ROLES } from "@/lib/results/result-access"
import type { GradeLookupRule } from "@/lib/results/calculate-result"

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
      select: { id: true, resultStatus: true },
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

  await prisma.exam.update({
    where: { id: examId },
    data: {
      resultStatus: "FINALIZED",
      resultStatusChangedAt: new Date(),
      resultStatusChangedById: user.userId,
      gradingScaleName: scale.name,
      gradingRulesSnapshot: rules,
    },
  })

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

  await prisma.exam.update({
    where: { id: examId },
    data: {
      resultStatus: "DRAFT",
      resultStatusChangedAt: new Date(),
      resultStatusChangedById: user.userId,
      gradingScaleName: null,
      gradingRulesSnapshot: Prisma.DbNull,
    },
  })

  revalidatePath("/results")
  return { success: true }
}
