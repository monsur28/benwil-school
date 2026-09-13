"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { requireRole } from "@/lib/auth/dal"
import { isUniqueConstraintError, uniqueConstraintTouches } from "@/lib/db/prisma-errors"
import {
  createAcademicYearSchema,
  editAcademicYearSchema,
  type CreateAcademicYearInput,
  type EditAcademicYearInput,
} from "@/lib/validations/academics"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export type AcademicResult = { error?: string }

export async function createAcademicYear(input: CreateAcademicYearInput): Promise<AcademicResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("academics")

  const parsed = createAcademicYearSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  const existingCount = await prisma.academicYear.count({ where: { schoolId: user.schoolId } })

  try {
    await prisma.academicYear.create({
      data: { schoolId: user.schoolId, name: parsed.data.name, isActive: existingCount === 0 },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: t("errors.duplicateAcademicYear") }
    }
    return { error: t("errors.saveFailed") }
  }

  revalidatePath("/academics/years")
  return {}
}

export async function updateAcademicYear(input: EditAcademicYearInput): Promise<AcademicResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("academics")

  const parsed = editAcademicYearSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  const existing = await prisma.academicYear.findFirst({
    where: { id: parsed.data.id, schoolId: user.schoolId },
  })
  if (!existing) return { error: t("errors.notFound") }

  try {
    await prisma.academicYear.update({
      where: { id: parsed.data.id },
      data: { name: parsed.data.name },
    })
  } catch (error) {
    if (isUniqueConstraintError(error) && uniqueConstraintTouches(error, "name")) {
      return { error: t("errors.duplicateAcademicYear") }
    }
    return { error: t("errors.saveFailed") }
  }

  revalidatePath("/academics/years")
  return {}
}

export async function setActiveAcademicYear(id: string): Promise<AcademicResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("academics")

  const target = await prisma.academicYear.findFirst({
    where: { id, schoolId: user.schoolId },
  })
  if (!target) return { error: t("errors.notFound") }

  await prisma.$transaction([
    prisma.academicYear.updateMany({
      where: { schoolId: user.schoolId, id: { not: id } },
      data: { isActive: false },
    }),
    prisma.academicYear.update({ where: { id }, data: { isActive: true } }),
  ])

  revalidatePath("/academics/years")
  return {}
}
