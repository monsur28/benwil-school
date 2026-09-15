"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { isUniqueConstraintError } from "@/lib/db/prisma-errors"
import { FEE_STAFF_ROLES } from "@/lib/fees/fee-access"
import { createFeeStructureSchema, editFeeStructureSchema } from "@/lib/validations/fees"

export type FeeActionResult = { error?: string }

async function verifyStructureRefs(schoolId: string, academicYearId: string, classId: string, feeCategoryId: string) {
  const [academicYear, classRecord, category] = await Promise.all([
    prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId }, select: { id: true } }),
    prisma.class.findFirst({ where: { id: classId, schoolId }, select: { id: true } }),
    prisma.feeCategory.findFirst({ where: { id: feeCategoryId, schoolId }, select: { id: true } }),
  ])
  return Boolean(academicYear && classRecord && category)
}

export async function createFeeStructure(input: unknown): Promise<FeeActionResult> {
  const user = await requireRole(...FEE_STAFF_ROLES)
  const t = await getTranslations("fees")

  const parsed = createFeeStructureSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }
  const data = parsed.data

  const refsValid = await verifyStructureRefs(user.schoolId, data.academicYearId, data.classId, data.feeCategoryId)
  if (!refsValid) return { error: t("errors.invalidSelection") }

  try {
    await prisma.feeStructure.create({
      data: {
        schoolId: user.schoolId,
        academicYearId: data.academicYearId,
        classId: data.classId,
        feeCategoryId: data.feeCategoryId,
        name: data.name,
        nameBn: data.nameBn || null,
        amount: data.amount,
        frequency: data.frequency,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: t("errors.duplicateStructure") }
    return { error: t("errors.saveFailed") }
  }

  revalidatePath("/fees/structures")
  return {}
}

export async function updateFeeStructure(input: unknown): Promise<FeeActionResult> {
  const user = await requireRole(...FEE_STAFF_ROLES)
  const t = await getTranslations("fees")

  const parsed = editFeeStructureSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }
  const data = parsed.data

  const existing = await prisma.feeStructure.findFirst({
    where: { id: data.id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { error: t("errors.notFound") }

  const refsValid = await verifyStructureRefs(user.schoolId, data.academicYearId, data.classId, data.feeCategoryId)
  if (!refsValid) return { error: t("errors.invalidSelection") }

  // Editing amount/frequency here never touches any StudentFee already
  // assigned from this structure - those rows keep their own copied
  // amount permanently (see the schema comment on StudentFee.amount).
  try {
    await prisma.feeStructure.update({
      where: { id: data.id },
      data: {
        academicYearId: data.academicYearId,
        classId: data.classId,
        feeCategoryId: data.feeCategoryId,
        name: data.name,
        nameBn: data.nameBn || null,
        amount: data.amount,
        frequency: data.frequency,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        isActive: data.isActive,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: t("errors.duplicateStructure") }
    return { error: t("errors.saveFailed") }
  }

  revalidatePath("/fees/structures")
  return {}
}

export async function toggleFeeStructureActive(id: string, isActive: boolean): Promise<FeeActionResult> {
  const user = await requireRole(...FEE_STAFF_ROLES)
  const t = await getTranslations("fees")

  const existing = await prisma.feeStructure.findFirst({
    where: { id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { error: t("errors.notFound") }

  await prisma.feeStructure.update({ where: { id }, data: { isActive } })
  revalidatePath("/fees/structures")
  return {}
}
