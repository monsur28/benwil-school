"use server"

import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { isUniqueConstraintError, uniqueConstraintTouches } from "@/lib/db/prisma-errors"
import { requireRole } from "@/lib/auth/dal"
import { createStudentSchema, type CreateStudentInput } from "@/lib/validations/student"
import { generateStudentUid } from "@/lib/students/student-uid"
import { syncStudentGuardians } from "@/lib/students/guardians"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

import { ActionResult } from "@/lib/types/action"
export type StudentFormResult = ActionResult;

export async function createStudent(input: CreateStudentInput): Promise<StudentFormResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("students")

  const parsed = createStudentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: t("errors.invalidForm") }
  }
  const data = parsed.data

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
    const studentId = await prisma.$transaction(async (tx) => {
      const studentUid = await generateStudentUid()

      const student = await tx.student.create({
        data: {
          schoolId: user.schoolId,
          studentUid,
          admissionNumber: data.admissionNumber,
          name: data.name,
          nameBn: data.nameBn || null,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender,
          bloodGroup: data.bloodGroup || null,
          religion: data.religion || null,
          nationality: data.nationality || "Bangladeshi",
          birthCertificateNumber: data.birthCertificateNumber || null,
          admissionDate: new Date(data.admissionDate),
          academicYearId: data.academicYearId,
          classId: data.classId,
          sectionId: data.sectionId,
          roll: data.roll,
        },
      })

      await syncStudentGuardians(tx, user.schoolId, student.id, data.guardians)

      if (data.documents.length > 0) {
        await tx.studentDocument.createMany({
          data: data.documents.map((doc) => ({
            studentId: student.id,
            type: doc.type,
            title: doc.title,
          })),
        })
      }

      return student.id
    })

    redirect(`/students/${studentId}?created=1`)
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
      throw error // Next.js redirect()/notFound() internals, not a real error
    }
    return { success: false, error: t("errors.saveFailed") }
  }
}
