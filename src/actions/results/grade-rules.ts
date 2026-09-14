"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { rangesOverlap } from "@/lib/results/calculate-result"
import { RESULT_ADMIN_ROLES } from "@/lib/results/result-access"
import { gradeRuleSchema, editGradeRuleSchema } from "@/lib/validations/grading"

export type GradingActionResult = { error?: string }

async function assertNoOverlap(
  gradingScaleId: string,
  minPercentage: number,
  maxPercentage: number,
  excludeRuleId: string | undefined,
  t: (key: string) => string
): Promise<string | null> {
  const siblings = await prisma.gradeRule.findMany({
    where: { gradingScaleId, ...(excludeRuleId ? { id: { not: excludeRuleId } } : {}) },
    select: { minPercentage: true, maxPercentage: true },
  })
  const overlaps = siblings.some((sibling) =>
    rangesOverlap(
      { minPercentage, maxPercentage },
      { minPercentage: sibling.minPercentage.toNumber(), maxPercentage: sibling.maxPercentage.toNumber() }
    )
  )
  return overlaps ? t("errors.overlappingRange") : null
}

export async function createGradeRule(input: unknown): Promise<GradingActionResult> {
  const user = await requireRole(...RESULT_ADMIN_ROLES)
  const t = await getTranslations("results")

  const parsed = gradeRuleSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  const scale = await prisma.gradingScale.findFirst({
    where: { id: parsed.data.gradingScaleId, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!scale) return { error: t("errors.notFound") }

  const overlapError = await assertNoOverlap(
    parsed.data.gradingScaleId,
    parsed.data.minPercentage,
    parsed.data.maxPercentage,
    undefined,
    t
  )
  if (overlapError) return { error: overlapError }

  await prisma.gradeRule.create({
    data: {
      gradingScaleId: parsed.data.gradingScaleId,
      minPercentage: parsed.data.minPercentage,
      maxPercentage: parsed.data.maxPercentage,
      grade: parsed.data.grade,
      gradeBn: parsed.data.gradeBn || null,
      gradePoint: parsed.data.gradePoint,
    },
  })

  revalidatePath("/results/grading")
  return {}
}

export async function updateGradeRule(input: unknown): Promise<GradingActionResult> {
  const user = await requireRole(...RESULT_ADMIN_ROLES)
  const t = await getTranslations("results")

  const parsed = editGradeRuleSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  const existing = await prisma.gradeRule.findFirst({
    where: { id: parsed.data.id, gradingScale: { schoolId: user.schoolId } },
    select: { id: true, gradingScaleId: true },
  })
  if (!existing || existing.gradingScaleId !== parsed.data.gradingScaleId) {
    return { error: t("errors.notFound") }
  }

  const overlapError = await assertNoOverlap(
    parsed.data.gradingScaleId,
    parsed.data.minPercentage,
    parsed.data.maxPercentage,
    parsed.data.id,
    t
  )
  if (overlapError) return { error: overlapError }

  await prisma.gradeRule.update({
    where: { id: parsed.data.id },
    data: {
      minPercentage: parsed.data.minPercentage,
      maxPercentage: parsed.data.maxPercentage,
      grade: parsed.data.grade,
      gradeBn: parsed.data.gradeBn || null,
      gradePoint: parsed.data.gradePoint,
    },
  })

  revalidatePath("/results/grading")
  return {}
}

// GradeRule has no dependents (results are calculated on the fly from
// ExamMark, never stored against a specific rule), so there is no FK-based
// "unsafe to delete" state to guard against the way Phase 5's exam
// schedules had to guard against already-entered marks - existence +
// school ownership (via the parent GradingScale) is the whole check.
export async function deleteGradeRule(id: string): Promise<GradingActionResult> {
  const user = await requireRole(...RESULT_ADMIN_ROLES)
  const t = await getTranslations("results")

  const existing = await prisma.gradeRule.findFirst({
    where: { id, gradingScale: { schoolId: user.schoolId } },
    select: { id: true },
  })
  if (!existing) return { error: t("errors.notFound") }

  await prisma.gradeRule.delete({ where: { id } })
  revalidatePath("/results/grading")
  return {}
}
