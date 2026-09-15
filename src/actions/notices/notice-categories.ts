"use server"
import { ActionResult } from "@/lib/types/action"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { isUniqueConstraintError, uniqueConstraintTouches } from "@/lib/db/prisma-errors"
import { NOTICE_ADMIN_ROLES } from "@/lib/notices/notice-access"
import { createNoticeCategorySchema, editNoticeCategorySchema } from "@/lib/validations/notices"

export async function createNoticeCategory(input: unknown): Promise<ActionResult> {
  const user = await requireRole(...NOTICE_ADMIN_ROLES)
  const t = await getTranslations("notices")

  const parsed = createNoticeCategorySchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  try {
    await prisma.noticeCategory.create({
      data: {
        schoolId: user.schoolId,
        name: parsed.data.name,
        nameBn: parsed.data.nameBn || null,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) return { success: false, error: t("errors.duplicateCategory") }
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidatePath("/notices/categories")
  return { success: true }
}

export async function updateNoticeCategory(input: unknown): Promise<ActionResult> {
  const user = await requireRole(...NOTICE_ADMIN_ROLES)
  const t = await getTranslations("notices")

  const parsed = editNoticeCategorySchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  const existing = await prisma.noticeCategory.findFirst({
    where: { id: parsed.data.id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  try {
    await prisma.noticeCategory.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        nameBn: parsed.data.nameBn || null,
        isActive: parsed.data.isActive,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error) && uniqueConstraintTouches(error, "name")) {
      return { success: false, error: t("errors.duplicateCategory") }
    }
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidatePath("/notices/categories")
  return { success: true }
}

export async function toggleNoticeCategoryActive(id: string, isActive: boolean): Promise<ActionResult> {
  const user = await requireRole(...NOTICE_ADMIN_ROLES)
  const t = await getTranslations("notices")

  const existing = await prisma.noticeCategory.findFirst({
    where: { id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  await prisma.noticeCategory.update({ where: { id }, data: { isActive } })
  revalidatePath("/notices/categories")
  return { success: true }
}
