import "server-only"
import { prisma } from "@/lib/db/client"

export type HomeworkAssessmentSummary = {
  gradedCount: number
  totalMarks: number
  totalMaxMarks: number
  averagePercent: number | null
}

// Phase 10 groundwork for the "Term Assessment Integration" requirement.
//
// The existing exam/result architecture (Exam -> ExamSchedule -> ExamMark,
// see src/lib/results/get-results.ts) has no concept of a weighted
// continuous-assessment component, and no school-wide policy for how much
// homework should count toward a term result. Inventing one here would be
// exactly the "invent a school-wide weighting rule" this phase is told not
// to do.
//
// So this function only aggregates a student's own graded homework marks
// for one subject/academic year - the raw material a future weighting
// feature would need - and does NOT write into ExamMark or any result
// table, and is NOT called from the existing result calculation path. A
// later phase that adds an actual weighting configuration (e.g. "homework
// counts for 30% of the term grade") should read from this, not duplicate
// its query.
export async function getStudentHomeworkAssessmentSummary(args: {
  schoolId: string
  studentId: string
  subjectId: string
  academicYearId: string
}): Promise<HomeworkAssessmentSummary> {
  const submissions = await prisma.homeworkSubmission.findMany({
    where: {
      schoolId: args.schoolId,
      studentId: args.studentId,
      status: "REVIEWED",
      marks: { not: null },
      homework: {
        subjectId: args.subjectId,
        academicYearId: args.academicYearId,
        maxMarks: { not: null },
      },
    },
    select: {
      marks: true,
      homework: { select: { maxMarks: true } },
    },
  })

  let totalMarks = 0
  let totalMaxMarks = 0

  for (const submission of submissions) {
    // Both are guaranteed non-null by the where clause above.
    totalMarks += Number(submission.marks)
    totalMaxMarks += submission.homework.maxMarks as number
  }

  return {
    gradedCount: submissions.length,
    totalMarks,
    totalMaxMarks,
    averagePercent: totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 1000) / 10 : null,
  }
}
