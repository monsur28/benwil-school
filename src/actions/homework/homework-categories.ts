"use server"
import { ActionResult } from "@/lib/types/action"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { isUniqueConstraintError, uniqueConstraintTouches } from "@/lib/db/prisma-errors"
import { HOMEWORK_ADMIN_ROLES } from "@/lib/homework/homework-access"
import { createHomeworkCategorySchema, editHomeworkCategorySchema } from "@/lib/validations/homework"

export async function createHomeworkCategory(input: unknown): Promise<ActionResult> {
  const user = await requireRole(...HOMEWORK_ADMIN_ROLES)
  const t = await getTranslations("homework")

  const parsed = createHomeworkCategorySchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  try {
    await prisma.homeworkCategory.create({
      data: {
        schoolId: user.schoolId,
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) return { success: false, error: t("errors.duplicateCategory") }
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidatePath("/homework/categories")
  return { success: true }
}

export async function updateHomeworkCategory(input: unknown): Promise<ActionResult> {
  const user = await requireRole(...HOMEWORK_ADMIN_ROLES)
  const t = await getTranslations("homework")

  const parsed = editHomeworkCategorySchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  const existing = await prisma.homeworkCategory.findFirst({
    where: { id: parsed.data.id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  try {
    await prisma.homeworkCategory.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
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

  revalidatePath("/homework/categories")
  return { success: true }
}

export async function toggleHomeworkCategoryActive(id: string, isActive: boolean): Promise<ActionResult> {
  const user = await requireRole(...HOMEWORK_ADMIN_ROLES)
  const t = await getTranslations("homework")

  const existing = await prisma.homeworkCategory.findFirst({
    where: { id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  await prisma.homeworkCategory.update({ where: { id }, data: { isActive } })
  revalidatePath("/homework/categories")
  return { success: true }
}
