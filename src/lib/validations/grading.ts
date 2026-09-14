import { z } from "zod"

const errors = {
  nameRequired: "errors.nameRequired",
  gradeRequired: "errors.gradeRequired",
  invalidPercentage: "errors.invalidPercentage",
  invalidRange: "errors.invalidRange",
  invalidGradePoint: "errors.invalidGradePoint",
}

const optionalText = z.string().trim().optional().or(z.literal(""))
const percentageField = z.coerce
  .number()
  .min(0, { error: errors.invalidPercentage })
  .max(100, { error: errors.invalidPercentage })

export const createGradingScaleSchema = z.object({
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  nameBn: optionalText,
})
export type CreateGradingScaleInput = z.infer<typeof createGradingScaleSchema>

export const editGradingScaleSchema = createGradingScaleSchema.extend({
  id: z.string().min(1),
  isActive: z.boolean(),
})
export type EditGradingScaleInput = z.infer<typeof editGradingScaleSchema>

export const gradeRuleSchema = z
  .object({
    gradingScaleId: z.string().min(1),
    minPercentage: percentageField,
    maxPercentage: percentageField,
    grade: z.string().trim().min(1, { error: errors.gradeRequired }),
    gradeBn: optionalText,
    gradePoint: z.coerce.number().min(0, { error: errors.invalidGradePoint }),
  })
  .refine((data) => data.minPercentage < data.maxPercentage, {
    error: errors.invalidRange,
    path: ["maxPercentage"],
  })
export type GradeRuleInput = z.infer<typeof gradeRuleSchema>

export const editGradeRuleSchema = gradeRuleSchema.and(z.object({ id: z.string().min(1) }))
export type EditGradeRuleInput = z.infer<typeof editGradeRuleSchema>
