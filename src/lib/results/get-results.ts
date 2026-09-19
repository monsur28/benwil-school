import "server-only"
import { prisma } from "@/lib/db/client"
import {
  calculateStudentExamResult,
  findGradeForMarks,
  scaleHomeworkContribution,
  type GradeLookupRule,
  type MarkInput,
  type OverallStatus,
  type ScheduleInput,
  type StudentExamResult,
} from "@/lib/results/calculate-result"
import { getHomeworkAssessmentSummaries } from "@/lib/homework/homework-assessment-summary"

type ScheduleMeta = {
  scheduleId: string
  subjectId: string
  classId: string
  homeworkMaxMarks: number | null
}

type RawExamMark = {
  studentId: string
  examScheduleId: string
  marks: number | null
  isAbsent: boolean
  homeworkMarks: { toNumber(): number } | null
}

// The single place that turns raw ExamMark rows + (for homework-enabled
// schedules) reviewed HomeworkSubmission rows into the MarkInput map
// calculate-result.ts consumes - shared by every call site below so DRAFT
// vs FINALIZED homework sourcing is decided in exactly one place.
//
// DRAFT: homework contribution is computed live from HomeworkSubmission on
// every read, so a teacher grading homework mid-term sees an up-to-date
// preview (spec Phase 12 §14).
// FINALIZED: the contribution is read from ExamMark.homeworkMarks, frozen at
// finalization time - a later homework mark edit must never silently change
// an already-finalized result (spec Phase 12 §13/§57).
async function buildMarksByStudentId(params: {
  schoolId: string
  academicYearId: string
  resultStatus: "DRAFT" | "FINALIZED"
  schedules: ScheduleMeta[]
  examMarks: RawExamMark[]
  studentIds: string[]
}): Promise<Map<string, Map<string, MarkInput>>> {
  const { schoolId, academicYearId, resultStatus, schedules, examMarks, studentIds } = params

  const rawByKey = new Map<string, RawExamMark>()
  for (const mark of examMarks) {
    rawByKey.set(`${mark.studentId}:${mark.examScheduleId}`, mark)
  }

  const liveContribution = new Map<string, Map<string, number | null>>()
  if (resultStatus === "DRAFT") {
    for (const schedule of schedules) {
      if (!schedule.homeworkMaxMarks || schedule.homeworkMaxMarks <= 0) continue
      const summaries = await getHomeworkAssessmentSummaries({
        schoolId,
        studentIds,
        classId: schedule.classId,
        subjectId: schedule.subjectId,
        academicYearId,
      })
      const perStudent = new Map<string, number | null>()
      for (const studentId of studentIds) {
        const summary = summaries.get(studentId)
        perStudent.set(
          studentId,
          summary
            ? scaleHomeworkContribution(summary.totalMarks, summary.totalMaxMarks, schedule.homeworkMaxMarks)
            : null
        )
      }
      liveContribution.set(schedule.scheduleId, perStudent)
    }
  }

  const result = new Map<string, Map<string, MarkInput>>()
  for (const studentId of studentIds) {
    const perSchedule = new Map<string, MarkInput>()
    for (const schedule of schedules) {
      const raw = rawByKey.get(`${studentId}:${schedule.scheduleId}`)
      const hasHomework = Boolean(schedule.homeworkMaxMarks && schedule.homeworkMaxMarks > 0)
      const homeworkMarks = !hasHomework
        ? null
        : resultStatus === "FINALIZED"
          ? raw?.homeworkMarks?.toNumber() ?? null
          : liveContribution.get(schedule.scheduleId)?.get(studentId) ?? null
      perSchedule.set(schedule.scheduleId, raw ? { marks: raw.marks, isAbsent: raw.isAbsent, homeworkMarks } : null)
    }
    result.set(studentId, perSchedule)
  }
  return result
}

// Converts a school's active GradingScale + GradeRule rows into the plain-
// number lookup shape calculate-result.ts operates on. One query, reused by
// every page below - never re-fetched per student (that would be the N+1
// the Phase 6 spec explicitly warns against).
export async function getActiveGradeRules(schoolId: string): Promise<GradeLookupRule[]> {
  const scale = await prisma.gradingScale.findFirst({
    where: { schoolId, isActive: true },
    include: { gradeRules: true },
  })
  if (!scale) return []

  return scale.gradeRules
    .map((rule) => ({
      id: rule.id,
      minPercentage: rule.minPercentage.toNumber(),
      maxPercentage: rule.maxPercentage.toNumber(),
      // .times(100) is exact Decimal arithmetic (not JS float) - see
      // findGradeForMarks for why this matters.
      minPercentageScaled: rule.minPercentage.times(100).toNumber(),
      maxPercentageScaled: rule.maxPercentage.times(100).toNumber(),
      grade: rule.grade,
      gradeBn: rule.gradeBn,
      gradePoint: rule.gradePoint.toNumber(),
    }))
    .sort((a, b) => a.minPercentageScaled - b.minPercentageScaled)
}

// Resolves the grade rules to use for an exam. If the exam is FINALIZED and
// has a persisted rules snapshot, returns the snapshot to guarantee historical
// integrity. Otherwise, falls back to the school's currently active grading scale.
export function parseGradeRulesSnapshot(snapshot: unknown): GradeLookupRule[] | null {
  if (!snapshot || !Array.isArray(snapshot) || snapshot.length === 0) return null
  return snapshot as GradeLookupRule[]
}

export async function resolveGradeRulesForExam(
  schoolId: string,
  exam: { resultStatus: "DRAFT" | "FINALIZED"; gradingRulesSnapshot?: unknown } | null
): Promise<GradeLookupRule[]> {
  if (exam?.resultStatus === "FINALIZED") {
    const rules = parseGradeRulesSnapshot(exam.gradingRulesSnapshot)
    if (rules) return rules
  }
  return getActiveGradeRules(schoolId)
}

export type ClassSectionResultsRow = StudentExamResult & {
  name: string
  studentUid: string
  admissionNumber: string
  roll: number
}

export type ClassSectionResults = {
  schedules: ScheduleInput[]
  rows: ClassSectionResultsRow[]
  isComplete: boolean
}

// Batched: one schedules query, one students query, one marks query (across
// every student+schedule at once) regardless of how many students are in
// the section - never one query per student.
export async function getClassSectionResults(params: {
  schoolId: string
  examId: string
  classId: string
  sectionId: string
  academicYearId: string
}): Promise<ClassSectionResults> {
  const { schoolId, examId, classId, sectionId, academicYearId } = params

  const [exam, scheduleRows, students] = await Promise.all([
    prisma.exam.findFirst({
      where: { id: examId, schoolId },
      select: { resultStatus: true, gradingRulesSnapshot: true },
    }),
    prisma.examSchedule.findMany({
      where: { examId, classId, schoolId },
      include: { subject: true },
      orderBy: { subject: { name: "asc" } },
    }),
    prisma.student.findMany({
      where: { schoolId, classId, sectionId, academicYearId, status: "ACTIVE" },
      orderBy: { roll: "asc" },
    }),
  ])

  const gradeRules = await resolveGradeRulesForExam(schoolId, exam)

  const schedules: ScheduleInput[] = scheduleRows.map((schedule) => ({
    scheduleId: schedule.id,
    subjectId: schedule.subjectId,
    subjectName: schedule.subject.name,
    fullMarks: schedule.fullMarks,
    passMarks: schedule.passMarks,
    homeworkMaxMarks: schedule.homeworkMaxMarks,
  }))

  const marks = await prisma.examMark.findMany({
    where: {
      examScheduleId: { in: schedules.map((schedule) => schedule.scheduleId) },
      studentId: { in: students.map((student) => student.id) },
    },
  })

  const marksByStudentId = await buildMarksByStudentId({
    schoolId,
    academicYearId,
    resultStatus: exam?.resultStatus ?? "DRAFT",
    schedules: scheduleRows.map((schedule) => ({
      scheduleId: schedule.id,
      subjectId: schedule.subjectId,
      classId,
      homeworkMaxMarks: schedule.homeworkMaxMarks,
    })),
    examMarks: marks,
    studentIds: students.map((student) => student.id),
  })

  const rows: ClassSectionResultsRow[] = students.map((student) => {
    const result = calculateStudentExamResult(
      student.id,
      schedules,
      marksByStudentId.get(student.id) ?? new Map(),
      gradeRules
    )
    return {
      ...result,
      name: student.name,
      studentUid: student.studentUid,
      admissionNumber: student.admissionNumber,
      roll: student.roll,
    }
  })

  return {
    schedules,
    rows,
    isComplete: rows.length > 0 && rows.every((row) => row.isComplete),
  }
}

export type ExamClassRow = {
  examId: string
  examName: string
  examTypeName: string
  academicYearId: string
  academicYearName: string
  resultStatus: "DRAFT" | "FINALIZED"
  classId: string
  className: string
  isComplete: boolean
}

// Lightweight: three COUNT queries per (exam, class) row rather than
// fetching every student's full result just to know if it's complete -
// used by the /results overview, which only needs a Complete/Incomplete
// badge, not the actual grades.
async function getExamClassCompletion(
  examId: string,
  classId: string,
  schoolId: string,
  academicYearId: string
): Promise<boolean> {
  const [scheduleCount, studentCount, markCount] = await Promise.all([
    prisma.examSchedule.count({ where: { examId, classId, schoolId } }),
    prisma.student.count({ where: { schoolId, classId, academicYearId, status: "ACTIVE" } }),
    prisma.examMark.count({
      where: { examSchedule: { examId, classId, schoolId }, student: { academicYearId, status: "ACTIVE" } },
    }),
  ])
  return scheduleCount > 0 && studentCount > 0 && markCount >= scheduleCount * studentCount
}

// Every (exam, class) pair that has at least one scheduled subject, scoped
// to the school and optionally narrowed to a specific set of classIds (used
// to restrict a TEACHER's view to only the classes they're assigned to).
export async function getResultOverviewRows(params: {
  schoolId: string
  academicYearId?: string
  examId?: string
  classId?: string
  restrictToClassIds?: string[]
}): Promise<ExamClassRow[]> {
  const { schoolId, academicYearId, examId, classId, restrictToClassIds } = params

  if (restrictToClassIds && restrictToClassIds.length === 0) {
    return []
  }

  const schedules = await prisma.examSchedule.findMany({
    where: {
      schoolId,
      ...(examId ? { examId } : {}),
      ...(classId ? { classId } : {}),
      ...(restrictToClassIds ? { classId: { in: restrictToClassIds } } : {}),
      exam: academicYearId ? { academicYearId } : undefined,
    },
    select: {
      examId: true,
      classId: true,
      exam: { select: { name: true, academicYearId: true, resultStatus: true, examType: { select: { name: true } }, academicYear: { select: { name: true } } } },
      class: { select: { name: true } },
    },
    distinct: ["examId", "classId"],
  })

  const rows = await Promise.all(
    schedules.map(async (schedule) => ({
      examId: schedule.examId,
      examName: schedule.exam.name,
      examTypeName: schedule.exam.examType.name,
      academicYearId: schedule.exam.academicYearId,
      academicYearName: schedule.exam.academicYear.name,
      resultStatus: schedule.exam.resultStatus,
      classId: schedule.classId,
      className: schedule.class.name,
      isComplete: await getExamClassCompletion(schedule.examId, schedule.classId, schoolId, schedule.exam.academicYearId),
    }))
  )

  return rows.sort((a, b) => a.examName.localeCompare(b.examName) || a.className.localeCompare(b.className))
}

export type StudentExamResultSummary = {
  examId: string
  examName: string
  examTypeName: string
  academicYearName: string
  startDate: Date
  resultStatus: "DRAFT" | "FINALIZED"
  overallPercentage: number | null
  gpa: number | null
  overallStatus: OverallStatus
  isComplete: boolean
}

// Lean, batched summary for the student profile's Results tab - exactly
// three queries total (schedules+exam+academicYear via include, active
// grade rules, marks) no matter how many exams the student's class has
// been scheduled for, since the profile page must stay light per the
// Phase 6 spec ("only load the data needed for the summary").
//
// `finalizedOnly` is used by the student/guardian portal, which must never
// show a DRAFT result (Phase 7 spec) - admin/teacher callers leave it
// unset and keep seeing every exam, draft included.
export async function getStudentResultSummaries(params: {
  schoolId: string
  studentId: string
  classId: string
  finalizedOnly?: boolean
}): Promise<StudentExamResultSummary[]> {
  const { schoolId, studentId, classId, finalizedOnly = false } = params

  const [schedules, activeGradeRules] = await Promise.all([
    prisma.examSchedule.findMany({
      where: { schoolId, classId, ...(finalizedOnly ? { exam: { resultStatus: "FINALIZED" } } : {}) },
      include: { subject: true, exam: { include: { academicYear: true, examType: true } } },
    }),
    getActiveGradeRules(schoolId),
  ])
  if (schedules.length === 0) return []

  const marks = await prisma.examMark.findMany({
    where: { studentId, examScheduleId: { in: schedules.map((schedule) => schedule.id) } },
  })
  const rawMarksByScheduleId = new Map(marks.map((mark) => [mark.examScheduleId, mark]))

  const schedulesByExam = new Map<string, typeof schedules>()
  for (const schedule of schedules) {
    const list = schedulesByExam.get(schedule.examId)
    if (list) {
      list.push(schedule)
    } else {
      schedulesByExam.set(schedule.examId, [schedule])
    }
  }

  const summaries: StudentExamResultSummary[] = []
  for (const examSchedules of schedulesByExam.values()) {
    const exam = examSchedules[0].exam
    const examGradeRules =
      (exam.resultStatus === "FINALIZED" ? parseGradeRulesSnapshot(exam.gradingRulesSnapshot) : null) ??
      activeGradeRules

    const scheduleInputs: ScheduleInput[] = examSchedules.map((schedule) => ({
      scheduleId: schedule.id,
      subjectId: schedule.subjectId,
      subjectName: schedule.subject.name,
      fullMarks: schedule.fullMarks,
      passMarks: schedule.passMarks,
      homeworkMaxMarks: schedule.homeworkMaxMarks,
    }))
    const marksByStudentId = await buildMarksByStudentId({
      schoolId,
      academicYearId: exam.academicYearId,
      resultStatus: exam.resultStatus,
      schedules: examSchedules.map((schedule) => ({
        scheduleId: schedule.id,
        subjectId: schedule.subjectId,
        classId,
        homeworkMaxMarks: schedule.homeworkMaxMarks,
      })),
      examMarks: examSchedules
        .map((schedule) => rawMarksByScheduleId.get(schedule.id))
        .filter((mark): mark is NonNullable<typeof mark> => Boolean(mark))
        .map((mark) => ({ ...mark, studentId })),
      studentIds: [studentId],
    })
    const marksByScheduleId = marksByStudentId.get(studentId) ?? new Map()
    const result = calculateStudentExamResult(studentId, scheduleInputs, marksByScheduleId, examGradeRules)
    summaries.push({
      examId: exam.id,
      examName: exam.name,
      examTypeName: exam.examType.name,
      academicYearName: exam.academicYear.name,
      startDate: exam.startDate,
      resultStatus: exam.resultStatus,
      overallPercentage: result.overallPercentage,
      gpa: result.gpa,
      overallStatus: result.overallStatus,
      isComplete: result.isComplete,
    })
  }

  return summaries.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
}

export type StudentResultContext = {
  student: {
    id: string
    name: string
    studentUid: string
    admissionNumber: string
    roll: number
    className: string
    sectionName: string
  }
  exam: {
    id: string
    name: string
    examTypeName: string
    academicYearName: string
    resultStatus: "DRAFT" | "FINALIZED"
    gradingScaleName?: string | null
  }
  result: StudentExamResult
}

// Single-student version of the same batched approach - one schedules
// query, one marks query (not one per subject), reused by the student
// result page, the report card, and the student profile tab.
export async function getStudentExamResult(params: {
  schoolId: string
  examId: string
  studentId: string
}): Promise<StudentResultContext | null> {
  const { schoolId, examId, studentId } = params

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    include: { class: true, section: true },
  })
  if (!student) return null

  const exam = await prisma.exam.findFirst({
    where: { id: examId, schoolId },
    include: { examType: true, academicYear: true },
  })
  if (!exam) return null

  const [scheduleRows, gradeRules] = await Promise.all([
    prisma.examSchedule.findMany({
      where: { examId, classId: student.classId, schoolId },
      include: { subject: true },
      orderBy: { subject: { name: "asc" } },
    }),
    resolveGradeRulesForExam(schoolId, exam),
  ])

  const schedules: ScheduleInput[] = scheduleRows.map((schedule) => ({
    scheduleId: schedule.id,
    subjectId: schedule.subjectId,
    subjectName: schedule.subject.name,
    fullMarks: schedule.fullMarks,
    passMarks: schedule.passMarks,
    homeworkMaxMarks: schedule.homeworkMaxMarks,
  }))

  const marks = await prisma.examMark.findMany({
    where: { studentId, examScheduleId: { in: schedules.map((schedule) => schedule.scheduleId) } },
  })
  const marksByStudentId = await buildMarksByStudentId({
    schoolId,
    academicYearId: exam.academicYearId,
    resultStatus: exam.resultStatus,
    schedules: scheduleRows.map((schedule) => ({
      scheduleId: schedule.id,
      subjectId: schedule.subjectId,
      classId: student.classId,
      homeworkMaxMarks: schedule.homeworkMaxMarks,
    })),
    examMarks: marks,
    studentIds: [studentId],
  })
  const marksByScheduleId = marksByStudentId.get(studentId) ?? new Map()

  const result = calculateStudentExamResult(studentId, schedules, marksByScheduleId, gradeRules)

  return {
    student: {
      id: student.id,
      name: student.name,
      studentUid: student.studentUid,
      admissionNumber: student.admissionNumber,
      roll: student.roll,
      className: student.class.name,
      sectionName: student.section.name,
    },
    exam: {
      id: exam.id,
      name: exam.name,
      examTypeName: exam.examType.name,
      academicYearName: exam.academicYear.name,
      resultStatus: exam.resultStatus,
      gradingScaleName: exam.gradingScaleName,
    },
    result,
  }
}

export type ClassPerformanceRow = {
  className: string
  averagePercentage: number
  grade: string | null
  passBenchmark: number
  studentCount: number
}

// Real average exam performance per class, for the admin dashboard's
// Academic Performance card - the most recently finalized exam school-wide,
// averaged across every active student who has a complete result. Batched
// (one schedules query, one students query, one marks query covering every
// class at once) rather than one query per class.
export async function getClassPerformanceOverview(
  schoolId: string
): Promise<{ examName: string; rows: ClassPerformanceRow[] } | null> {
  const exam = await prisma.exam.findFirst({
    where: { schoolId, resultStatus: "FINALIZED" },
    orderBy: { startDate: "desc" },
  })
  if (!exam) return null

  const [gradeRules, scheduleRows] = await Promise.all([
    resolveGradeRulesForExam(schoolId, exam),
    prisma.examSchedule.findMany({
      where: { examId: exam.id, schoolId },
      include: { subject: true, class: true },
    }),
  ])
  if (scheduleRows.length === 0) return null

  const classIds = [...new Set(scheduleRows.map((schedule) => schedule.classId))]

  const students = await prisma.student.findMany({
    where: { schoolId, classId: { in: classIds }, status: "ACTIVE" },
    select: { id: true, classId: true },
  })

  const marks = await prisma.examMark.findMany({
    where: {
      examScheduleId: { in: scheduleRows.map((schedule) => schedule.id) },
      studentId: { in: students.map((student) => student.id) },
    },
  })

  const schedulesByClassId = new Map<string, ScheduleInput[]>()
  const classMeta = new Map<string, { name: string; order: number; passBenchmark: number }>()
  for (const schedule of scheduleRows) {
    const list = schedulesByClassId.get(schedule.classId) ?? []
    list.push({
      scheduleId: schedule.id,
      subjectId: schedule.subjectId,
      subjectName: schedule.subject.name,
      fullMarks: schedule.fullMarks,
      passMarks: schedule.passMarks,
      homeworkMaxMarks: schedule.homeworkMaxMarks,
    })
    schedulesByClassId.set(schedule.classId, list)
  }
  for (const [classId, schedules] of schedulesByClassId) {
    const classRow = scheduleRows.find((s) => s.classId === classId)!.class
    const avgPassPercent =
      schedules.reduce((sum, s) => sum + (s.passMarks / s.fullMarks) * 100, 0) / schedules.length
    classMeta.set(classId, {
      name: classRow.name,
      order: classRow.order,
      passBenchmark: Math.round(avgPassPercent),
    })
  }

  const studentIdsByClassId = new Map<string, string[]>()
  for (const student of students) {
    const list = studentIdsByClassId.get(student.classId) ?? []
    list.push(student.id)
    studentIdsByClassId.set(student.classId, list)
  }

  const ranked: { order: number; row: ClassPerformanceRow }[] = []
  for (const [classId, schedules] of schedulesByClassId) {
    const studentIds = studentIdsByClassId.get(classId) ?? []
    // FINALIZED-only query above guarantees every homework contribution
    // here is read from the frozen ExamMark.homeworkMarks snapshot, never
    // live-computed - see buildMarksByStudentId.
    const marksByStudentId = await buildMarksByStudentId({
      schoolId,
      academicYearId: exam.academicYearId,
      resultStatus: "FINALIZED",
      schedules: schedules.map((schedule) => ({
        scheduleId: schedule.scheduleId,
        subjectId: schedule.subjectId,
        classId,
        homeworkMaxMarks: schedule.homeworkMaxMarks,
      })),
      examMarks: marks.filter((mark) => studentIds.includes(mark.studentId)),
      studentIds,
    })
    const percentages: number[] = []
    for (const studentId of studentIds) {
      const result = calculateStudentExamResult(studentId, schedules, marksByStudentId.get(studentId) ?? new Map(), gradeRules)
      if (result.isComplete && result.overallPercentage !== null) {
        percentages.push(result.overallPercentage)
      }
    }
    if (percentages.length === 0) continue

    const average = Math.round((percentages.reduce((sum, p) => sum + p, 0) / percentages.length) * 10) / 10
    const meta = classMeta.get(classId)!
    const gradeRule = findGradeForMarks(average, 100, gradeRules)
    ranked.push({
      order: meta.order,
      row: {
        className: meta.name,
        averagePercentage: average,
        grade: gradeRule?.grade ?? null,
        passBenchmark: meta.passBenchmark,
        studentCount: percentages.length,
      },
    })
  }
  ranked.sort((a, b) => a.order - b.order)

  return {
    examName: exam.name,
    rows: ranked.map((entry) => entry.row),
  }
}
