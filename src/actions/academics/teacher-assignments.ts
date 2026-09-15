"use server"
import { ActionResult } from "@/lib/types/action"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { requireRole } from "@/lib/auth/dal"
import { isUniqueConstraintError } from "@/lib/db/prisma-errors"
import { teacherAssignmentSchema, type TeacherAssignmentInput } from "@/lib/validations/academics"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export type AcademicResult = ActionResult

export async function createTeacherAssignment(
  input: TeacherAssignmentInput
): Promise<AcademicResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("academics")

  const parsed = teacherAssignmentSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }
  const data = parsed.data

  const [teacher, section, classSubject] = await Promise.all([
    prisma.user.findFirst({
      where: { id: data.teacherId, schoolId: user.schoolId, role: Role.TEACHER },
    }),
    prisma.section.findFirst({
      where: { id: data.sectionId, classId: data.classId, class: { schoolId: user.schoolId } },
    }),
    prisma.classSubject.findFirst({
      where: { classId: data.classId, subjectId: data.subjectId },
    }),
  ])
  if (!teacher || !section) return { success: false, error: t("errors.notFound") }
  if (!classSubject) return { success: false, error: t("errors.subjectNotInClass") }

  try {
    await prisma.teacherAssignment.create({
      data: {
        schoolId: user.schoolId,
        teacherId: data.teacherId,
        classId: data.classId,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: t("errors.duplicateAssignment") }
    }
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidatePath("/academics/assignments")
  revalidatePath(`/academics/classes/${data.classId}`)
  return { success: true }
}

export async function removeTeacherAssignment(id: string): Promise<AcademicResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("academics")

  const existing = await prisma.teacherAssignment.findFirst({
    where: { id, schoolId: user.schoolId },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  await prisma.teacherAssignment.delete({ where: { id } })

  revalidatePath("/academics/assignments")
  revalidatePath(`/academics/classes/${existing.classId}`)
  return { success: true }
}
