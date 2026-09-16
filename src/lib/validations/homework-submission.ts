import { z } from "zod"

const errors = {
  invalidSelection: "errors.invalidSelection",
  contentTooLong: "errors.contentTooLong",
  submissionEmpty: "errors.submissionEmpty",
  marksInvalid: "errors.marksInvalid",
  gradeTooLong: "errors.gradeTooLong",
  feedbackTooLong: "errors.feedbackTooLong",
  reviewEmpty: "errors.reviewEmpty",
  fileTooLarge: "errors.fileTooLarge",
  fileTypeNotAllowed: "errors.fileTypeNotAllowed",
}

// content is optional at the schema level because a submission may consist
// of only an uploaded file (spec: "text answer, uploaded file, or existing
// supported media") - submitHomework() itself rejects the case where BOTH
// content and file are absent, since that check needs to see the raw
// FormData file too, not just this parsed shape.
export const submitHomeworkSchema = z
  .object({
    homeworkId: z.string().trim().min(1, { message: errors.invalidSelection }),
    content: z.string().trim().max(10000, { message: errors.contentTooLong }).optional().or(z.literal("")),
  })

export type SubmitHomeworkInput = z.infer<typeof submitHomeworkSchema>

// marks is bounded here only by a generous sanity ceiling (1000) - that is
// NOT the real business rule. The authoritative bound is the specific
// homework's own maxMarks, which only the server action knows after
// re-fetching the homework; the client can't be trusted to report it
// (spec §14). A schema-level 0 lower bound still catches negative marks
// before the action ever runs.
export const reviewHomeworkSubmissionSchema = z
  .object({
    homeworkId: z.string().trim().min(1, { message: errors.invalidSelection }),
    studentId: z.string().trim().min(1, { message: errors.invalidSelection }),
    feedback: z.string().trim().max(10000, { message: errors.feedbackTooLong }).optional().or(z.literal("")),
    marks: z
      .preprocess(
        (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
        z.number().min(0, { message: errors.marksInvalid }).max(1000, { message: errors.marksInvalid }).optional()
      )
      .optional(),
    grade: z.string().trim().max(10, { message: errors.gradeTooLong }).optional().or(z.literal("")),
  })
  .refine((data) => data.feedback || data.marks !== undefined || data.grade, {
    message: errors.reviewEmpty,
    path: ["feedback"],
  })

export type ReviewHomeworkSubmissionInput = z.infer<typeof reviewHomeworkSubmissionSchema>
