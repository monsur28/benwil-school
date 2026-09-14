"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { isUniqueConstraintError } from "@/lib/db/prisma-errors"
import { examScheduleSchema, editExamScheduleSchema } from "@/lib/validations/exams"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export type ExamActionResult = { error?: string }

async function assertScheduleRelations(
  schoolId: string,
  examId: string,
  classId: string,
  subjectId: string,
  t: (key: string) => string
): Promise<string | null> {
  const exam = await prisma.exam.findFirst({ where: { id: examId, schoolId }, select: { id: true } })
  if (!exam) return t("errors.notFound")

  const [classRecord, subject, classSubject] = await Promise.all([
    prisma.class.findFirst({ where: { id: classId, schoolId }, select: { id: true } }),
    prisma.subject.findFirst({ where: { id: subjectId, schoolId }, select: { id: true } }),
    prisma.classSubject.findFirst({ where: { classId, subjectId }, select: { id: true } }),
  ])
  if (!classRecord) return t("errors.classRequired")
  if (!subject) return t("errors.subjectRequired")
  if (!classSubject) return t("errors.subjectNotInClass")
  return null
}

export async function createExamSchedule(input: unknown): Promise<ExamActionResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("exams")

  const parsed = examScheduleSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  const relationError = await assertScheduleRelations(
    user.schoolId,
    parsed.data.examId,
    parsed.data.classId,
    parsed.data.subjectId,
    t
  )
  if (relationError) return { error: relationError }

  try {
    await prisma.examSchedule.create({
      data: {
        schoolId: user.schoolId,
        examId: parsed.data.examId,
        classId: parsed.data.classId,
        subjectId: parsed.data.subjectId,
        examDate: new Date(parsed.data.examDate),
        startTime: parsed.data.startTime || null,
        endTime: parsed.data.endTime || null,
        room: parsed.data.room || null,
        fullMarks: parsed.data.fullMarks,
        passMarks: parsed.data.passMarks,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: t("errors.duplicateSchedule") }
    return { error: t("errors.saveFailed") }
  }

  revalidatePath(`/exams/${parsed.data.examId}`)
  return {}
}

export async function updateExamSchedule(input: unknown): Promise<ExamActionResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("exams")

  const parsed = editExamScheduleSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  const existing = await prisma.examSchedule.findFirst({
    where: { id: parsed.data.id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { error: t("errors.notFound") }

  const relationError = await assertScheduleRelations(
    user.schoolId,
    parsed.data.examId,
    parsed.data.classId,
    parsed.data.subjectId,
    t
  )
  if (relationError) return { error: relationError }

  try {
    await prisma.examSchedule.update({
      where: { id: parsed.data.id },
      data: {
        classId: parsed.data.classId,
        subjectId: parsed.data.subjectId,
        examDate: new Date(parsed.data.examDate),
        startTime: parsed.data.startTime || null,
        endTime: parsed.data.endTime || null,
        room: parsed.data.room || null,
        fullMarks: parsed.data.fullMarks,
        passMarks: parsed.data.passMarks,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: t("errors.duplicateSchedule") }
    return { error: t("errors.saveFailed") }
  }

  revalidatePath(`/exams/${parsed.data.examId}`)
  return {}
}

export async function deleteExamSchedule(id: string): Promise<ExamActionResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("exams")

  const existing = await prisma.examSchedule.findFirst({
    where: { id, schoolId: user.schoolId },
    select: { id: true, examId: true, _count: { select: { marks: true } } },
  })
  if (!existing) return { error: t("errors.notFound") }
  if (existing._count.marks > 0) return { error: t("errors.hasMarksCannotDelete") }

  await prisma.examSchedule.delete({ where: { id } })
  revalidatePath(`/exams/${existing.examId}`)
  return {}
}
