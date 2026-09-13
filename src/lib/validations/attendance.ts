import { z } from "zod"
import { AttendanceStatus } from "@prisma/client"

const errors = {
  classRequired: "errors.classRequired",
  sectionRequired: "errors.sectionRequired",
  academicYearRequired: "errors.academicYearRequired",
  invalidDate: "errors.invalidDate",
  futureDate: "errors.futureDate",
  noStudents: "errors.noStudents",
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const attendanceDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { error: errors.invalidDate })
  .refine((value) => value <= todayIso(), { error: errors.futureDate })

export const attendanceEntrySchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(AttendanceStatus),
})

export const saveAttendanceSchema = z.object({
  classId: z.string().min(1, { error: errors.classRequired }),
  sectionId: z.string().min(1, { error: errors.sectionRequired }),
  academicYearId: z.string().min(1, { error: errors.academicYearRequired }),
  date: attendanceDate,
  entries: z.array(attendanceEntrySchema).min(1, { error: errors.noStudents }),
})
export type SaveAttendanceInput = z.infer<typeof saveAttendanceSchema>
