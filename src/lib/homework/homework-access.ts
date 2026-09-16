import "server-only"
import { Role } from "@prisma/client"
import { isTeacherAssignedToSubjectInSection } from "@/lib/academics/teacher-assignments"
import type { SessionData } from "@/lib/auth/session"

// Full homework management (create/edit/publish/categories) is admin-tier
// or the assigned teacher - no other role manages homework in this phase.
export const HOMEWORK_ADMIN_ROLES: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]
export const HOMEWORK_ROLES: Role[] = [...HOMEWORK_ADMIN_ROLES, Role.TEACHER]

export type HomeworkAccessResult = { ok: true } | { ok: false; reason: "unauthorized" }

// The write-access gate for creating/updating/publishing homework against a
// given class + section + subject. Admins and the Principal are
// unrestricted within their own school (schoolId scoping happens at the
// caller's Prisma query, not here). A TEACHER must have a TeacherAssignment
// matching the exact class + section + subject IN THE HOMEWORK'S OWN
// ACADEMIC YEAR, re-checked here against the database every call - never
// trust classId/sectionId/subjectId/academicYearId that merely arrived via
// a form. Reuses the same TeacherAssignment check exam marks entry already
// relies on (see src/lib/exams/schedule-access.ts).
export async function checkHomeworkWriteAccess(
  user: SessionData,
  academicYearId: string,
  classId: string,
  sectionId: string,
  subjectId: string
): Promise<HomeworkAccessResult> {
  if (HOMEWORK_ADMIN_ROLES.includes(user.role)) {
    return { ok: true }
  }
  if (user.role !== Role.TEACHER) {
    return { ok: false, reason: "unauthorized" }
  }
  const assigned = await isTeacherAssignedToSubjectInSection(user.userId, academicYearId, classId, sectionId, subjectId)
  return assigned ? { ok: true } : { ok: false, reason: "unauthorized" }
}

// A teacher may only manage their OWN homework - even if they still teach
// the class/section/subject, editing or publishing a colleague's homework
// is not allowed. Admins are unrestricted (schoolId scoping happens at the
// caller's query). Pure/synchronous since it only compares ids already in
// hand - no extra database round trip needed.
export function checkHomeworkOwnership(user: SessionData, homeworkTeacherId: string): HomeworkAccessResult {
  if (HOMEWORK_ADMIN_ROLES.includes(user.role)) {
    return { ok: true }
  }
  if (user.role === Role.TEACHER && user.userId === homeworkTeacherId) {
    return { ok: true }
  }
  return { ok: false, reason: "unauthorized" }
}
