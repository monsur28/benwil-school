"use server"
import { ActionResult } from "@/lib/types/action"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { isUniqueConstraintError, uniqueConstraintTouches } from "@/lib/db/prisma-errors"
import { FEE_ADMIN_ROLES } from "@/lib/fees/fee-access"
import { createFeeCategorySchema, editFeeCategorySchema } from "@/lib/validations/fees"

export type FeeActionResult = ActionResult

export async function createFeeCategory(input: unknown): Promise<FeeActionResult> {
  const user = await requireRole(...FEE_ADMIN_ROLES)
  const t = await getTranslations("fees")

  const parsed = createFeeCategorySchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  try {
    await prisma.feeCategory.create({
      data: {
        schoolId: user.schoolId,
        name: parsed.data.name,
        nameBn: parsed.data.nameBn || null,
        description: parsed.data.description || null,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) return { success: false, error: t("errors.duplicateCategory") }
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidatePath("/fees/categories")
  return { success: true }
}

export async function updateFeeCategory(input: unknown): Promise<FeeActionResult> {
  const user = await requireRole(...FEE_ADMIN_ROLES)
  const t = await getTranslations("fees")

  const parsed = editFeeCategorySchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  const existing = await prisma.feeCategory.findFirst({
    where: { id: parsed.data.id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  try {
    await prisma.feeCategory.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        nameBn: parsed.data.nameBn || null,
        description: parsed.data.description || null,
        isActive: parsed.data.isActive,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error) && uniqueConstraintTouches(error, "name")) {
      return { success: false, error: t("errors.duplicateCategory") }
    }
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidatePath("/fees/categories")
  return { success: true }
}

export async function toggleFeeCategoryActive(id: string, isActive: boolean): Promise<FeeActionResult> {
  const user = await requireRole(...FEE_ADMIN_ROLES)
  const t = await getTranslations("fees")

  const existing = await prisma.feeCategory.findFirst({
    where: { id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  await prisma.feeCategory.update({ where: { id }, data: { isActive } })
  revalidatePath("/fees/categories")
  return { success: true }
}
