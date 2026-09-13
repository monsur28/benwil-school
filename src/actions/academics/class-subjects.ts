"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { requireRole } from "@/lib/auth/dal"
import { isUniqueConstraintError } from "@/lib/db/prisma-errors"
import { classSubjectSchema, type ClassSubjectInput } from "@/lib/validations/academics"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export type AcademicResult = { error?: string }

export async function assignSubjectToClass(input: ClassSubjectInput): Promise<AcademicResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("academics")

  const parsed = classSubjectSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  const [klass, subject] = await Promise.all([
    prisma.class.findFirst({ where: { id: parsed.data.classId, schoolId: user.schoolId } }),
    prisma.subject.findFirst({ where: { id: parsed.data.subjectId, schoolId: user.schoolId } }),
  ])
  if (!klass || !subject) return { error: t("errors.notFound") }

  try {
    await prisma.classSubject.create({
      data: { classId: parsed.data.classId, subjectId: parsed.data.subjectId },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: t("errors.duplicateClassSubject") }
    }
    return { error: t("errors.saveFailed") }
  }

  revalidatePath(`/academics/classes/${parsed.data.classId}`)
  return {}
}

export async function removeSubjectFromClass(
  classId: string,
  subjectId: string
): Promise<AcademicResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("academics")

  const existing = await prisma.classSubject.findFirst({
    where: { classId, subjectId, class: { schoolId: user.schoolId } },
  })
  if (!existing) return { error: t("errors.notFound") }

  await prisma.classSubject.delete({ where: { id: existing.id } })

  revalidatePath(`/academics/classes/${classId}`)
  return {}
}
