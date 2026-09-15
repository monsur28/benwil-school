import { z } from "zod"

const errors = {
  nameRequired: "errors.nameRequired",
  invalidSelection: "errors.invalidSelection",
  titleRequired: "errors.titleRequired",
  instructionsRequired: "errors.instructionsRequired",
  dateRequired: "errors.dateRequired",
  invalidDate: "errors.invalidDate",
  invalidDateRange: "errors.invalidDateRange",
}

const optionalText = z.string().trim().optional().or(z.literal(""))
const requiredId = z.string().trim().min(1, { error: errors.invalidSelection })
const requiredDate = z
  .string()
  .trim()
  .min(1, { error: errors.dateRequired })
  .refine((value) => !Number.isNaN(Date.parse(value)), { error: errors.invalidDate })

export const createHomeworkCategorySchema = z.object({
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  description: optionalText,
})
export type CreateHomeworkCategoryInput = z.infer<typeof createHomeworkCategorySchema>

export const editHomeworkCategorySchema = createHomeworkCategorySchema.extend({
  id: requiredId,
  isActive: z.boolean(),
})
export type EditHomeworkCategoryInput = z.infer<typeof editHomeworkCategorySchema>

// teacherId is only meaningful when an admin/principal creates homework on
// behalf of a specific teacher - a TEACHER's own session always overrides
// this server-side (see src/actions/homework/homework.ts), it is never
// trusted as authorization on its own.
const homeworkFields = {
  academicYearId: requiredId,
  subjectId: requiredId,
  classId: requiredId,
  sectionId: requiredId,
  categoryId: optionalText,
  teacherId: optionalText,
  title: z.string().trim().min(1, { error: errors.titleRequired }),
  instructions: z.string().trim().min(1, { error: errors.instructionsRequired }),
  assignedDate: requiredDate,
  dueDate: requiredDate,
  maxMarks: z
    .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)), z.number().int().positive().max(1000).optional())
    .optional(),
}

export const createHomeworkSchema = z
  .object(homeworkFields)
  .refine((d) => new Date(d.dueDate) >= new Date(d.assignedDate), {
    error: errors.invalidDateRange,
    path: ["dueDate"],
  })
export type CreateHomeworkInput = z.infer<typeof createHomeworkSchema>

export const editHomeworkSchema = z
  .object({ ...homeworkFields, id: requiredId })
  .refine((d) => new Date(d.dueDate) >= new Date(d.assignedDate), {
    error: errors.invalidDateRange,
    path: ["dueDate"],
  })
export type EditHomeworkInput = z.infer<typeof editHomeworkSchema>
