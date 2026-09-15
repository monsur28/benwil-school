import { z } from "zod"

const errors = {
  invalidSelection: "errors.invalidSelection",
  contentTooLong: "errors.contentTooLong",
  submissionEmpty: "errors.submissionEmpty",
  marksInvalid: "errors.marksInvalid",
  gradeTooLong: "errors.gradeTooLong",
  feedbackTooLong: "errors.feedbackTooLong",
  reviewEmpty: "errors.reviewEmpty",
}

export const submitHomeworkSchema = z
  .object({
    homeworkId: z.string().trim().min(1, { error: errors.invalidSelection }),
    content: z.string().trim().max(10000, { error: errors.contentTooLong }).optional().or(z.literal("")),
  })

export type SubmitHomeworkInput = z.infer<typeof submitHomeworkSchema>

export const reviewHomeworkSubmissionSchema = z
  .object({
    homeworkId: z.string().trim().min(1, { error: errors.invalidSelection }),
    studentId: z.string().trim().min(1, { error: errors.invalidSelection }),
    marks: z
      .preprocess(
        (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
        z.number().min(0, { error: errors.marksInvalid }).max(1000, { error: errors.marksInvalid }).optional()
      )
      .optional(),
    grade: z.string().trim().max(20, { error: errors.gradeTooLong }).optional().or(z.literal("")),
    feedback: z.string().trim().max(10000, { error: errors.feedbackTooLong }).optional().or(z.literal("")),
  })
  .refine(
    (d) =>
      (d.marks !== undefined && d.marks !== null) ||
      (d.grade !== undefined && d.grade !== "") ||
      (d.feedback !== undefined && d.feedback !== ""),
    {
      error: errors.reviewEmpty,
      path: ["feedback"],
    }
  )

export type ReviewHomeworkSubmissionInput = z.infer<typeof reviewHomeworkSubmissionSchema>
