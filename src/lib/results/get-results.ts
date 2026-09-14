import "server-only"
import { prisma } from "@/lib/db/client"
import {
  calculateStudentExamResult,
  type GradeLookupRule,
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
