import "server-only"
import { prisma } from "@/lib/db/client"

export type HomeworkAssessmentSummary = {
  gradedCount: number
  totalMarks: number
  totalMaxMarks: number
  averagePercent: number | null
}

// Phase 10 groundwork for the "Term Assessment Integration" requirement,
// now consumed by Phase 12 (see src/lib/results/get-results.ts).
//
// classId is required and filtered on directly - a student's homework only
// counts toward a Term Exam schedule for the same school+academicYear+class+
// subject it was assigned in (Phase 12 isolation rule), never a different
// class the student may have other homework in.
export async function getStudentHomeworkAssessmentSummary(args: {
  schoolId: string
  studentId: string
  classId: string
  subjectId: string
  academicYearId: string
}): Promise<HomeworkAssessmentSummary> {
  const summaries = await getHomeworkAssessmentSummaries({
    schoolId: args.schoolId,
    studentIds: [args.studentId],
    classId: args.classId,
    subjectId: args.subjectId,
    academicYearId: args.academicYearId,
  })
  return (
    summaries.get(args.studentId) ?? { gradedCount: 0, totalMarks: 0, totalMaxMarks: 0, averagePercent: null }
  )
}

// Batched version of the above - one query for every student in a class/
// section at once (used by result calculation, which must never run one
// homework query per student). Only students with at least one reviewed,
// marked homework for this subject+class+academic year appear in the
// returned map.
export async function getHomeworkAssessmentSummaries(args: {
  schoolId: string
  studentIds: string[]
  classId: string
  subjectId: string
  academicYearId: string
}): Promise<Map<string, HomeworkAssessmentSummary>> {
  if (args.studentIds.length === 0) return new Map()

  const submissions = await prisma.homeworkSubmission.findMany({
    where: {
      schoolId: args.schoolId,
      studentId: { in: args.studentIds },
      status: "REVIEWED",
      marks: { not: null },
      homework: {
        schoolId: args.schoolId,
        classId: args.classId,
        subjectId: args.subjectId,
        academicYearId: args.academicYearId,
        maxMarks: { not: null },
      },
    },
    select: {
      studentId: true,
      marks: true,
      homework: { select: { maxMarks: true } },
    },
  })

  const accumulators = new Map<string, { totalMarks: number; totalMaxMarks: number; gradedCount: number }>()
  for (const submission of submissions) {
    const acc = accumulators.get(submission.studentId) ?? { totalMarks: 0, totalMaxMarks: 0, gradedCount: 0 }
    // Both are guaranteed non-null by the where clause above.
    acc.totalMarks += Number(submission.marks)
    acc.totalMaxMarks += submission.homework.maxMarks as number
    acc.gradedCount += 1
    accumulators.set(submission.studentId, acc)
  }

  const summaries = new Map<string, HomeworkAssessmentSummary>()
  for (const [studentId, acc] of accumulators) {
    summaries.set(studentId, {
      gradedCount: acc.gradedCount,
      totalMarks: acc.totalMarks,
      totalMaxMarks: acc.totalMaxMarks,
      averagePercent: acc.totalMaxMarks > 0 ? Math.round((acc.totalMarks / acc.totalMaxMarks) * 1000) / 10 : null,
    })
  }
  return summaries
}
