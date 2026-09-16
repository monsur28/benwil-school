"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { requireRole } from "@/lib/auth/dal"
import { isUniqueConstraintError } from "@/lib/db/prisma-errors"
import { teacherAssignmentSchema, type TeacherAssignmentInput } from "@/lib/validations/academics"
import type { ActionResult } from "@/lib/types/action"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]
export type AcademicResult = ActionResult

export async function createTeacherAssignment(input: TeacherAssignmentInput): Promise<AcademicResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("academics")
  const parsed = teacherAssignmentSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }
  const data = parsed.data

  const [teacher, section, classSubject, academicYear] = await Promise.all([
    prisma.user.findFirst({ where: { id: data.teacherId, schoolId: user.schoolId, role: Role.TEACHER, isActive: true }, select: { id: true } }),
    prisma.section.findFirst({ where: { id: data.sectionId, classId: data.classId, class: { schoolId: user.schoolId } }, select: { id: true } }),
    prisma.classSubject.findFirst({ where: { classId: data.classId, subjectId: data.subjectId, class: { schoolId: user.schoolId }, subject: { schoolId: user.schoolId } }, select: { id: true } }),
    prisma.academicYear.findFirst({ where: { id: data.academicYearId, schoolId: user.schoolId }, select: { id: true } }),
  ])
  if (!teacher || !section || !academicYear) return { success: false, error: t("errors.notFound") }
  if (!classSubject) return { success: false, error: t("errors.subjectNotInClass") }

  if (data.isClassTeacher) {
    const classTeacherExists = await prisma.teacherAssignment.findFirst({
      where: { schoolId: user.schoolId, academicYearId: data.academicYearId, classId: data.classId, sectionId: data.sectionId, isClassTeacher: true },
      select: { id: true },
    })
    if (classTeacherExists) return { success: false, error: t("errors.duplicateAssignment") }
  }

  try {
    await prisma.teacherAssignment.create({ data: { schoolId: user.schoolId, teacherId: data.teacherId, classId: data.classId, sectionId: data.sectionId, subjectId: data.subjectId, academicYearId: data.academicYearId, isClassTeacher: data.isClassTeacher } })
  } catch (error) {
    if (isUniqueConstraintError(error)) return { success: false, error: t("errors.duplicateAssignment") }
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidatePath("/academics/assignments")
  revalidatePath(`/academics/classes/${data.classId}`)
  revalidatePath(`/teachers/${data.teacherId}`)
  revalidatePath("/teachers")
  return { success: true }
}

export async function removeTeacherAssignment(id: string): Promise<AcademicResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("academics")
  const existing = await prisma.teacherAssignment.findFirst({ where: { id, schoolId: user.schoolId }, select: { id: true, classId: true, teacherId: true } })
  if (!existing) return { success: false, error: t("errors.notFound") }
  await prisma.teacherAssignment.delete({ where: { id: existing.id } })
  revalidatePath("/academics/assignments")
  revalidatePath(`/academics/classes/${existing.classId}`)
  revalidatePath(`/teachers/${existing.teacherId}`)
  revalidatePath("/teachers")
  return { success: true }
}
