"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { requireRole } from "@/lib/auth/dal"
import { hashPassword } from "@/lib/auth/password"
import { isUniqueConstraintError, uniqueConstraintTouches } from "@/lib/db/prisma-errors"
import { createTeacherSchema, updateTeacherSchema, type CreateTeacherInput, type UpdateTeacherInput } from "@/lib/validations/teacher"
import type { ActionResult } from "@/lib/types/action"

// Matches the boundary the existing /teachers list page already draws
// (its "Add teacher" button only renders for these roles): HR can view the
// directory but does not manage teacher accounts. Nothing in the existing
// app grants HR that write access, so this phase doesn't invent it either.
const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

function toProfileData(data: Omit<UpdateTeacherInput, never>) {
  return {
    name: data.name,
    phone: data.phone || null,
    address: data.address || null,
    employeeId: data.employeeId || null,
    designation: data.designation || null,
    department: data.department || null,
    joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
    employmentType: data.employmentType || null,
    qualifications: data.qualifications || null,
    specialization: data.specialization || null,
  }
}

export async function createTeacher(input: CreateTeacherInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("teachers")

  const parsed = createTeacherSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }
  const data = parsed.data

  try {
    const passwordHash = await hashPassword(data.password)
    const teacher = await prisma.user.create({
      data: {
        schoolId: user.schoolId,
        email: data.email,
        passwordHash,
        role: Role.TEACHER,
        ...toProfileData(data),
      },
      select: { id: true },
    })
    revalidatePath("/teachers")
    return { success: true, data: { id: teacher.id } }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      if (uniqueConstraintTouches(error, "email")) return { success: false, error: t("errors.emailTaken") }
      if (uniqueConstraintTouches(error, "employeeId")) return { success: false, error: t("errors.employeeIdTaken") }
    }
    return { success: false, error: t("errors.saveFailed") }
  }
}

export async function updateTeacher(teacherId: string, input: UpdateTeacherInput): Promise<ActionResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("teachers")

  // Re-fetched by (id, schoolId, role) - a teacherId from the browser is
  // never trusted to belong to this admin's own school, and this must stay
  // a TEACHER account (an admin editing this form can't repurpose it into
  // touching another role's account by URL alone).
  const existing = await prisma.user.findFirst({
    where: { id: teacherId, schoolId: user.schoolId, role: Role.TEACHER },
    select: { id: true },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  const parsed = updateTeacherSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  try {
    await prisma.user.update({
      where: { id: existing.id },
      data: toProfileData(parsed.data),
    })
  } catch (error) {
    if (isUniqueConstraintError(error) && uniqueConstraintTouches(error, "employeeId")) {
      return { success: false, error: t("errors.employeeIdTaken") }
    }
    if (error && typeof error === "object" && "digest" in error) throw error
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidatePath("/teachers")
  revalidatePath(`/teachers/${teacherId}`)
  redirect(`/teachers/${teacherId}?updated=1`)
}

// Deactivation only flips the login/assignability flag - it never touches
// homework, attendance, exam, or assignment history (spec §4/§23). An
// inactive teacher is excluded from checkHomeworkWriteAccess's underlying
// isTeacherAssignedTo*() calls only insofar as new TeacherAssignment rows
// require isActive:true at creation time; existing assignments and every
// record they produced stay exactly as they are.
export async function setTeacherActive(teacherId: string, isActive: boolean): Promise<ActionResult> {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("teachers")

  const existing = await prisma.user.findFirst({
    where: { id: teacherId, schoolId: user.schoolId, role: Role.TEACHER },
    select: { id: true },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  await prisma.user.update({ where: { id: existing.id }, data: { isActive } })

  revalidatePath("/teachers")
  revalidatePath(`/teachers/${teacherId}`)
  return { success: true }
}
