"use server"

import { Role } from "@prisma/client"
import { getTranslations } from "next-intl/server"
import type { ActionResult } from "@/lib/types/action"
import { requireRole } from "@/lib/auth/dal"
import { createStudentDocumentUploadSignature, validateStudentDocumentFile, type StudentDocumentUploadSignature } from "@/lib/storage/cloudinary-student-documents"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]
type UploadRequest = { name: string; type: string; size: number }

export async function getStudentDocumentUploadSignature(input: UploadRequest): Promise<ActionResult<StudentDocumentUploadSignature>> {
  const [user, t] = await Promise.all([requireRole(...CAN_MANAGE), getTranslations("students")])
  if (validateStudentDocumentFile(input)) return { success: false, error: t("errors.invalidForm") }

  const signature = createStudentDocumentUploadSignature(user.schoolId, input)
  if (!signature) return { success: false, error: t("errors.invalidForm") }
  return { success: true, data: signature }
}
