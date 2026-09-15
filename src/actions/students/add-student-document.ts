"use server"
import { ActionResult } from '@/lib/types/action'

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { requireRole } from "@/lib/auth/dal"
import { documentInputSchema, type DocumentInput } from "@/lib/validations/student"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export async function addStudentDocument(
  studentId: string,
  input: DocumentInput
): Promise<ActionResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("students")

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId: user.schoolId },
  })
  if (!student) {
    return { success: false, error: t("errors.notFound") }
  }

  const parsed = documentInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: t("errors.invalidForm") }
  }

  // No storage provider is configured (see lib/storage/document-storage.ts),
  // so this records the document's metadata only — no file is attached yet.
  await prisma.studentDocument.create({
    data: { studentId, type: parsed.data.type, title: parsed.data.title },
  })

  revalidatePath(`/students/${studentId}`)
  return { success: true }
}
