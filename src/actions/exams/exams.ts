"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { createExamSchema, editExamSchema } from "@/lib/validations/exams"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export type ExamActionResult = { error?: string }

async function assertYearAndTypeBelongToSchool(
  schoolId: string,
  academicYearId: string,
  examTypeId: string,
  t: (key: string) => string
): Promise<string | null> {
  const [academicYear, examType] = await Promise.all([
    prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId }, select: { id: true } }),
    prisma.examType.findFirst({ where: { id: examTypeId, schoolId }, select: { id: true } }),
  ])
  if (!academicYear) return t("errors.academicYearRequired")
  if (!examType) return t("errors.examTypeRequired")
  return null
}

export async function createExam(input: unknown): Promise<ExamActionResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("exams")

  const parsed = createExamSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  const relationError = await assertYearAndTypeBelongToSchool(
    user.schoolId,
    parsed.data.academicYearId,
    parsed.data.examTypeId,
    t
  )
  if (relationError) return { error: relationError }

  await prisma.exam.create({
    data: {
      schoolId: user.schoolId,
      academicYearId: parsed.data.academicYearId,
      examTypeId: parsed.data.examTypeId,
      name: parsed.data.name,
      nameBn: parsed.data.nameBn || null,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    },
  })

  revalidatePath("/exams")
  return {}
}

export async function updateExam(input: unknown): Promise<ExamActionResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("exams")

  const parsed = editExamSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  const existing = await prisma.exam.findFirst({
    where: { id: parsed.data.id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { error: t("errors.notFound") }

  const relationError = await assertYearAndTypeBelongToSchool(
    user.schoolId,
    parsed.data.academicYearId,
    parsed.data.examTypeId,
    t
  )
  if (relationError) return { error: relationError }

  await prisma.exam.update({
    where: { id: parsed.data.id },
    data: {
      academicYearId: parsed.data.academicYearId,
      examTypeId: parsed.data.examTypeId,
      name: parsed.data.name,
      nameBn: parsed.data.nameBn || null,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      isActive: parsed.data.isActive,
    },
  })

  revalidatePath("/exams")
  revalidatePath(`/exams/${parsed.data.id}`)
  return {}
}

export async function toggleExamActive(id: string, isActive: boolean): Promise<ExamActionResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("exams")

  const existing = await prisma.exam.findFirst({
    where: { id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return { error: t("errors.notFound") }

  await prisma.exam.update({ where: { id }, data: { isActive } })
  revalidatePath("/exams")
  revalidatePath(`/exams/${id}`)
  return {}
}
