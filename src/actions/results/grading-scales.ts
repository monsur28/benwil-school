"use server"
import { ActionResult } from "@/lib/types/action"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { isUniqueConstraintError } from "@/lib/db/prisma-errors"
import { RESULT_ADMIN_ROLES } from "@/lib/results/result-access"
import { createGradingScaleSchema, editGradingScaleSchema } from "@/lib/validations/grading"

export type GradingActionResult = ActionResult

export async function createGradingScale(input: unknown): Promise<GradingActionResult> {
  const user = await requireRole(...RESULT_ADMIN_ROLES)
  const t = await getTranslations("results")

  const parsed = createGradingScaleSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  try {
    // At most one grading scale is active per school - getActiveGradeRules
    // just picks one active scale, so leaving two active would make grade
    // calculation depend on arbitrary query order. New scales default to
    // active (schema default), so deactivate every other scale in the same
    // transaction as the create.
    await prisma.$transaction(async (tx) => {
      const scale = await tx.gradingScale.create({
        data: {
          schoolId: user.schoolId,
          name: parsed.data.name,
          nameBn: parsed.data.nameBn || null,
        },
      })
      if (scale.isActive) {
        await tx.gradingScale.updateMany({
          where: { schoolId: user.schoolId, id: { not: scale.id } },
          data: { isActive: false },
        })
      }
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) return { success: false, error: t("errors.duplicateGradingScale") }
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidatePath("/results/grading")
  return { success: true }
}

export async function updateGradingScale(input: unknown): Promise<GradingActionResult> {
  const user = await requireRole(...RESULT_ADMIN_ROLES)
  const t = await getTranslations("results")

  const parsed = editGradingScaleSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  const existing = await prisma.gradingScale.findFirst({
    where: { id: parsed.data.id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.gradingScale.update({
        where: { id: parsed.data.id },
        data: {
          name: parsed.data.name,
          nameBn: parsed.data.nameBn || null,
          isActive: parsed.data.isActive,
        },
      })
      if (parsed.data.isActive) {
        await tx.gradingScale.updateMany({
          where: { schoolId: user.schoolId, id: { not: parsed.data.id } },
          data: { isActive: false },
        })
      }
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) return { success: false, error: t("errors.duplicateGradingScale") }
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidatePath("/results/grading")
  return { success: true }
}

export async function toggleGradingScaleActive(id: string, isActive: boolean): Promise<GradingActionResult> {
  const user = await requireRole(...RESULT_ADMIN_ROLES)
  const t = await getTranslations("results")

  const existing = await prisma.gradingScale.findFirst({
    where: { id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  await prisma.$transaction(async (tx) => {
    await tx.gradingScale.update({ where: { id }, data: { isActive } })
    if (isActive) {
      await tx.gradingScale.updateMany({
        where: { schoolId: user.schoolId, id: { not: id } },
        data: { isActive: false },
      })
    }
  })
  revalidatePath("/results/grading")
  return { success: true }
}
