import { z } from "zod"

const errors = {
  nameRequired: "errors.nameRequired",
  academicYearRequired: "errors.academicYearRequired",
  examTypeRequired: "errors.examTypeRequired",
  dateRequired: "errors.dateRequired",
  invalidDateRange: "errors.invalidDateRange",
  classRequired: "errors.classRequired",
  subjectRequired: "errors.subjectRequired",
  examDateRequired: "errors.examDateRequired",
  fullMarksInvalid: "errors.fullMarksInvalid",
  passMarksInvalid: "errors.passMarksInvalid",
  homeworkMaxMarksInvalid: "errors.homeworkMaxMarksInvalid",
  invalidTimeRange: "errors.invalidTimeRange",
  marksAbsentMismatch: "errors.marksAbsentMismatch",
}

const optionalText = z.string().trim().optional().or(z.literal(""))

export const createExamTypeSchema = z.object({
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  nameBn: optionalText,
})
export type CreateExamTypeInput = z.infer<typeof createExamTypeSchema>

export const editExamTypeSchema = createExamTypeSchema.extend({
  id: z.string().min(1),
  isActive: z.boolean(),
})
export type EditExamTypeInput = z.infer<typeof editExamTypeSchema>

export const createExamSchema = z
  .object({
    name: z.string().trim().min(1, { error: errors.nameRequired }),
    nameBn: optionalText,
    academicYearId: z.string().min(1, { error: errors.academicYearRequired }),
    examTypeId: z.string().min(1, { error: errors.examTypeRequired }),
    startDate: z.string().min(1, { error: errors.dateRequired }),
    endDate: z.string().min(1, { error: errors.dateRequired }),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    error: errors.invalidDateRange,
    path: ["endDate"],
  })
export type CreateExamInput = z.infer<typeof createExamSchema>

export const editExamSchema = createExamSchema.and(
  z.object({ id: z.string().min(1), isActive: z.boolean() })
)
export type EditExamInput = z.infer<typeof editExamSchema>

export const examScheduleSchema = z
  .object({
    examId: z.string().min(1),
    classId: z.string().min(1, { error: errors.classRequired }),
    subjectId: z.string().min(1, { error: errors.subjectRequired }),
    examDate: z.string().min(1, { error: errors.examDateRequired }),
    startTime: optionalText,
    endTime: optionalText,
    room: optionalText,
    fullMarks: z.coerce.number().int().positive({ error: errors.fullMarksInvalid }),
    passMarks: z.coerce.number().int().min(0, { error: errors.passMarksInvalid }),
    // Optional: the portion of fullMarks sourced from reviewed homework
    // instead of a typed exam mark. Left blank (undefined) means this
    // subject has no homework component - same as every schedule that
    // existed before this field was added.
    homeworkMaxMarks: z
      .preprocess(
        (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
        z.number().int().min(0, { error: errors.homeworkMaxMarksInvalid }).optional()
      )
      .optional(),
  })
  .refine((data) => data.passMarks <= data.fullMarks, {
    error: errors.passMarksInvalid,
    path: ["passMarks"],
  })
  .refine((data) => data.homeworkMaxMarks === undefined || data.homeworkMaxMarks <= data.fullMarks, {
    error: errors.homeworkMaxMarksInvalid,
    path: ["homeworkMaxMarks"],
  })
  .refine((data) => !data.startTime || !data.endTime || data.endTime > data.startTime, {
    error: errors.invalidTimeRange,
    path: ["endTime"],
  })
export type ExamScheduleInput = z.infer<typeof examScheduleSchema>

export const editExamScheduleSchema = examScheduleSchema.and(z.object({ id: z.string().min(1) }))
export type EditExamScheduleInput = z.infer<typeof editExamScheduleSchema>

const examMarkEntrySchema = z
  .object({
    studentId: z.string().min(1),
    marks: z.number().nullable(),
    isAbsent: z.boolean(),
  })
  .refine((entry) => entry.isAbsent === (entry.marks === null), {
    error: errors.marksAbsentMismatch,
    path: ["marks"],
  })

export const saveExamMarksSchema = z.object({
  examScheduleId: z.string().min(1),
  sectionId: z.string().min(1),
  entries: z.array(examMarkEntrySchema).min(1),
})
export type SaveExamMarksInput = z.infer<typeof saveExamMarksSchema>
