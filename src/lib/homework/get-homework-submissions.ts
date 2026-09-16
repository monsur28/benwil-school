import "server-only"
import { prisma } from "@/lib/db/client"
import type { HomeworkSubmission, Student, Prisma } from "@prisma/client"
import { isSubmissionLate } from "@/lib/homework/submission-timing"

export type StudentSubmissionWithReviewer = Prisma.HomeworkSubmissionGetPayload<{
  include: {
    reviewedBy: { select: { id: true; name: true } }
  }
}>

export type HomeworkSubmissionsRosterItem = {
  student: {
    id: string
    name: string
    nameBn: string | null
    roll: number
  }
  submission: {
    id: string
    status: "SUBMITTED" | "REVIEWED"
    submittedAt: Date
    isLate: boolean
    marks: Prisma.Decimal | null
    grade: string | null
    fileUrl: string | null
    fileName: string | null
    hasContent: boolean
  } | null
}

export type HomeworkSubmissionsSummary = {
  totalStudents: number
  submittedCount: number
  reviewedCount: number
  pendingCount: number
  notSubmittedCount: number
  lateCount: number
}

/**
 * Retrieves a single student's submission for a specific homework with reviewer info.
 */
export async function getStudentSubmission(args: {
  schoolId: string
  homeworkId: string
  studentId: string
}): Promise<StudentSubmissionWithReviewer | null> {
  return prisma.homeworkSubmission.findFirst({
    where: {
      schoolId: args.schoolId,
      homeworkId: args.homeworkId,
      studentId: args.studentId,
    },
    include: {
      reviewedBy: {
        select: { id: true, name: true },
      },
    },
  })
}

/**
 * Retrieves the full submission roster for a homework.
 * Scoped strictly to the homework's class, section, academic year, and school.
 */
export async function getHomeworkSubmissionsRoster(args: {
  schoolId: string
  homeworkId: string
}): Promise<{
  summary: HomeworkSubmissionsSummary
  roster: HomeworkSubmissionsRosterItem[]
} | null> {
  const homework = await prisma.homework.findFirst({
    where: { id: args.homeworkId, schoolId: args.schoolId },
    select: {
      id: true,
      schoolId: true,
      academicYearId: true,
      classId: true,
      sectionId: true,
      maxMarks: true,
      dueDate: true,
    },
  })
  if (!homework) return null

  const students = await prisma.student.findMany({
    where: {
      schoolId: homework.schoolId,
      academicYearId: homework.academicYearId,
      classId: homework.classId,
      sectionId: homework.sectionId,
      status: "ACTIVE",
    },
    orderBy: { roll: "asc" },
    select: {
      id: true,
      name: true,
      nameBn: true,
      roll: true,
      homeworkSubmissions: {
        where: { homeworkId: homework.id },
        select: {
          id: true,
          status: true,
          submittedAt: true,
          marks: true,
          grade: true,
          fileUrl: true,
          fileName: true,
          content: true,
        },
        take: 1,
      },
    },
  })

  let submittedCount = 0
  let reviewedCount = 0
  let pendingCount = 0
  let lateCount = 0

  const roster: HomeworkSubmissionsRosterItem[] = students.map((s) => {
    const sub = s.homeworkSubmissions[0] ?? null
    if (sub) {
      submittedCount++
      if (sub.status === "REVIEWED") {
        reviewedCount++
      } else {
        pendingCount++
      }
      const isLate = isSubmissionLate(sub.submittedAt, homework.dueDate)
      if (isLate) lateCount++
      return {
        student: {
          id: s.id,
          name: s.name,
          nameBn: s.nameBn,
          roll: s.roll,
        },
        submission: {
          id: sub.id,
          status: sub.status,
          submittedAt: sub.submittedAt,
          isLate,
          marks: sub.marks,
          grade: sub.grade,
          fileUrl: sub.fileUrl,
          fileName: sub.fileName,
          hasContent: Boolean(sub.content && sub.content.trim().length > 0),
        },
      }
    }

    return {
      student: {
        id: s.id,
        name: s.name,
        nameBn: s.nameBn,
        roll: s.roll,
      },
      submission: null,
    }
  })

  const totalStudents = students.length
  const notSubmittedCount = totalStudents - submittedCount

  return {
    summary: {
      totalStudents,
      submittedCount,
      reviewedCount,
      pendingCount,
      notSubmittedCount,
      lateCount,
    },
    roster,
  }
}

/**
 * Count of submitted-but-not-yet-reviewed submissions across all of a
 * teacher's published homework - a single aggregate query (no N+1 roster
 * fetch) for dashboard stat cards.
 */
export async function getPendingReviewCountForTeacher(args: {
  schoolId: string
  teacherId: string
}): Promise<number> {
  return prisma.homeworkSubmission.count({
    where: {
      schoolId: args.schoolId,
      status: "SUBMITTED",
      homework: {
        teacherId: args.teacherId,
        status: "PUBLISHED",
      },
    },
  })
}

/**
 * Loads homework, student, and submission records for teacher review,
 * asserting all relational boundaries.
 */
export async function getSubmissionForReview(args: {
  schoolId: string
  homeworkId: string
  studentId: string
}) {
  const homework = await prisma.homework.findFirst({
    where: { id: args.homeworkId, schoolId: args.schoolId },
    include: {
      subject: { select: { id: true, name: true, nameBn: true } },
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
  })
  if (!homework) return null

  const student = await prisma.student.findFirst({
    where: {
      id: args.studentId,
      schoolId: args.schoolId,
      academicYearId: homework.academicYearId,
      classId: homework.classId,
      sectionId: homework.sectionId,
    },
    include: {
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
    },
  })
  if (!student) return null

  const submission = await prisma.homeworkSubmission.findFirst({
    where: {
      schoolId: args.schoolId,
      homeworkId: homework.id,
      studentId: student.id,
    },
    include: {
      reviewedBy: { select: { id: true, name: true } },
    },
  })

  return { homework, student, submission }
}
