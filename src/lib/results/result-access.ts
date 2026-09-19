import "server-only"
import { Role } from "@prisma/client"
import { isTeacherAssignedToSection } from "@/lib/academics/teacher-assignments"
import type { SessionData } from "@/lib/auth/session"

export const RESULT_ADMIN_ROLES: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export type ResultAccessResult = { ok: true } | { ok: false; reason: "unauthorized" }

// Results necessarily span every subject scheduled for a class (unlike
// marks entry, which is scoped to one subject at a time), so this
// deliberately reuses the same class+section-level check attendance and the
// student profile already rely on (any assignment in that section is
// enough - see isTeacherAssignedToSection) rather than a per-subject one.
// A teacher who teaches even one subject in Class 7A may view Class 7A's
// results list and any of its students' result pages; a teacher with no
// assignment there at all may not. Admins/Principal are unrestricted within
// their own school - the schoolId scoping happens at the caller's Prisma
// query, not here.
// academicYearId must be the result's OWN exam's academic year - a
// historical 2025 result is checked against the teacher's 2025 assignment,
// never against whichever year is currently active (spec: historical
// results must remain accessible on their own terms).
export async function checkResultAccess(
  user: SessionData,
  academicYearId: string,
  classId: string,
  sectionId: string
): Promise<ResultAccessResult> {
  if (RESULT_ADMIN_ROLES.includes(user.role)) {
    return { ok: true }
  }
  if (user.role !== Role.TEACHER) {
    return { ok: false, reason: "unauthorized" }
  }
  const assigned = await isTeacherAssignedToSection(user.userId, user.schoolId, academicYearId, classId, sectionId)
  return assigned ? { ok: true } : { ok: false, reason: "unauthorized" }
}
