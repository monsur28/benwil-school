"use server"

import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { isUniqueConstraintError, uniqueConstraintTouches } from "@/lib/db/prisma-errors"
import { requireRole } from "@/lib/auth/dal"
import { updateStudentSchema, type UpdateStudentInput } from "@/lib/validations/student"
import { syncStudentGuardians } from "@/lib/students/guardians"
import { isTrustedStudentPhotoUrl } from "@/lib/storage/cloudinary-student-documents"
import type { StudentFormResult } from "@/actions/students/create-student"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export async function updateStudent(
  studentId: string,
  input: UpdateStudentInput
): Promise<StudentFormResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("students")

  const existing = await prisma.student.findFirst({
    where: { id: studentId, schoolId: user.schoolId },
  })
  if (!existing) {
    return { success: false, error: t("errors.notFound") }
  }

  const parsed = updateStudentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: t("errors.invalidForm") }
  }
  const data = parsed.data

  // A photo URL arrives as a plain string from the browser, so it is only
  // accepted when it points at this school's own Cloudinary photo folder -
  // otherwise the field would be a free-form link to anywhere.
  if (data.photoUrl && !isTrustedStudentPhotoUrl(data.photoUrl, user.schoolId)) {
    return { success: false, error: t("errors.invalidPhoto") }
  }

  const [academicYear, section] = await Promise.all([
    prisma.academicYear.findFirst({ where: { id: data.academicYearId, schoolId: user.schoolId } }),
    prisma.section.findFirst({
      where: { id: data.sectionId, classId: data.classId, class: { schoolId: user.schoolId } },
    }),
  ])
  if (!academicYear || !section) {
    return { success: false, error: t("errors.invalidAcademicSelection") }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId },
        data: {
          admissionNumber: data.admissionNumber,
          name: data.name,
          nameBn: data.nameBn || null,
          photoUrl: data.photoUrl || null,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender,
          bloodGroup: data.bloodGroup || null,
          religion: data.religion || null,
          nationality: data.nationality || "Bangladeshi",
          birthCertificateNumber: data.birthCertificateNumber || null,
          admissionDate: new Date(data.admissionDate),
          status: data.status,
          academicYearId: data.academicYearId,
          classId: data.classId,
          sectionId: data.sectionId,
          roll: data.roll,
        },
      })

      await syncStudentGuardians(tx, user.schoolId, studentId, data.guardians)
    })

    redirect(`/students/${studentId}?updated=1`)
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      if (uniqueConstraintTouches(error, "admissionNumber")) {
        return { success: false, error: t("errors.duplicateAdmissionNumber"), field: "admissionNumber" }
      }
      if (uniqueConstraintTouches(error, "roll")) {
        return { success: false, error: t("errors.duplicateRoll"), field: "roll" }
      }
      return { success: false, error: t("errors.saveFailed") }
    }
    if (error && typeof error === "object" && "digest" in error) {
      throw error
    }
    return { success: false, error: t("errors.saveFailed") }
  }
}
