"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { isUniqueConstraintError } from "@/lib/db/prisma-errors"
import { createExamTypeSchema, editExamTypeSchema } from "@/lib/validations/exams"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export type ExamActionResult = { error?: string }

export async function createExamType(input: unknown): Promise<ExamActionResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("exams")

  const parsed = createExamTypeSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  try {
    await prisma.examType.create({
      data: {
        schoolId: user.schoolId,
        name: parsed.data.name,
        nameBn: parsed.data.nameBn || null,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: t("errors.duplicateExamType") }
    }
    return { error: t("errors.saveFailed") }
  }

  revalidatePath("/exams/types")
  return {}
}

export async function updateExamType(input: unknown): Promise<ExamActionResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("exams")

  const parsed = editExamTypeSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  const existing = await prisma.examType.findFirst({
    where: { id: parsed.data.id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { error: t("errors.notFound") }

  try {
    await prisma.examType.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        nameBn: parsed.data.nameBn || null,
        isActive: parsed.data.isActive,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: t("errors.duplicateExamType") }
    }
    return { error: t("errors.saveFailed") }
  }

  revalidatePath("/exams/types")
  return {}
}

export async function toggleExamTypeActive(id: string, isActive: boolean): Promise<ExamActionResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("exams")

  const existing = await prisma.examType.findFirst({
    where: { id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { error: t("errors.notFound") }

  await prisma.examType.update({ where: { id }, data: { isActive } })
  revalidatePath("/exams/types")
  return {}
}
