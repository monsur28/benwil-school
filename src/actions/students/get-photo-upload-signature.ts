"use server"

import { Role } from "@prisma/client"
import { getTranslations } from "next-intl/server"
import type { ActionResult } from "@/lib/types/action"
import { requireRole } from "@/lib/auth/dal"
import {
  createStudentPhotoUploadSignature,
  validateStudentPhotoFile,
  type StudentDocumentUploadSignature,
} from "@/lib/storage/cloudinary-student-documents"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]
type UploadRequest = { name: string; type: string; size: number }

/**
 * Signs a direct-to-Cloudinary upload for a student profile photo.
 *
 * The signed folder is derived from the caller's own session school, never
 * from the request — so a signature issued here can only ever write into the
 * school the signer belongs to.
 */
export async function getStudentPhotoUploadSignature(
  input: UploadRequest
): Promise<ActionResult<StudentDocumentUploadSignature>> {
  const [user, t] = await Promise.all([requireRole(...CAN_MANAGE), getTranslations("students")])
  if (validateStudentPhotoFile(input)) return { success: false, error: t("errors.invalidPhoto") }

  const signature = createStudentPhotoUploadSignature(user.schoolId, input)
  if (!signature) return { success: false, error: t("errors.invalidPhoto") }
  return { success: true, data: signature }
}
