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

// Path separators and traversal segments are stripped from the original
// filename before it ever reaches the filesystem - the upload path is built
// from school/homework/student ids we already trust, not from user input.
function sanitizeFileName(name: string): string {
  const base = name.replace(/[/\\]+/g, "_").replace(/\.\./g, "_")
  return base.slice(-150) || "file"
}

export async function submitHomework(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const { user, student } = await requireStudentIdentity()
  const t = await getTranslations("homework")

  const homeworkId = formData.get("homeworkId")?.toString() ?? ""
  const content = formData.get("content")?.toString()?.trim() || ""
  const rawFile = formData.get("file")
  const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null

  const parsed = submitHomeworkSchema.safeParse({ homeworkId, content })
  if (!parsed.success) {
    return { success: false, error: t("errors.invalidForm") }
  }

  // A submission needs at least one of content or a file - this can only be
  // checked here, not in the Zod schema, since the schema never sees the
  // raw FormData file entry.
  if (!parsed.data.content && !file) {
    return { success: false, error: t("errors.submissionEmpty") }
  }

  if (file) {
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: t("errors.fileTooLarge") }
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { success: false, error: t("errors.fileTypeNotAllowed") }
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

  let uploaded: { url: string; fileName: string; fileSize?: number } | null = null
  if (file) {
    const storage = getDocumentStorage()
    const relativePath = `uploads/homework-submissions/${user.schoolId}/${homework.id}/${student.id}-${Date.now()}-${sanitizeFileName(file.name)}`
    uploaded = await storage.upload(file, relativePath)
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
      content: parsed.data.content || null,
      fileUrl: uploaded?.url ?? null,
      fileName: uploaded?.fileName ?? null,
      fileSize: uploaded?.fileSize ?? null,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    update: {
      content: parsed.data.content || null,
      // A resubmission without a new file keeps whatever was previously
      // uploaded rather than silently deleting it.
      ...(uploaded ? { fileUrl: uploaded.url, fileName: uploaded.fileName, fileSize: uploaded.fileSize } : {}),
      status: "SUBMITTED",
      submittedAt: new Date(),
      // Resubmission resets review state - marks/grade from a previous
      // version of the work must not silently linger on the new one, since
      // it hasn't been reviewed yet.
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

  // The client's marks value is only ever a suggestion - maxMarks is
  // re-read from this homework's own authoritative row, never trusted from
  // the form (spec §14/§43). A homework with no maxMarks configured has no
  // ceiling to enforce, so any non-negative value (already checked by the
  // Zod schema) is accepted.
  if (parsed.data.marks !== undefined && homework.maxMarks !== null && parsed.data.marks > homework.maxMarks) {
    return { success: false, error: t("errors.marksExceedsMax", { max: homework.maxMarks }) }
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

  await prisma.homeworkSubmission.update({
    where: { id: submission.id },
    data: {
      status: "REVIEWED",
      feedback: parsed.data.feedback || null,
      marks: parsed.data.marks !== undefined ? parsed.data.marks : null,
      grade: parsed.data.grade || null,
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
