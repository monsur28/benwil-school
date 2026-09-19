import "server-only"
import { prisma } from "@/lib/db/client"

// PHASE 12: Teacher academic authorization is academic-year scoped.
//
// TeacherAssignment.academicYearId is nullable for one reason only: the
// single pre-Phase-11 assignment row created before this column existed.
// Every assignment created through createTeacherAssignment (Phase 11)
// requires a real academicYearId - the schema makes it mandatory. So a null
// row here is never "a new assignment someone forgot to date", it's exactly
// one specific kind of record: a legacy standing permission that predates
// per-year scoping. Treating it as "valid for any year" (rather than
// "invalid for every specific year", which is what a strict equality check
// would do) is a deliberate compatibility decision, not an oversight - a
// strict match would have silently deauthorized every teacher in the one
// school that has real assignment data today. Do not remove this null
// fallback without first confirming no legacy rows remain
// (SELECT count(*) FROM teacher_assignments WHERE "academicYearId" IS NULL).
//
// Every one of these functions takes academicYearId as an explicit,
// required-or-deliberately-null argument - never inferred from "whatever is
// currently active" internally. A future helper that queries
// TeacherAssignment without an academicYearId argument is a Phase 12
// regression; route new authorization needs through here instead.

export type TeacherAssignmentContext = {
  teacherId: string
  academicYearId: string
}

// A per-section permission (any subject in that section is enough) - used
// by attendance and results, which don't care which specific subject a
// teacher's assignment is for.
//
// schoolId is required and filtered on directly (TeacherAssignment carries
// its own schoolId column) so this check is self-contained authorization,
// not merely "correct as long as every caller already validated the ids" -
// a classId/sectionId that doesn't actually belong to schoolId can never
// produce a false positive here, regardless of what a future caller forgets
// to check first.
export async function isTeacherAssignedToSection(
  teacherId: string,
  schoolId: string,
  academicYearId: string,
  classId: string,
  sectionId: string
) {
  const match = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId,
      schoolId,
      classId,
      sectionId,
      OR: [{ academicYearId }, { academicYearId: null }],
    },
    select: { id: true },
  })
  return Boolean(match)
}

// Exam marks entry and homework are subject-specific (a teacher may only
// act on the exact subject they're assigned to teach in that class/section).
// See isTeacherAssignedToSection above for why schoolId is filtered here
// directly rather than left to callers.
export async function isTeacherAssignedToSubjectInSection(
  teacherId: string,
  schoolId: string,
  academicYearId: string,
  classId: string,
  sectionId: string,
  subjectId: string
) {
  const match = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId,
      schoolId,
      classId,
      sectionId,
      subjectId,
      OR: [{ academicYearId }, { academicYearId: null }],
    },
    select: { id: true },
  })
  return Boolean(match)
}

// One teacher can have several TeacherAssignment rows for the same
// class+section (one per subject); this collapses them to the distinct
// class+section pairs a teacher actually has any standing in, which is what
// attendance authorization (a per-section concept, not per-subject) needs.
//
// academicYearId is required to be passed explicitly - not optional - so
// every call site makes a conscious choice:
//   - a real id scopes the result to that year (plus legacy null rows)
//   - `null` explicitly means "every year this teacher has ever been
//     assigned" (see attendance history's page, which browses records
//     across all time and must not hide a class the teacher taught in a
//     past year - that's existing historical-access behavior, not a gap).
export async function getTeacherClassSectionPairs(teacherId: string, academicYearId: string | null) {
  return prisma.teacherAssignment.findMany({
    where: {
      teacherId,
      ...(academicYearId !== null && { OR: [{ academicYearId }, { academicYearId: null }] }),
    },
    select: { classId: true, sectionId: true },
    distinct: ["classId", "sectionId"],
  })
}

export async function getTeacherAssignmentTriples(teacherId: string, academicYearId: string | null) {
  return prisma.teacherAssignment.findMany({
    where: {
      teacherId,
      ...(academicYearId !== null && { OR: [{ academicYearId }, { academicYearId: null }] }),
    },
    select: { classId: true, sectionId: true, subjectId: true },
  })
}
