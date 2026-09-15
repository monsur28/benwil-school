"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { prisma } from "@/lib/db/client"
import { HOMEWORK_ROLES, checkHomeworkOwnership } from "@/lib/homework/homework-access"
import {
  isSubmissionOpen,
  checkStudentSubmissionEligibility,
  checkTeacherReviewAccess,
} from "@/lib/homework/homework-submission-access"
import {
  submitHomeworkSchema,
  reviewHomeworkSubmissionSchema,
  type SubmitHomeworkInput,
  type ReviewHomeworkSubmissionInput,
} from "@/lib/validations/homework-submission"
import { getDocumentStorage } from "@/lib/storage/document-storage"
import type { ActionResult } from "@/lib/types/action"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]

/**
 * Student submission action.
 * Receives FormData with homeworkId, optional text content, and optional file attachment.
 * Derives student identity strictly from the authenticated session.
 */
export async function submitHomework(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const { user, student } = await requireStudentIdentity()
  const t = await getTranslations("homework")

  const homeworkId = formData.get("homeworkId")?.toString() ?? ""
  const content = formData.get("content")?.toString()?.trim() || ""
  const file = formData.get("file") as File | null

  const parsed = submitHomeworkSchema.safeParse({ homeworkId, content })
  if (!parsed.success) {
    return { success: false, error: t("errors.invalidForm") }
  }

  const hasFile = Boolean(file && file.size > 0 && file.name)
  if (!content && !hasFile) {
    return { success: false, error: t("errors.submissionEmpty") }
  }

  if (hasFile && file) {
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: t("errors.fileTooLarge") }
    }
    // Some browsers or test fixtures may not set type; check extension too
    const ext = file.name.split(".").pop()?.toLowerCase() || ""
    const allowedExts = ["pdf", "doc", "docx", "txt", "png", "jpg", "jpeg", "webp"]
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type) && !allowedExts.includes(ext)) {
      return { success: false, error: t("errors.invalidFileType") }
    }
  }

  const homework = await prisma.homework.findFirst({
    where: {
      id: parsed.data.homeworkId,
      schoolId: user.schoolId,
    },
  })
  if (!homework) {
    return { success: false, error: t("errors.notFound") }
  }

  const eligibility = checkStudentSubmissionEligibility(student, homework)
  if (!eligibility.ok) {
    return { success: false, error: t("errors.notAssigned") }
  }

  if (!isSubmissionOpen(homework.dueDate)) {
    return { success: false, error: t("errors.submissionClosed") }
  }

  let fileUrl: string | null = null
  let fileName: string | null = null
  let fileSize: number | null = null

  if (hasFile && file) {
    const storage = getDocumentStorage()
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const relativePath = `uploads/homework/${user.schoolId}/${Date.now()}-${cleanName}`
    const uploaded = await storage.upload(file, relativePath)
    fileUrl = uploaded.url
    fileName = uploaded.fileName
    fileSize = uploaded.fileSize ?? file.size
  }

  const submission = await prisma.homeworkSubmission.upsert({
    where: {
      schoolId_homeworkId_studentId: {
        schoolId: user.schoolId,
        homeworkId: homework.id,
        studentId: student.id,
      },
    },
    create: {
      schoolId: user.schoolId,
      homeworkId: homework.id,
      studentId: student.id,
      content: content || null,
      fileUrl,
      fileName,
      fileSize,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    update: {
      content: content || null,
      ...(hasFile ? { fileUrl, fileName, fileSize } : {}),
      status: "SUBMITTED",
      submittedAt: new Date(),
      // Resubmission resets review state as it requires fresh teacher review
      marks: null,
      grade: null,
      feedback: null,
      reviewedAt: null,
      reviewedById: null,
    },
    select: { id: true },
  })

  revalidatePath(`/portal/student/homework/${homework.id}`)
  revalidatePath("/portal/student/homework")
  revalidatePath("/portal/student")
  revalidatePath(`/homework/${homework.id}`)
  revalidatePath(`/portal/guardian/children/${student.id}/homework/${homework.id}`)

  return { success: true, data: { id: submission.id } }
}

/**
 * Teacher and Admin review action.
 * Allows awarding marks, grade, and textual feedback.
 * Strictly verifies school scoping, teacher ownership, and class/section match.
 */
export async function reviewHomeworkSubmission(input: unknown): Promise<ActionResult> {
  const user = await requireRole(...HOMEWORK_ROLES)
  const t = await getTranslations("homework")

  const parsed = reviewHomeworkSubmissionSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: t("errors.invalidForm") }
  }

  const homework = await prisma.homework.findFirst({
    where: {
      id: parsed.data.homeworkId,
      schoolId: user.schoolId,
    },
    select: {
      id: true,
      schoolId: true,
      teacherId: true,
      academicYearId: true,
      classId: true,
      sectionId: true,
      maxMarks: true,
    },
  })
  if (!homework) {
    return { success: false, error: t("errors.notFound") }
  }

  const student = await prisma.student.findFirst({
    where: {
      id: parsed.data.studentId,
      schoolId: user.schoolId,
      academicYearId: homework.academicYearId,
      classId: homework.classId,
      sectionId: homework.sectionId,
    },
    select: {
      id: true,
      schoolId: true,
      academicYearId: true,
      classId: true,
      sectionId: true,
    },
  })
  if (!student) {
    return { success: false, error: t("errors.invalidStudent") }
  }

  const reviewAccess = checkTeacherReviewAccess(user, homework, student)
  if (!reviewAccess.ok) {
    return { success: false, error: t("errors.notAssigned") }
  }

  const submission = await prisma.homeworkSubmission.findFirst({
    where: {
      schoolId: user.schoolId,
      homeworkId: homework.id,
      studentId: student.id,
    },
  })
  if (!submission) {
    return { success: false, error: t("errors.notFound") }
  }

  if (
    parsed.data.marks !== undefined &&
    parsed.data.marks !== null &&
    homework.maxMarks !== null &&
    homework.maxMarks !== undefined
  ) {
    if (parsed.data.marks > homework.maxMarks) {
      return { success: false, error: t("errors.marksExceedMax") }
    }
  }

  await prisma.homeworkSubmission.update({
    where: { id: submission.id },
    data: {
      status: "REVIEWED",
      marks: parsed.data.marks !== undefined ? parsed.data.marks : null,
      grade: parsed.data.grade || null,
      feedback: parsed.data.feedback || null,
      reviewedAt: new Date(),
      reviewedById: user.userId,
    },
  })

  revalidatePath(`/homework/${homework.id}`)
  revalidatePath(`/homework/${homework.id}/submissions/${student.id}`)
  revalidatePath(`/portal/student/homework/${homework.id}`)
  revalidatePath(`/portal/guardian/children/${student.id}/homework/${homework.id}`)

  return { success: true }
}

export type { SubmitHomeworkInput, ReviewHomeworkSubmissionInput }
