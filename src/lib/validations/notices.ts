import { z } from "zod"

const errors = {
  nameRequired: "errors.nameRequired",
  invalidSelection: "errors.invalidSelection",
  titleRequired: "errors.titleRequired",
  contentRequired: "errors.contentRequired",
  dateRequired: "errors.dateRequired",
  invalidDate: "errors.invalidDate",
  invalidDateRange: "errors.invalidDateRange",
  classRequired: "errors.classRequired",
  sectionRequired: "errors.sectionRequired",
}

const optionalText = z.string().trim().optional().or(z.literal(""))
const requiredId = z.string().trim().min(1, { error: errors.invalidSelection })
const requiredDateTime = z
  .string()
  .trim()
  .min(1, { error: errors.dateRequired })
  .refine((value) => !Number.isNaN(Date.parse(value)), { error: errors.invalidDate })
const optionalDateTime = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), { error: errors.invalidDate })

export const NOTICE_AUDIENCE_TYPES = ["ALL", "STUDENTS", "GUARDIANS", "CLASS", "SECTION"] as const

export const createNoticeCategorySchema = z.object({
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  nameBn: optionalText,
})
export type CreateNoticeCategoryInput = z.infer<typeof createNoticeCategorySchema>

export const editNoticeCategorySchema = createNoticeCategorySchema.extend({
  id: requiredId,
  isActive: z.boolean(),
})
export type EditNoticeCategoryInput = z.infer<typeof editNoticeCategorySchema>

const noticeFields = {
  title: z.string().trim().min(1, { error: errors.titleRequired }),
  titleBn: optionalText,
  content: z.string().trim().min(1, { error: errors.contentRequired }),
  contentBn: optionalText,
  categoryId: requiredId,
  audienceType: z.enum(NOTICE_AUDIENCE_TYPES, { error: errors.invalidSelection }),
  classId: optionalText,
  sectionId: optionalText,
  publishAt: requiredDateTime,
  expiresAt: optionalDateTime,
}

export const createNoticeSchema = z
  .object(noticeFields)
  .refine((d) => d.audienceType !== "CLASS" || !!d.classId, {
    error: errors.classRequired,
    path: ["classId"],
  })
  .refine((d) => d.audienceType !== "SECTION" || (!!d.classId && !!d.sectionId), {
    error: errors.sectionRequired,
    path: ["sectionId"],
  })
  .refine((d) => !d.expiresAt || new Date(d.expiresAt) > new Date(d.publishAt), {
    error: errors.invalidDateRange,
    path: ["expiresAt"],
  })
export type CreateNoticeInput = z.infer<typeof createNoticeSchema>

export const editNoticeSchema = z
  .object({ ...noticeFields, id: requiredId })
  .refine((d) => d.audienceType !== "CLASS" || !!d.classId, {
    error: errors.classRequired,
    path: ["classId"],
  })
  .refine((d) => d.audienceType !== "SECTION" || (!!d.classId && !!d.sectionId), {
    error: errors.sectionRequired,
    path: ["sectionId"],
  })
  .refine((d) => !d.expiresAt || new Date(d.expiresAt) > new Date(d.publishAt), {
    error: errors.invalidDateRange,
    path: ["expiresAt"],
  })
export type EditNoticeInput = z.infer<typeof editNoticeSchema>
