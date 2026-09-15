"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { isUniqueConstraintError } from "@/lib/db/prisma-errors"
import { FEE_ADMIN_ROLES, FEE_STAFF_ROLES } from "@/lib/fees/fee-access"
import {
  assignStudentFeeSchema,
  bulkAssignFeeSchema,
  cancelStudentFeeSchema,
  waiveStudentFeeSchema,
} from "@/lib/validations/fees"

export type FeeActionResult = { error?: string }
export type BulkAssignResult = { error?: string; data?: { createdCount: number; skippedCount: number } }

export async function assignStudentFee(input: unknown): Promise<FeeActionResult> {
  const user = await requireRole(...FEE_STAFF_ROLES)
  const t = await getTranslations("fees")

  const parsed = assignStudentFeeSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }
  const data = parsed.data

  const [student, academicYear, category, structure] = await Promise.all([
    prisma.student.findFirst({ where: { id: data.studentId, schoolId: user.schoolId }, select: { id: true } }),
    prisma.academicYear.findFirst({ where: { id: data.academicYearId, schoolId: user.schoolId }, select: { id: true } }),
    prisma.feeCategory.findFirst({ where: { id: data.feeCategoryId, schoolId: user.schoolId }, select: { id: true } }),
    data.feeStructureId
      ? prisma.feeStructure.findFirst({ where: { id: data.feeStructureId, schoolId: user.schoolId }, select: { id: true } })
      : Promise.resolve(null),
  ])
  if (!student || !academicYear || !category || (data.feeStructureId && !structure)) {
    return { error: t("errors.invalidSelection") }
  }

  try {
    await prisma.studentFee.create({
      data: {
        schoolId: user.schoolId,
        studentId: data.studentId,
        academicYearId: data.academicYearId,
        feeStructureId: data.feeStructureId || null,
        feeCategoryId: data.feeCategoryId,
        name: data.name,
        amount: data.amount,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assignedById: user.userId,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: t("errors.alreadyAssigned") }
    return { error: t("errors.saveFailed") }
  }

  revalidatePath(`/fees/student/${data.studentId}`)
  revalidatePath(`/students/${data.studentId}`)
  return {}
}

// Assigns one FeeStructure's charge to every currently-ACTIVE student in
// that structure's own (schoolId, classId, academicYearId) - never a
// student outside that scope, and never a student who already has this
// structure assigned (the unique index on [studentId, feeStructureId] is
// the schema-level backstop; `skipDuplicates` here avoids a partial failure
// if the eligibility query and the create race against a concurrent
// assignment).
export async function bulkAssignFeeToClass(input: unknown): Promise<BulkAssignResult> {
  const user = await requireRole(...FEE_STAFF_ROLES)
  const t = await getTranslations("fees")

  const parsed = bulkAssignFeeSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }
  const data = parsed.data

  const structure = await prisma.feeStructure.findFirst({
    where: { id: data.feeStructureId, schoolId: user.schoolId },
  })
  if (!structure) return { error: t("errors.invalidSelection") }

  const eligibleStudents = await prisma.student.findMany({
    where: {
      schoolId: user.schoolId,
      classId: structure.classId,
      academicYearId: structure.academicYearId,
      status: "ACTIVE",
      studentFees: { none: { feeStructureId: structure.id } },
    },
    select: { id: true },
  })
  if (eligibleStudents.length === 0) return { data: { createdCount: 0, skippedCount: 0 } }

  const dueDate = data.dueDate ? new Date(data.dueDate) : structure.dueDate

  const result = await prisma.studentFee.createMany({
    data: eligibleStudents.map((student) => ({
      schoolId: user.schoolId,
      studentId: student.id,
      academicYearId: structure.academicYearId,
      feeStructureId: structure.id,
      feeCategoryId: structure.feeCategoryId,
      name: structure.name,
      amount: structure.amount,
      dueDate,
      assignedById: user.userId,
    })),
    skipDuplicates: true,
  })

  revalidatePath("/fees/student")
  return { data: { createdCount: result.count, skippedCount: eligibleStudents.length - result.count } }
}

export async function waiveStudentFee(input: unknown): Promise<FeeActionResult> {
  const user = await requireRole(...FEE_ADMIN_ROLES)
  const t = await getTranslations("fees")

  const parsed = waiveStudentFeeSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  const fee = await prisma.studentFee.findFirst({
    where: { id: parsed.data.studentFeeId, schoolId: user.schoolId },
    select: { id: true, status: true, studentId: true },
  })
  if (!fee) return { error: t("errors.notFound") }
  if (fee.status !== "UNPAID") return { error: t("errors.cannotWaiveOrCancel") }

  await prisma.studentFee.update({
    where: { id: fee.id },
    data: {
      status: "WAIVED",
      waivedAt: new Date(),
      waivedById: user.userId,
      waiverReason: parsed.data.waiverReason,
    },
  })

  revalidatePath(`/fees/student/${fee.studentId}`)
  return {}
}

export async function cancelStudentFee(input: unknown): Promise<FeeActionResult> {
  const user = await requireRole(...FEE_ADMIN_ROLES)
  const t = await getTranslations("fees")

  const parsed = cancelStudentFeeSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  const fee = await prisma.studentFee.findFirst({
    where: { id: parsed.data.studentFeeId, schoolId: user.schoolId },
    select: { id: true, status: true, studentId: true },
  })
  if (!fee) return { error: t("errors.notFound") }
  if (fee.status !== "UNPAID") return { error: t("errors.cannotWaiveOrCancel") }

  await prisma.studentFee.update({
    where: { id: fee.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledById: user.userId,
      cancelReason: parsed.data.cancelReason,
    },
  })

  revalidatePath(`/fees/student/${fee.studentId}`)
  return {}
}
