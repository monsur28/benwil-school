import { z } from "zod"

// Error messages are i18n keys relative to the "academics" namespace, same
// convention as lib/validations/student.ts and lib/validations/attendance.ts.
const errors = {
  nameRequired: "errors.nameRequired",
  orderRequired: "errors.orderRequired",
  codeRequired: "errors.codeRequired",
  classRequired: "errors.classRequired",
  sectionRequired: "errors.sectionRequired",
  subjectRequired: "errors.subjectRequired",
  teacherRequired: "errors.teacherRequired",
}

export const createAcademicYearSchema = z.object({
  name: z.string().trim().min(1, { error: errors.nameRequired }),
})
export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>

export const editAcademicYearSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, { error: errors.nameRequired }),
})
export type EditAcademicYearInput = z.infer<typeof editAcademicYearSchema>

export const createClassSchema = z.object({
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  order: z.coerce.number({ error: errors.orderRequired }).int().positive({ error: errors.orderRequired }),
})
export type CreateClassInput = z.infer<typeof createClassSchema>

export const editClassSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  order: z.coerce.number({ error: errors.orderRequired }).int().positive({ error: errors.orderRequired }),
  isActive: z.boolean(),
})
export type EditClassInput = z.infer<typeof editClassSchema>

export const createSectionSchema = z.object({
  classId: z.string().min(1, { error: errors.classRequired }),
  name: z.string().trim().min(1, { error: errors.nameRequired }),
})
export type CreateSectionInput = z.infer<typeof createSectionSchema>

export const editSectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  isActive: z.boolean(),
})
export type EditSectionInput = z.infer<typeof editSectionSchema>

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  nameBn: z.string().trim().optional().or(z.literal("")),
  code: z.string().trim().min(1, { error: errors.codeRequired }),
})
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>

export const editSubjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  nameBn: z.string().trim().optional().or(z.literal("")),
  code: z.string().trim().min(1, { error: errors.codeRequired }),
  isActive: z.boolean(),
})
export type EditSubjectInput = z.infer<typeof editSubjectSchema>

export const classSubjectSchema = z.object({
  classId: z.string().min(1, { error: errors.classRequired }),
  subjectId: z.string().min(1, { error: errors.subjectRequired }),
})
export type ClassSubjectInput = z.infer<typeof classSubjectSchema>

export const teacherAssignmentSchema = z.object({
  teacherId: z.string().min(1, { error: errors.teacherRequired }),
  classId: z.string().min(1, { error: errors.classRequired }),
  sectionId: z.string().min(1, { error: errors.sectionRequired }),
  subjectId: z.string().min(1, { error: errors.subjectRequired }),
})
export type TeacherAssignmentInput = z.infer<typeof teacherAssignmentSchema>
