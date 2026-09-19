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
  // Phase 12: the portion of fullMarks sourced from homework instead of a
  // typed exam mark. Null/0 means this subject has no homework component -
  // every existing schedule, and the only case this file's callers had to
  // handle before this phase.
  homeworkMaxMarks: number | null
}

export type MarkInput = {
  marks: number | null
  isAbsent: boolean
  // The homework contribution already scaled into this schedule's
  // homeworkMaxMarks allotment - live-computed while the exam is DRAFT, or
  // the frozen finalization-time snapshot once FINALIZED. Null means "not
  // available yet" (no reviewed homework), not zero - see resolveTotalMarks.
  homeworkMarks: number | null
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
  // Phase 12 breakdown - only meaningful when homeworkMaxMarks is set. marks
  // above is always the total (written + homework) so existing percentage/
  // grade/GPA consumers need no changes.
  homeworkMaxMarks: number | null
  writtenMarks: number | null
  homeworkMarks: number | null
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

// Whether this schedule actually has a homework component - centralized so
// "null" and "0" are always treated identically everywhere below.
function hasHomeworkComponent(homeworkMaxMarks: number | null): boolean {
  return homeworkMaxMarks !== null && homeworkMaxMarks > 0
}

// The written exam mark plus its homework contribution, or null if either
// piece isn't available yet. A schedule with no homework component ignores
// homeworkMarks entirely, so this is exactly `mark.marks` for every schedule
// that predates this phase - zero behavior change for them.
function resolveTotalMarks(mark: MarkInput, homeworkMaxMarks: number | null): number | null {
  if (!mark || mark.marks === null) return null
  if (!hasHomeworkComponent(homeworkMaxMarks)) return mark.marks
  if (mark.homeworkMarks === null) return null
  return mark.marks + mark.homeworkMarks
}

function calculateSubjectStatus(mark: MarkInput, passMarks: number, homeworkMaxMarks: number | null): SubjectStatus {
  if (!mark) return "PENDING"
  if (mark.isAbsent) return "ABSENT"
  const total = resolveTotalMarks(mark, homeworkMaxMarks)
  if (total === null) return "PENDING"
  return total >= passMarks ? "PASS" : "FAIL"
}

export function calculateSubjectResult(
  schedule: ScheduleInput,
  mark: MarkInput,
  gradeRules: GradeLookupRule[]
): SubjectResult {
  const status = calculateSubjectStatus(mark, schedule.passMarks, schedule.homeworkMaxMarks)
  const hasNumericMarks = status === "PASS" || status === "FAIL"
  const marksValue = hasNumericMarks ? resolveTotalMarks(mark, schedule.homeworkMaxMarks) : null

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
    homeworkMaxMarks: schedule.homeworkMaxMarks,
    writtenMarks: hasNumericMarks ? mark!.marks : null,
    homeworkMarks: hasNumericMarks && hasHomeworkComponent(schedule.homeworkMaxMarks) ? mark!.homeworkMarks : null,
  }
}

// Scales a student's aggregate homework performance (raw totalMarks out of
// totalMaxMarks, summed across every reviewed homework for one subject in
// one academic year - see getHomeworkAssessmentSummaries) into one
// ExamSchedule's own homeworkMaxMarks allotment. Rounded to 2 decimal
// places, the same granularity ExamMark.homeworkMarks and
// HomeworkSubmission.marks are already stored at - not a new rounding
// convention, and never used for grade-boundary comparison (findGradeForMarks
// still does that in exact integer arithmetic against the resulting total).
export function scaleHomeworkContribution(
  totalMarks: number,
  totalMaxMarks: number,
  homeworkMaxMarks: number
): number | null {
  if (totalMaxMarks <= 0) return null
  return Math.round((totalMarks / totalMaxMarks) * homeworkMaxMarks * 100) / 100
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

// Used by GradeRule create/edit validation (not by grade matching) to
// reject overlapping bands within the same GradingScale. Inputs here are
// raw form numbers (already constrained to 2 decimal places by the Zod
// schema), so a single Math.round(x * 100) round-trip to basis points is
// safe - this is a different concern from findGradeForMarks, which must
// never round at all because it is comparing values already stored exactly.
export function rangesOverlap(
  a: { minPercentage: number; maxPercentage: number },
  b: { minPercentage: number; maxPercentage: number }
): boolean {
  const aMin = Math.round(a.minPercentage * 100)
  const aMax = Math.round(a.maxPercentage * 100)
  const bMin = Math.round(b.minPercentage * 100)
  const bMax = Math.round(b.maxPercentage * 100)
  return aMin <= bMax && bMin <= aMax
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
