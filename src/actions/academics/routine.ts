"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { requireRole } from "@/lib/auth/dal"
import { isTeacherAssignedToSubjectInSection } from "@/lib/academics/teacher-assignments"
import {
  checkRoutineConflicts,
} from "@/lib/academics/routine"
import {
  routineEntrySchema,
  editRoutineEntrySchema,
  type RoutineEntryFormInput,
  type EditRoutineEntryFormInput,
} from "@/lib/validations/routine"
import type { ActionResult } from "@/lib/types/action"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export async function createRoutineEntry(
  input: RoutineEntryFormInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("routine")

  const parsed = routineEntrySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: t("errors.invalidForm") }
  }
  const data = parsed.data

  // Revalidate related entities and school ownership
  const [academicYear, cls, section, subject, teacher, classSubject] = await Promise.all([
    prisma.academicYear.findFirst({
      where: { id: data.academicYearId, schoolId: user.schoolId },
      select: { id: true },
    }),
    prisma.class.findFirst({
      where: { id: data.classId, schoolId: user.schoolId },
      select: { id: true },
    }),
    prisma.section.findFirst({
      where: { id: data.sectionId, classId: data.classId, class: { schoolId: user.schoolId } },
      select: { id: true },
    }),
    prisma.subject.findFirst({
      where: { id: data.subjectId, schoolId: user.schoolId },
      select: { id: true },
    }),
    prisma.user.findFirst({
      where: { id: data.teacherId, schoolId: user.schoolId, role: Role.TEACHER, isActive: true },
      select: { id: true },
    }),
    prisma.classSubject.findFirst({
      where: {
        classId: data.classId,
        subjectId: data.subjectId,
        class: { schoolId: user.schoolId },
        subject: { schoolId: user.schoolId },
      },
      select: { id: true },
    }),
  ])

  if (!academicYear || !cls || !section || !subject || !teacher) {
    return { success: false, error: t("errors.notFound") }
  }

  if (!classSubject) {
    return { success: false, error: t("errors.subjectNotInClass") }
  }

  // Verify teacher holds assignment for this class, section, subject, academic year
  const isAssigned = await isTeacherAssignedToSubjectInSection(
    data.teacherId,
    user.schoolId,
    data.academicYearId,
    data.classId,
    data.sectionId,
    data.subjectId
  )
  if (!isAssigned) {
    return { success: false, error: t("errors.teacherNotAssigned") }
  }

  // Check schedule conflicts
  const conflict = await checkRoutineConflicts({
    schoolId: user.schoolId,
    academicYearId: data.academicYearId,
    classId: data.classId,
    sectionId: data.sectionId,
    teacherId: data.teacherId,
    dayOfWeek: data.dayOfWeek,
    periodNumber: data.periodNumber,
    startTime: data.startTime,
    endTime: data.endTime,
  })

  if (conflict.hasConflict) {
    if (conflict.errorKey === "errors.classConflict") {
      return { success: false, error: t("errors.classConflict") }
    }
    if (conflict.errorKey === "errors.teacherConflict") {
      return { success: false, error: t("errors.teacherConflict") }
    }
    if (conflict.errorKey === "errors.timeConflict") {
      return { success: false, error: t("errors.timeConflict") }
    }
    return { success: false, error: t("errors.saveFailed") }
  }

  let created
  try {
    created = await prisma.routineEntry.create({
      data: {
        schoolId: user.schoolId,
        academicYearId: data.academicYearId,
        classId: data.classId,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        dayOfWeek: data.dayOfWeek,
        periodNumber: data.periodNumber,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room?.trim() || null,
      },
    })
  } catch {
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidatePath("/academics/routine")
  revalidatePath("/portal/student/routine")
  revalidatePath("/portal/student")
  revalidatePath("/portal/guardian/children")

  return { success: true, data: { id: created.id } }
}

export async function updateRoutineEntry(
  input: EditRoutineEntryFormInput
): Promise<ActionResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("routine")

  const parsed = editRoutineEntrySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: t("errors.invalidForm") }
  }
  const data = parsed.data

  const existing = await prisma.routineEntry.findFirst({
    where: { id: data.id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) {
    return { success: false, error: t("errors.notFound") }
  }

  // Revalidate related entities and school ownership
  const [academicYear, cls, section, subject, teacher, classSubject] = await Promise.all([
    prisma.academicYear.findFirst({
      where: { id: data.academicYearId, schoolId: user.schoolId },
      select: { id: true },
    }),
    prisma.class.findFirst({
      where: { id: data.classId, schoolId: user.schoolId },
      select: { id: true },
    }),
    prisma.section.findFirst({
      where: { id: data.sectionId, classId: data.classId, class: { schoolId: user.schoolId } },
      select: { id: true },
    }),
    prisma.subject.findFirst({
      where: { id: data.subjectId, schoolId: user.schoolId },
      select: { id: true },
    }),
    prisma.user.findFirst({
      where: { id: data.teacherId, schoolId: user.schoolId, role: Role.TEACHER, isActive: true },
      select: { id: true },
    }),
    prisma.classSubject.findFirst({
      where: {
        classId: data.classId,
        subjectId: data.subjectId,
        class: { schoolId: user.schoolId },
        subject: { schoolId: user.schoolId },
      },
      select: { id: true },
    }),
  ])

  if (!academicYear || !cls || !section || !subject || !teacher) {
    return { success: false, error: t("errors.notFound") }
  }

  if (!classSubject) {
    return { success: false, error: t("errors.subjectNotInClass") }
  }

  // Verify teacher holds assignment
  const isAssigned = await isTeacherAssignedToSubjectInSection(
    data.teacherId,
    user.schoolId,
    data.academicYearId,
    data.classId,
    data.sectionId,
    data.subjectId
  )
  if (!isAssigned) {
    return { success: false, error: t("errors.teacherNotAssigned") }
  }

  // Check schedule conflicts
  const conflict = await checkRoutineConflicts({
    schoolId: user.schoolId,
    academicYearId: data.academicYearId,
    classId: data.classId,
    sectionId: data.sectionId,
    teacherId: data.teacherId,
    dayOfWeek: data.dayOfWeek,
    periodNumber: data.periodNumber,
    startTime: data.startTime,
    endTime: data.endTime,
    excludeId: data.id,
  })

  if (conflict.hasConflict) {
    if (conflict.errorKey === "errors.classConflict") {
      return { success: false, error: t("errors.classConflict") }
    }
    if (conflict.errorKey === "errors.teacherConflict") {
      return { success: false, error: t("errors.teacherConflict") }
    }
    if (conflict.errorKey === "errors.timeConflict") {
      return { success: false, error: t("errors.timeConflict") }
    }
    return { success: false, error: t("errors.saveFailed") }
  }

  try {
    await prisma.routineEntry.update({
      where: { id: data.id },
      data: {
        academicYearId: data.academicYearId,
        classId: data.classId,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        dayOfWeek: data.dayOfWeek,
        periodNumber: data.periodNumber,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room?.trim() || null,
      },
    })
  } catch {
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidatePath("/academics/routine")
  revalidatePath("/portal/student/routine")
  revalidatePath("/portal/student")
  revalidatePath("/portal/guardian/children")

  return { success: true }
}

export async function deleteRoutineEntry(id: string): Promise<ActionResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("routine")

  const existing = await prisma.routineEntry.findFirst({
    where: { id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) {
    return { success: false, error: t("errors.notFound") }
  }

  await prisma.routineEntry.delete({
    where: { id: existing.id },
  })

  revalidatePath("/academics/routine")
  revalidatePath("/portal/student/routine")
  revalidatePath("/portal/student")
  revalidatePath("/portal/guardian/children")

  return { success: true }
}
