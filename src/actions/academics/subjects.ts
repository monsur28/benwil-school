"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { requireRole } from "@/lib/auth/dal"
import { isUniqueConstraintError, uniqueConstraintTouches } from "@/lib/db/prisma-errors"
import {
  createSubjectSchema,
  editSubjectSchema,
  type CreateSubjectInput,
  type EditSubjectInput,
} from "@/lib/validations/academics"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export type AcademicResult = { error?: string }

export async function createSubject(input: CreateSubjectInput): Promise<AcademicResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("academics")

  const parsed = createSubjectSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  try {
    await prisma.subject.create({
      data: {
        schoolId: user.schoolId,
        name: parsed.data.name,
        nameBn: parsed.data.nameBn || null,
        code: parsed.data.code,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      if (uniqueConstraintTouches(error, "code")) return { error: t("errors.duplicateSubjectCode") }
      return { error: t("errors.duplicateSubject") }
    }
    return { error: t("errors.saveFailed") }
  }

  revalidatePath("/academics/subjects")
  return {}
}

export async function updateSubject(input: EditSubjectInput): Promise<AcademicResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("academics")

  const parsed = editSubjectSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  const existing = await prisma.subject.findFirst({
    where: { id: parsed.data.id, schoolId: user.schoolId },
  })
  if (!existing) return { error: t("errors.notFound") }

  try {
    await prisma.subject.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        nameBn: parsed.data.nameBn || null,
        code: parsed.data.code,
        isActive: parsed.data.isActive,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      if (uniqueConstraintTouches(error, "code")) return { error: t("errors.duplicateSubjectCode") }
      return { error: t("errors.duplicateSubject") }
    }
    return { error: t("errors.saveFailed") }
  }

  revalidatePath("/academics/subjects")
  return {}
}
