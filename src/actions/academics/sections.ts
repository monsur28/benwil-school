"use server"
import { ActionResult } from "@/lib/types/action"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { requireRole } from "@/lib/auth/dal"
import { isUniqueConstraintError, uniqueConstraintTouches } from "@/lib/db/prisma-errors"
import {
  createSectionSchema,
  editSectionSchema,
  type CreateSectionInput,
  type EditSectionInput,
} from "@/lib/validations/academics"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export type AcademicResult = ActionResult

export async function createSection(input: CreateSectionInput): Promise<AcademicResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("academics")

  const parsed = createSectionSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  const klass = await prisma.class.findFirst({
    where: { id: parsed.data.classId, schoolId: user.schoolId },
  })
  if (!klass) return { success: false, error: t("errors.notFound") }

  try {
    await prisma.section.create({
      data: { classId: parsed.data.classId, name: parsed.data.name },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: t("errors.duplicateSection") }
    }
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidatePath(`/academics/classes/${parsed.data.classId}`)
  return { success: true }
}

export async function updateSection(
  classId: string,
  input: EditSectionInput
): Promise<AcademicResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("academics")

  const parsed = editSectionSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  const existing = await prisma.section.findFirst({
    where: { id: parsed.data.id, class: { schoolId: user.schoolId } },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  try {
    await prisma.section.update({
      where: { id: parsed.data.id },
      data: { name: parsed.data.name, isActive: parsed.data.isActive },
    })
  } catch (error) {
    if (isUniqueConstraintError(error) && uniqueConstraintTouches(error, "name")) {
      return { success: false, error: t("errors.duplicateSection") }
    }
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidatePath(`/academics/classes/${classId}`)
  return { success: true }
}
