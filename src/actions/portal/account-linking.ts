"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { hashPassword } from "@/lib/auth/password"
import { isUniqueConstraintError, uniqueConstraintTouches } from "@/lib/db/prisma-errors"
import { createPortalAccountSchema } from "@/lib/validations/portal-account"

const ADMIN_ROLES: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export type PortalAccountActionResult = { error?: string }

export async function createStudentAccount(
  studentId: string,
  input: unknown
): Promise<PortalAccountActionResult> {
  const user = await requireRole(...ADMIN_ROLES)
  const t = await getTranslations("portal")

  const parsed = createPortalAccountSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  // Re-fetch by (id, schoolId) rather than trusting the caller's studentId
  // alone - never link an account to another school's student.
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId: user.schoolId },
    select: { id: true, name: true, userId: true },
  })
  if (!student) return { error: t("errors.notFound") }
  if (student.userId) return { error: t("errors.alreadyLinked") }

  try {
    const passwordHash = await hashPassword(parsed.data.password)
    await prisma.$transaction(async (tx) => {
      const account = await tx.user.create({
        data: {
          schoolId: user.schoolId,
          name: student.name,
          email: parsed.data.email,
          passwordHash,
          role: Role.STUDENT,
        },
      })
      await tx.student.update({ where: { id: student.id }, data: { userId: account.id } })
    })
  } catch (error) {
    if (isUniqueConstraintError(error) && uniqueConstraintTouches(error, "email")) {
      return { error: t("errors.emailTaken") }
    }
    return { error: t("errors.saveFailed") }
  }

  revalidatePath(`/students/${studentId}`)
  return {}
}

export async function createGuardianAccount(
  guardianId: string,
  input: unknown
): Promise<PortalAccountActionResult> {
  const user = await requireRole(...ADMIN_ROLES)
  const t = await getTranslations("portal")

  const parsed = createPortalAccountSchema.safeParse(input)
  if (!parsed.success) return { error: t("errors.invalidForm") }

  const guardian = await prisma.guardian.findFirst({
    where: { id: guardianId, schoolId: user.schoolId },
    select: { id: true, name: true, userId: true },
  })
  if (!guardian) return { error: t("errors.notFound") }
  if (guardian.userId) return { error: t("errors.alreadyLinked") }

  try {
    const passwordHash = await hashPassword(parsed.data.password)
    await prisma.$transaction(async (tx) => {
      const account = await tx.user.create({
        data: {
          schoolId: user.schoolId,
          name: guardian.name,
          email: parsed.data.email,
          passwordHash,
          role: Role.GUARDIAN,
        },
      })
      await tx.guardian.update({ where: { id: guardian.id }, data: { userId: account.id } })
    })
  } catch (error) {
    if (isUniqueConstraintError(error) && uniqueConstraintTouches(error, "email")) {
      return { error: t("errors.emailTaken") }
    }
    return { error: t("errors.saveFailed") }
  }

  revalidatePath(`/students`)
  return {}
}

// Shared toggle for both kinds of portal account - the target must be a
// STUDENT or GUARDIAN account in the admin's own school, never an admin's
// own account or another school's.
export async function setPortalAccountActive(
  userId: string,
  isActive: boolean
): Promise<PortalAccountActionResult> {
  const admin = await requireRole(...ADMIN_ROLES)
  const t = await getTranslations("portal")

  const account = await prisma.user.findFirst({
    where: { id: userId, schoolId: admin.schoolId, role: { in: [Role.STUDENT, Role.GUARDIAN] } },
    select: { id: true },
  })
  if (!account) return { error: t("errors.notFound") }

  await prisma.user.update({ where: { id: account.id }, data: { isActive } })
  revalidatePath(`/students`)
  return {}
}
