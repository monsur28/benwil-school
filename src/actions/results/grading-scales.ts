"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { isUniqueConstraintError } from "@/lib/db/prisma-errors"
import { RESULT_ADMIN_ROLES } from "@/lib/results/result-access"
import { createGradingScaleSchema, editGradingScaleSchema } from "@/lib/validations/grading"

export type GradingActionResult = { error?: string }

export async function createGradingScale(input: unknown): Promise<GradingActionResult> {
  const user = await requireRole(...RESULT_ADMIN_ROLES)
  const t = await getTranslations("results")

  const parsed = createGradingScaleSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  try {
    await prisma.gradingScale.create({
      data: {
        schoolId: user.schoolId,
        name: parsed.data.name,
        nameBn: parsed.data.nameBn || null,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: t("errors.duplicateGradingScale") }
    return { error: t("errors.saveFailed") }
  }

  revalidatePath("/results/grading")
  return {}
}

export async function updateGradingScale(input: unknown): Promise<GradingActionResult> {
  const user = await requireRole(...RESULT_ADMIN_ROLES)
  const t = await getTranslations("results")

  const parsed = editGradingScaleSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  const existing = await prisma.gradingScale.findFirst({
    where: { id: parsed.data.id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { error: t("errors.notFound") }

  try {
    await prisma.gradingScale.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        nameBn: parsed.data.nameBn || null,
        isActive: parsed.data.isActive,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: t("errors.duplicateGradingScale") }
    return { error: t("errors.saveFailed") }
  }

  revalidatePath("/results/grading")
  return {}
}

export async function toggleGradingScaleActive(id: string, isActive: boolean): Promise<GradingActionResult> {
  const user = await requireRole(...RESULT_ADMIN_ROLES)
  const t = await getTranslations("results")

  const existing = await prisma.gradingScale.findFirst({
    where: { id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { error: t("errors.notFound") }

  await prisma.gradingScale.update({ where: { id }, data: { isActive } })
  revalidatePath("/results/grading")
  return {}
}
