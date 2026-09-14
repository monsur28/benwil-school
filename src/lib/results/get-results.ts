import "server-only"
import { prisma } from "@/lib/db/client"
import {
  calculateStudentExamResult,
  type GradeLookupRule,
  type OverallStatus,
  type ScheduleInput,
  type StudentExamResult,
} from "@/lib/results/calculate-result"

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

  const [scheduleRows, students, gradeRules] = await Promise.all([
    prisma.examSchedule.findMany({
      where: { examId, classId, schoolId },
      include: { subject: true },
      orderBy: { subject: { name: "asc" } },
    }),
    prisma.student.findMany({
      where: { schoolId, classId, sectionId, academicYearId, status: "ACTIVE" },
      orderBy: { roll: "asc" },
    }),
    getActiveGradeRules(schoolId),
  ])

  const schedules: ScheduleInput[] = scheduleRows.map((schedule) => ({
    scheduleId: schedule.id,
    subjectId: schedule.subjectId,
    subjectName: schedule.subject.name,
    fullMarks: schedule.fullMarks,
    passMarks: schedule.passMarks,
  }))

  const marks = await prisma.examMark.findMany({
    where: {
      examScheduleId: { in: schedules.map((schedule) => schedule.scheduleId) },
      studentId: { in: students.map((student) => student.id) },
    },
  })
  const marksByStudentId = new Map<string, Map<string, { marks: number | null; isAbsent: boolean }>>()
  for (const mark of marks) {
    if (!marksByStudentId.has(mark.studentId)) {
      marksByStudentId.set(mark.studentId, new Map())
    }
    marksByStudentId.get(mark.studentId)!.set(mark.examScheduleId, { marks: mark.marks, isAbsent: mark.isAbsent })
  }

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

  const [schedules, gradeRules] = await Promise.all([
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
  const marksByScheduleId = new Map(marks.map((mark) => [mark.examScheduleId, { marks: mark.marks, isAbsent: mark.isAbsent }]))

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
    const scheduleInputs: ScheduleInput[] = examSchedules.map((schedule) => ({
      scheduleId: schedule.id,
      subjectId: schedule.subjectId,
      subjectName: schedule.subject.name,
      fullMarks: schedule.fullMarks,
      passMarks: schedule.passMarks,
    }))
    const result = calculateStudentExamResult(studentId, scheduleInputs, marksByScheduleId, gradeRules)
    const exam = examSchedules[0].exam
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
    getActiveGradeRules(schoolId),
  ])

  const schedules: ScheduleInput[] = scheduleRows.map((schedule) => ({
    scheduleId: schedule.id,
    subjectId: schedule.subjectId,
    subjectName: schedule.subject.name,
    fullMarks: schedule.fullMarks,
    passMarks: schedule.passMarks,
  }))

  const marks = await prisma.examMark.findMany({
    where: { studentId, examScheduleId: { in: schedules.map((schedule) => schedule.scheduleId) } },
  })
  const marksByScheduleId = new Map(marks.map((mark) => [mark.examScheduleId, { marks: mark.marks, isAbsent: mark.isAbsent }]))

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
    },
    result,
  }
}
