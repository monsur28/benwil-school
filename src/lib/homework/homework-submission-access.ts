import "server-only"
import { Role } from "@prisma/client"
import type { SessionData } from "@/lib/auth/session"
import { HOMEWORK_ADMIN_ROLES } from "./homework-access"

export type SubmissionAccessResult = { ok: true } | { ok: false; reason: "unauthorized" | "not_found" | "closed" | "mismatch" }

// Re-exported so existing server-side importers don't need to change -
// the actual implementation lives in submission-timing.ts, which has no
// "server-only" marker and no transitive Prisma import, so client
// components can import it directly without pulling this file in.
export { isSubmissionOpen, isSubmissionLate } from "./submission-timing"

/**
 * Validates that a student is eligible to submit to a specific homework.
 * Enforces:
 * - Same school
 * - Published status
 * - Matching academic year
 * - Matching class
 * - Matching section
 */
export function checkStudentSubmissionEligibility(
  student: {
    schoolId: string
    academicYearId: string
    classId: string
    sectionId: string
  },
  homework: {
    schoolId: string
    academicYearId: string
    classId: string
    sectionId: string
    status: string
  }
): SubmissionAccessResult {
  if (student.schoolId !== homework.schoolId) {
    return { ok: false, reason: "unauthorized" }
  }
  if (homework.status !== "PUBLISHED") {
    return { ok: false, reason: "not_found" }
  }
  if (
    student.academicYearId !== homework.academicYearId ||
    student.classId !== homework.classId ||
    student.sectionId !== homework.sectionId
  ) {
    return { ok: false, reason: "mismatch" }
  }
  return { ok: true }
}

/**
 * Validates that a user (Teacher or Admin/Principal) can review a submission for a homework + student pair.
 * Enforces:
 * - User belongs to the same school as the homework
 * - Teacher owns the homework (admins/principal may review school homework)
 * - Student belongs to the homework's school, academic year, class, and section
 */
export function checkTeacherReviewAccess(
  user: SessionData,
  homework: {
    schoolId: string
    teacherId: string
    academicYearId: string
    classId: string
    sectionId: string
  },
  student: {
    schoolId: string
    academicYearId: string
    classId: string
    sectionId: string
  }
): SubmissionAccessResult {
  if (user.schoolId !== homework.schoolId || user.schoolId !== student.schoolId) {
    return { ok: false, reason: "unauthorized" }
  }

  // Teacher ownership check
  if (user.role === Role.TEACHER) {
    if (user.userId !== homework.teacherId) {
      return { ok: false, reason: "unauthorized" }
    }
  } else if (!HOMEWORK_ADMIN_ROLES.includes(user.role)) {
    return { ok: false, reason: "unauthorized" }
  }

  // Roster match check: student must belong to homework's class, section, and academic year
  if (
    student.academicYearId !== homework.academicYearId ||
    student.classId !== homework.classId ||
    student.sectionId !== homework.sectionId
  ) {
    return { ok: false, reason: "mismatch" }
  }

  return { ok: true }
}
