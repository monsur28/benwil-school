"use server"
import { ActionResult } from "@/lib/types/action"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { HOMEWORK_ROLES, checkHomeworkWriteAccess, checkHomeworkOwnership } from "@/lib/homework/homework-access"
import { createHomeworkSchema, editHomeworkSchema } from "@/lib/validations/homework"
import type { CreateHomeworkInput, EditHomeworkInput } from "@/lib/validations/homework"

// Every id in the payload (academic year, class, section, subject,
// category) arrives from the browser and is re-validated here against this
// user's own school before ever being attached to a homework row - the
// same "never trust the client" posture as resolveAudienceScope in
// src/actions/notices/notices.ts. section-belongs-to-class is checked too;
// section-belongs-to-school follows transitively through its class.
async function assertHomeworkRelations(
  schoolId: string,
  data: Pick<CreateHomeworkInput, "academicYearId" | "classId" | "sectionId" | "subjectId" | "categoryId">,
  t: (key: string) => string
): Promise<string | null> {
  const [academicYear, classRecord, subject, category] = await Promise.all([
    prisma.academicYear.findFirst({ where: { id: data.academicYearId, schoolId }, select: { id: true } }),
    prisma.class.findFirst({ where: { id: data.classId, schoolId }, select: { id: true } }),
    prisma.subject.findFirst({ where: { id: data.subjectId, schoolId }, select: { id: true } }),
    data.categoryId
      ? prisma.homeworkCategory.findFirst({ where: { id: data.categoryId, schoolId }, select: { id: true } })
      : Promise.resolve(null),
  ])
  if (!academicYear) return t("errors.invalidSelection")
  if (!classRecord) return t("errors.invalidSelection")
  if (!subject) return t("errors.invalidSelection")
  if (data.categoryId && !category) return t("errors.invalidSelection")

  const section = await prisma.section.findFirst({
    where: { id: data.sectionId, classId: data.classId },
    select: { id: true },
  })
  if (!section) return t("errors.invalidSelection")

  return null
}

export async function createHomework(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole(...HOMEWORK_ROLES)
  const t = await getTranslations("homework")

  const parsed = createHomeworkSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  const relationError = await assertHomeworkRelations(user.schoolId, parsed.data, t)
  if (relationError) return { success: false, error: relationError }

  const access = await checkHomeworkWriteAccess(user, parsed.data.academicYearId, parsed.data.classId, parsed.data.sectionId, parsed.data.subjectId)
  if (!access.ok) return { success: false, error: t("errors.notAssigned") }

  // A teacher's own homework is always attributed to their own session,
  // never a client-supplied teacherId. An admin/principal may create
  // homework on behalf of any TEACHER in their own school.
  let teacherId: string
  if (user.role === Role.TEACHER) {
    teacherId = user.userId
  } else {
    if (!parsed.data.teacherId) return { success: false, error: t("errors.invalidForm") }
    const teacher = await prisma.user.findFirst({
      where: { id: parsed.data.teacherId, schoolId: user.schoolId, role: Role.TEACHER },
      select: { id: true },
    })
    if (!teacher) return { success: false, error: t("errors.invalidSelection") }
    teacherId = teacher.id
  }

  const created = await prisma.homework.create({
    data: {
      schoolId: user.schoolId,
      teacherId,
      academicYearId: parsed.data.academicYearId,
      subjectId: parsed.data.subjectId,
      classId: parsed.data.classId,
      sectionId: parsed.data.sectionId,
      categoryId: parsed.data.categoryId || null,
      title: parsed.data.title,
      instructions: parsed.data.instructions,
      assignedDate: new Date(parsed.data.assignedDate),
      dueDate: new Date(parsed.data.dueDate),
      maxMarks: parsed.data.maxMarks ?? null,
    },
    select: { id: true },
  })

  revalidatePath("/homework")
  return { success: true, data: { id: created.id } }
}

export async function updateHomework(input: unknown): Promise<ActionResult> {
  const user = await requireRole(...HOMEWORK_ROLES)
  const t = await getTranslations("homework")

  const parsed = editHomeworkSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  const existing = await prisma.homework.findFirst({
    where: { id: parsed.data.id, schoolId: user.schoolId },
    select: { id: true, teacherId: true },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  const ownership = checkHomeworkOwnership(user, existing.teacherId)
  if (!ownership.ok) return { success: false, error: t("errors.notAssigned") }

  const relationError = await assertHomeworkRelations(user.schoolId, parsed.data, t)
  if (relationError) return { success: false, error: relationError }

  const access = await checkHomeworkWriteAccess(user, parsed.data.academicYearId, parsed.data.classId, parsed.data.sectionId, parsed.data.subjectId)
  if (!access.ok) return { success: false, error: t("errors.notAssigned") }

  // Status is deliberately untouched here - an ordinary edit never
  // silently demotes a PUBLISHED homework back to DRAFT (spec §11);
  // publishing is its own explicit action below.
  await prisma.homework.update({
    where: { id: parsed.data.id },
    data: {
      academicYearId: parsed.data.academicYearId,
      subjectId: parsed.data.subjectId,
      classId: parsed.data.classId,
      sectionId: parsed.data.sectionId,
      categoryId: parsed.data.categoryId || null,
      title: parsed.data.title,
      instructions: parsed.data.instructions,
      assignedDate: new Date(parsed.data.assignedDate),
      dueDate: new Date(parsed.data.dueDate),
      maxMarks: parsed.data.maxMarks ?? null,
    },
  })

  revalidatePath("/homework")
  revalidatePath(`/homework/${parsed.data.id}`)
  return { success: true }
}

export async function publishHomework(id: string): Promise<ActionResult> {
  const user = await requireRole(...HOMEWORK_ROLES)
  const t = await getTranslations("homework")

  const existing = await prisma.homework.findFirst({
    where: { id, schoolId: user.schoolId, status: "DRAFT" },
    select: { id: true, teacherId: true, academicYearId: true, classId: true, sectionId: true, subjectId: true },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  const ownership = checkHomeworkOwnership(user, existing.teacherId)
  if (!ownership.ok) return { success: false, error: t("errors.notAssigned") }

  if (user.role === Role.TEACHER) {
    const access = await checkHomeworkWriteAccess(user, existing.academicYearId, existing.classId, existing.sectionId, existing.subjectId)
    if (!access.ok) return { success: false, error: t("errors.notAssigned") }
  }

  await prisma.homework.update({ where: { id }, data: { status: "PUBLISHED" } })

  revalidatePath("/homework")
  revalidatePath(`/homework/${id}`)
  return { success: true }
}

export type { CreateHomeworkInput, EditHomeworkInput }
