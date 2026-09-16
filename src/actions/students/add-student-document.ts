"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import type { ActionResult } from "@/lib/types/action"
import { prisma } from "@/lib/db/client"
import { requireRole } from "@/lib/auth/dal"
import { documentInputSchema, type DocumentInput } from "@/lib/validations/student"
import { isTrustedStudentDocumentUpload } from "@/lib/storage/cloudinary-student-documents"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export async function addStudentDocument(studentId: string, input: DocumentInput): Promise<ActionResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("students")
  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: user.schoolId } })
  if (!student) return { success: false, error: t("errors.notFound") }

  const parsed = documentInputSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }
  if (!isTrustedStudentDocumentUpload(parsed.data, user.schoolId)) {
    return { success: false, error: t("errors.invalidForm") }
  }

  await prisma.studentDocument.create({ data: { studentId, ...parsed.data } })
  revalidatePath(`/students/${studentId}`)
  return { success: true }
}
