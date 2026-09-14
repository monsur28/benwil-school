// The single source of truth for turning raw ExamMark rows into grades,
// subject results, and an overall result/GPA. Pure and DB-free on purpose
// (see src/lib/results/get-results.ts for the Prisma-querying orchestration
// that feeds this) so every caller - the result list, the student result
// page, the report card, the student profile tab - computes results the
// exact same way.

export type SubjectStatus = "PASS" | "FAIL" | "ABSENT" | "PENDING"
export type OverallStatus = "PASS" | "FAIL" | "INCOMPLETE" | "NO_RESULT"

// Percentages/points already converted from Prisma's Decimal to plain
// numbers *for display*. minPercentageScaled/maxPercentageScaled are the
// exact integer "basis points" (percentage * 100) used for grade matching -
// see findGradeForMarks for why this avoids floating-point boundary bugs.
export type GradeLookupRule = {
  id: string
  minPercentage: number
  maxPercentage: number
  minPercentageScaled: number
  maxPercentageScaled: number
  grade: string
  gradeBn: string | null
  gradePoint: number
}

export type ScheduleInput = {
  scheduleId: string
  subjectId: string
  subjectName: string
  fullMarks: number
  passMarks: number
}

export type MarkInput = {
  marks: number | null
  isAbsent: boolean
} | null

export type SubjectResult = {
  scheduleId: string
  subjectId: string
  subjectName: string
  fullMarks: number
  passMarks: number
  marks: number | null
  isAbsent: boolean
  percentage: number | null
  grade: string | null
  gradeBn: string | null
  gradePoint: number | null
  status: SubjectStatus
}

export type StudentExamResult = {
  studentId: string
  subjects: SubjectResult[]
  totalFullMarks: number
  totalObtainedMarks: number
  overallPercentage: number | null
  gpa: number | null
  overallStatus: OverallStatus
  isComplete: boolean
  hasGradingScale: boolean
}

// Finds the GradeRule whose [min, max] band contains marks/fullMarks*100,
// entirely in integer arithmetic - never computing the percentage as a
// floating-point division. Comparing a float percentage against float
// boundaries can misfire at exact boundaries (e.g. 33/100*100 is not
// guaranteed to equal exactly 33 in IEEE-754), which would make grade
// selection non-deterministic right where it matters most. Cross-
// multiplying instead keeps every value an exact integer:
//   minScaled <= marks*10000/fullMarks <= maxScaled
//     <=>  minScaled*fullMarks <= marks*10000 <= maxScaled*fullMarks
export function findGradeForMarks(
  marks: number,
  fullMarks: number,
  rules: GradeLookupRule[]
): GradeLookupRule | null {
  if (fullMarks <= 0) return null
  const scaledMarks = marks * 10000
  for (const rule of rules) {
    if (scaledMarks >= rule.minPercentageScaled * fullMarks && scaledMarks <= rule.maxPercentageScaled * fullMarks) {
      return rule
    }
  }
  return null
}

// Display-only percentage (rounded to 2 decimals). Never used for grade
// matching - see findGradeForMarks.
export function calculatePercentage(marks: number, fullMarks: number): number | null {
  if (fullMarks <= 0) return null
  return Math.round((marks / fullMarks) * 10000) / 100
}

function calculateSubjectStatus(mark: MarkInput, passMarks: number): SubjectStatus {
  if (!mark) return "PENDING"
  if (mark.isAbsent) return "ABSENT"
  if (mark.marks === null) return "PENDING"
  return mark.marks >= passMarks ? "PASS" : "FAIL"
}

export function calculateSubjectResult(
  schedule: ScheduleInput,
  mark: MarkInput,
  gradeRules: GradeLookupRule[]
): SubjectResult {
  const status = calculateSubjectStatus(mark, schedule.passMarks)
  const hasNumericMarks = status === "PASS" || status === "FAIL"
  const marksValue = hasNumericMarks ? mark!.marks! : null

  const percentage = hasNumericMarks ? calculatePercentage(marksValue!, schedule.fullMarks) : null
  const matchedRule = hasNumericMarks ? findGradeForMarks(marksValue!, schedule.fullMarks, gradeRules) : null

  return {
    scheduleId: schedule.scheduleId,
    subjectId: schedule.subjectId,
    subjectName: schedule.subjectName,
    fullMarks: schedule.fullMarks,
    passMarks: schedule.passMarks,
    marks: marksValue,
    isAbsent: status === "ABSENT",
    percentage,
    grade: matchedRule?.grade ?? null,
    gradeBn: matchedRule?.gradeBn ?? null,
    gradePoint: matchedRule?.gradePoint ?? null,
    status,
  }
}

// Overall rules, deliberately simple and explicit (see AGENTS notes in the
// Phase 6 spec): a PENDING subject makes the whole result INCOMPLETE - never
// show a final Pass/Fail while marks are still outstanding. Once complete,
// an ABSENT or FAILed subject makes the overall result FAIL (you cannot
// pass a subject you did not sit, and Phase 6 does not implement a
// compensation/carry rule). GPA only ever averages PASS/FAIL subjects
// (graded, present subjects) - absent subjects are excluded from both the
// numerator and denominator, and GPA is null whenever the result isn't
// complete or no active grading scale exists.
export function calculateOverallResult(
  subjects: SubjectResult[],
  hasGradingScale: boolean
): Omit<StudentExamResult, "studentId" | "subjects" | "hasGradingScale"> & { hasGradingScale: boolean } {
  if (subjects.length === 0) {
    return {
      totalFullMarks: 0,
      totalObtainedMarks: 0,
      overallPercentage: null,
      gpa: null,
      overallStatus: "NO_RESULT",
      isComplete: false,
      hasGradingScale,
    }
  }

  const isComplete = subjects.every((subject) => subject.status !== "PENDING")
  const totalFullMarks = subjects.reduce((sum, subject) => sum + subject.fullMarks, 0)
  const totalObtainedMarks = subjects.reduce((sum, subject) => sum + (subject.marks ?? 0), 0)

  const overallPercentage =
    isComplete && totalFullMarks > 0 ? calculatePercentage(totalObtainedMarks, totalFullMarks) : null

  const gradedSubjects = subjects.filter((subject) => subject.status === "PASS" || subject.status === "FAIL")
  const gpa =
    isComplete && hasGradingScale && gradedSubjects.length > 0
      ? Math.round(
          (gradedSubjects.reduce((sum, subject) => sum + (subject.gradePoint ?? 0), 0) / gradedSubjects.length) * 100
        ) / 100
      : null

  let overallStatus: OverallStatus
  if (!isComplete) {
    overallStatus = "INCOMPLETE"
  } else if (subjects.some((subject) => subject.status === "FAIL" || subject.status === "ABSENT")) {
    overallStatus = "FAIL"
  } else {
    overallStatus = "PASS"
  }

  return { totalFullMarks, totalObtainedMarks, overallPercentage, gpa, overallStatus, isComplete, hasGradingScale }
}

export function calculateStudentExamResult(
  studentId: string,
  schedules: ScheduleInput[],
  marksByScheduleId: Map<string, MarkInput>,
  gradeRules: GradeLookupRule[]
): StudentExamResult {
  const subjects = schedules.map((schedule) =>
    calculateSubjectResult(schedule, marksByScheduleId.get(schedule.scheduleId) ?? null, gradeRules)
  )
  const overall = calculateOverallResult(subjects, gradeRules.length > 0)
  return { studentId, subjects, ...overall }
}
