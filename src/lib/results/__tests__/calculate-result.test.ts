import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  findGradeForMarks,
  calculatePercentage,
  calculateSubjectResult,
  calculateOverallResult,
  rangesOverlap,
  calculateStudentExamResult,
  type GradeLookupRule,
  type ScheduleInput,
  type MarkInput,
} from "../calculate-result"

const SAMPLE_GRADE_RULES: GradeLookupRule[] = [
  {
    id: "rule-f",
    minPercentage: 0,
    maxPercentage: 39.99,
    minPercentageScaled: 0,
    maxPercentageScaled: 3999,
    grade: "F",
    gradeBn: "এফ",
    gradePoint: 0.0,
  },
  {
    id: "rule-b",
    minPercentage: 40,
    maxPercentage: 59.99,
    minPercentageScaled: 4000,
    maxPercentageScaled: 5999,
    grade: "B",
    gradeBn: "বি",
    gradePoint: 3.0,
  },
  {
    id: "rule-a",
    minPercentage: 60,
    maxPercentage: 79.99,
    minPercentageScaled: 6000,
    maxPercentageScaled: 7999,
    grade: "A",
    gradeBn: "এ",
    gradePoint: 4.0,
  },
  {
    id: "rule-aplus",
    minPercentage: 80,
    maxPercentage: 100,
    minPercentageScaled: 8000,
    maxPercentageScaled: 10000,
    grade: "A+",
    gradeBn: "এ+",
    gradePoint: 5.0,
  },
]

describe("calculate-result: findGradeForMarks", () => {
  it("matches grade exactly at the lower boundary (40.00% -> B)", () => {
    const rule = findGradeForMarks(40, 100, SAMPLE_GRADE_RULES)
    assert.equal(rule?.grade, "B")
    assert.equal(rule?.gradePoint, 3.0)
  })

  it("matches grade exactly at the upper boundary (59.99% -> B)", () => {
    // 59.99 out of 100 => scaled = 59.99 * 10000 = 599900
    // rule maxPercentageScaled * fullMarks = 5999 * 100 = 599900
    const rule = findGradeForMarks(59.99, 100, SAMPLE_GRADE_RULES)
    assert.equal(rule?.grade, "B")
  })

  it("matches next band threshold at exactly 60.00% -> A", () => {
    const rule = findGradeForMarks(60, 100, SAMPLE_GRADE_RULES)
    assert.equal(rule?.grade, "A")
    assert.equal(rule?.gradePoint, 4.0)
  })

  it("matches highest band (A+) for perfect and near-perfect marks", () => {
    assert.equal(findGradeForMarks(80, 100, SAMPLE_GRADE_RULES)?.grade, "A+")
    assert.equal(findGradeForMarks(100, 100, SAMPLE_GRADE_RULES)?.grade, "A+")
  })

  it("handles non-100 full marks without float rounding misfires", () => {
    // 40 out of 50 = 80% -> A+
    assert.equal(findGradeForMarks(40, 50, SAMPLE_GRADE_RULES)?.grade, "A+")
    // 19.5 out of 50 = 39% -> F
    assert.equal(findGradeForMarks(19.5, 50, SAMPLE_GRADE_RULES)?.grade, "F")
    // 20 out of 50 = 40% -> B
    assert.equal(findGradeForMarks(20, 50, SAMPLE_GRADE_RULES)?.grade, "B")
  })

  it("returns null when fullMarks is 0 or negative", () => {
    assert.equal(findGradeForMarks(50, 0, SAMPLE_GRADE_RULES), null)
    assert.equal(findGradeForMarks(50, -10, SAMPLE_GRADE_RULES), null)
  })

  it("returns null when marks fall outside any defined rules", () => {
    assert.equal(findGradeForMarks(105, 100, SAMPLE_GRADE_RULES), null)
  })
})

describe("calculate-result: calculatePercentage", () => {
  it("calculates percentage rounded to two decimal places", () => {
    assert.equal(calculatePercentage(85, 100), 85)
    assert.equal(calculatePercentage(1, 3), 33.33)
    assert.equal(calculatePercentage(2, 3), 66.67)
  })

  it("returns null when fullMarks is <= 0", () => {
    assert.equal(calculatePercentage(50, 0), null)
    assert.equal(calculatePercentage(50, -5), null)
  })
})

describe("calculate-result: calculateSubjectResult", () => {
  const schedule: ScheduleInput = {
    scheduleId: "sch-1",
    subjectId: "sub-math",
    subjectName: "Mathematics",
    fullMarks: 100,
    passMarks: 40,
  }

  it("calculates a passing subject result", () => {
    const mark: MarkInput = { marks: 85, isAbsent: false }
    const result = calculateSubjectResult(schedule, mark, SAMPLE_GRADE_RULES)

    assert.equal(result.status, "PASS")
    assert.equal(result.marks, 85)
    assert.equal(result.percentage, 85)
    assert.equal(result.grade, "A+")
    assert.equal(result.gradePoint, 5.0)
    assert.equal(result.isAbsent, false)
  })

  it("calculates a failing subject result when marks < passMarks", () => {
    const mark: MarkInput = { marks: 35, isAbsent: false }
    const result = calculateSubjectResult(schedule, mark, SAMPLE_GRADE_RULES)

    assert.equal(result.status, "FAIL")
    assert.equal(result.marks, 35)
    assert.equal(result.percentage, 35)
    assert.equal(result.grade, "F")
    assert.equal(result.gradePoint, 0.0)
  })

  it("handles absent status correctly", () => {
    const mark: MarkInput = { marks: null, isAbsent: true }
    const result = calculateSubjectResult(schedule, mark, SAMPLE_GRADE_RULES)

    assert.equal(result.status, "ABSENT")
    assert.equal(result.isAbsent, true)
    assert.equal(result.marks, null)
    assert.equal(result.grade, null)
    assert.equal(result.gradePoint, null)
  })

  it("handles pending/missing marks", () => {
    const result = calculateSubjectResult(schedule, null, SAMPLE_GRADE_RULES)

    assert.equal(result.status, "PENDING")
    assert.equal(result.marks, null)
    assert.equal(result.isAbsent, false)
    assert.equal(result.grade, null)
  })
})

describe("calculate-result: calculateOverallResult", () => {
  const mathSchedule: ScheduleInput = {
    scheduleId: "s1",
    subjectId: "sub-1",
    subjectName: "Math",
    fullMarks: 100,
    passMarks: 40,
  }
  const englishSchedule: ScheduleInput = {
    scheduleId: "s2",
    subjectId: "sub-2",
    subjectName: "English",
    fullMarks: 100,
    passMarks: 40,
  }

  it("returns PASS with averaged GPA when all subjects pass", () => {
    const subjects = [
      calculateSubjectResult(mathSchedule, { marks: 80, isAbsent: false }, SAMPLE_GRADE_RULES), // A+, 5.0
      calculateSubjectResult(englishSchedule, { marks: 60, isAbsent: false }, SAMPLE_GRADE_RULES), // A, 4.0
    ]
    const overall = calculateOverallResult(subjects, true)

    assert.equal(overall.isComplete, true)
    assert.equal(overall.overallStatus, "PASS")
    assert.equal(overall.totalFullMarks, 200)
    assert.equal(overall.totalObtainedMarks, 140)
    assert.equal(overall.overallPercentage, 70)
    assert.equal(overall.gpa, 4.5) // (5.0 + 4.0) / 2
  })

  it("returns FAIL if any subject fails", () => {
    const subjects = [
      calculateSubjectResult(mathSchedule, { marks: 80, isAbsent: false }, SAMPLE_GRADE_RULES), // A+, 5.0
      calculateSubjectResult(englishSchedule, { marks: 30, isAbsent: false }, SAMPLE_GRADE_RULES), // F, 0.0
    ]
    const overall = calculateOverallResult(subjects, true)

    assert.equal(overall.isComplete, true)
    assert.equal(overall.overallStatus, "FAIL")
    assert.equal(overall.gpa, 2.5) // (5.0 + 0.0) / 2
  })

  it("returns FAIL and excludes absent subject from GPA denominator", () => {
    const subjects = [
      calculateSubjectResult(mathSchedule, { marks: 80, isAbsent: false }, SAMPLE_GRADE_RULES), // A+, 5.0
      calculateSubjectResult(englishSchedule, { marks: null, isAbsent: true }, SAMPLE_GRADE_RULES), // ABSENT
    ]
    const overall = calculateOverallResult(subjects, true)

    assert.equal(overall.isComplete, true)
    assert.equal(overall.overallStatus, "FAIL")
    assert.equal(overall.gpa, 5.0) // only graded subjects: 5.0 / 1
    assert.equal(overall.totalObtainedMarks, 80)
  })

  it("returns INCOMPLETE when any subject marks are pending", () => {
    const subjects = [
      calculateSubjectResult(mathSchedule, { marks: 80, isAbsent: false }, SAMPLE_GRADE_RULES),
      calculateSubjectResult(englishSchedule, null, SAMPLE_GRADE_RULES), // PENDING
    ]
    const overall = calculateOverallResult(subjects, true)

    assert.equal(overall.isComplete, false)
    assert.equal(overall.overallStatus, "INCOMPLETE")
    assert.equal(overall.overallPercentage, null)
    assert.equal(overall.gpa, null)
  })

  it("returns NO_RESULT for empty subject list", () => {
    const overall = calculateOverallResult([], true)
    assert.equal(overall.overallStatus, "NO_RESULT")
    assert.equal(overall.isComplete, false)
    assert.equal(overall.gpa, null)
  })

  it("returns null GPA when hasGradingScale is false", () => {
    const subjects = [
      calculateSubjectResult(mathSchedule, { marks: 80, isAbsent: false }, []),
    ]
    const overall = calculateOverallResult(subjects, false)
    assert.equal(overall.gpa, null)
    assert.equal(overall.hasGradingScale, false)
  })
})

describe("calculate-result: rangesOverlap", () => {
  it("detects overlapping ranges", () => {
    assert.equal(rangesOverlap({ minPercentage: 0, maxPercentage: 50 }, { minPercentage: 40, maxPercentage: 70 }), true)
    assert.equal(rangesOverlap({ minPercentage: 50, maxPercentage: 80 }, { minPercentage: 60, maxPercentage: 70 }), true)
  })

  it("identifies contiguous non-overlapping ranges as false", () => {
    assert.equal(rangesOverlap({ minPercentage: 0, maxPercentage: 49.99 }, { minPercentage: 50, maxPercentage: 100 }), false)
    assert.equal(rangesOverlap({ minPercentage: 70, maxPercentage: 79.99 }, { minPercentage: 80, maxPercentage: 89.99 }), false)
  })

  it("identifies completely disjoint ranges as false", () => {
    assert.equal(rangesOverlap({ minPercentage: 0, maxPercentage: 30 }, { minPercentage: 60, maxPercentage: 90 }), false)
  })
})

describe("calculate-result: calculateStudentExamResult", () => {
  it("computes complete exam result for a student across multiple schedules", () => {
    const schedules: ScheduleInput[] = [
      { scheduleId: "s1", subjectId: "sub-1", subjectName: "Bangla", fullMarks: 100, passMarks: 40 },
      { scheduleId: "s2", subjectId: "sub-2", subjectName: "English", fullMarks: 100, passMarks: 40 },
    ]
    const marks = new Map<string, MarkInput>([
      ["s1", { marks: 75, isAbsent: false }],
      ["s2", { marks: 85, isAbsent: false }],
    ])

    const result = calculateStudentExamResult("student-123", schedules, marks, SAMPLE_GRADE_RULES)

    assert.equal(result.studentId, "student-123")
    assert.equal(result.overallStatus, "PASS")
    assert.equal(result.totalFullMarks, 200)
    assert.equal(result.totalObtainedMarks, 160)
    assert.equal(result.overallPercentage, 80)
    assert.equal(result.gpa, 4.5)
    assert.equal(result.subjects.length, 2)
  })
})
