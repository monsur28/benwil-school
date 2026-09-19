import { z } from "zod"

export const DAY_OF_WEEK_VALUES = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
] as const

export const dayOfWeekSchema = z.enum(DAY_OF_WEEK_VALUES, {
  error: "errors.dayRequired",
})

export type DayOfWeekValue = z.infer<typeof dayOfWeekSchema>

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
const optionalText = z.string().trim().optional().or(z.literal(""))

export const routineEntrySchema = z
  .object({
    academicYearId: z.string().min(1, { error: "errors.academicYearRequired" }),
    classId: z.string().min(1, { error: "errors.classRequired" }),
    sectionId: z.string().min(1, { error: "errors.sectionRequired" }),
    subjectId: z.string().min(1, { error: "errors.subjectRequired" }),
    teacherId: z.string().min(1, { error: "errors.teacherRequired" }),
    dayOfWeek: dayOfWeekSchema,
    periodNumber: z.coerce
      .number({ error: "errors.periodRequired" })
      .int()
      .min(1, { error: "errors.periodMin" })
      .max(12, { error: "errors.periodMax" }),
    startTime: z.string().regex(timeRegex, { error: "errors.startTimeInvalid" }),
    endTime: z.string().regex(timeRegex, { error: "errors.endTimeInvalid" }),
    room: optionalText,
  })
  .refine((data) => data.endTime > data.startTime, {
    error: "errors.invalidTimeRange",
    path: ["endTime"],
  })

export type RoutineEntryInput = z.infer<typeof routineEntrySchema>
export type RoutineEntryFormInput = z.input<typeof routineEntrySchema>

export const editRoutineEntrySchema = routineEntrySchema.and(
  z.object({
    id: z.string().min(1, { error: "errors.idRequired" }),
  })
)

export type EditRoutineEntryInput = z.infer<typeof editRoutineEntrySchema>
export type EditRoutineEntryFormInput = z.input<typeof editRoutineEntrySchema>
