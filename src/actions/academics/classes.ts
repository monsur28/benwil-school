"use server"
import { ActionResult } from "@/lib/types/action"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { requireRole } from "@/lib/auth/dal"
import { isUniqueConstraintError, uniqueConstraintTouches } from "@/lib/db/prisma-errors"
import {
  createClassSchema,
  editClassSchema,
  type CreateClassInput,
  type EditClassInput,
} from "@/lib/validations/academics"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export type AcademicResult = ActionResult

export async function createClass(input: CreateClassInput): Promise<AcademicResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("academics")

  const parsed = createClassSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  try {
    await prisma.class.create({
      data: { schoolId: user.schoolId, name: parsed.data.name, order: parsed.data.order },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: t("errors.duplicateClass") }
    }
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidatePath("/academics/classes")
  return { success: true }
}

export async function updateClass(input: EditClassInput): Promise<AcademicResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("academics")

  const parsed = editClassSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  const existing = await prisma.class.findFirst({
    where: { id: parsed.data.id, schoolId: user.schoolId },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  try {
    await prisma.class.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        order: parsed.data.order,
        isActive: parsed.data.isActive,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error) && uniqueConstraintTouches(error, "name")) {
      return { success: false, error: t("errors.duplicateClass") }
    }
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidatePath("/academics/classes")
  revalidatePath(`/academics/classes/${parsed.data.id}`)
  return { success: true }
}
