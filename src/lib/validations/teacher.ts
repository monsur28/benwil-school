import { z } from "zod"

const errors = {
  nameRequired: "errors.nameRequired",
  invalidEmail: "errors.invalidEmail",
  passwordTooShort: "errors.passwordTooShort",
}

const optionalText = z.string().trim().max(255).optional().or(z.literal(""))

const teacherProfileFields = {
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  phone: optionalText,
  address: optionalText,
  employeeId: optionalText,
  designation: optionalText,
  department: optionalText,
  joiningDate: z.string().trim().optional().or(z.literal("")),
  employmentType: optionalText,
  qualifications: optionalText,
  specialization: optionalText,
}

export const createTeacherSchema = z.object({
  ...teacherProfileFields,
  email: z.email({ error: errors.invalidEmail }),
  password: z.string().min(8, { error: errors.passwordTooShort }),
})
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>

// Email/password are not editable here - changing a teacher's login
// credentials is a separate, more sensitive operation than editing their
// profile, and isn't part of this phase's scope.
export const updateTeacherSchema = z.object(teacherProfileFields)
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>
