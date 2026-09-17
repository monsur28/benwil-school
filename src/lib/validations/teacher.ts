import { z } from "zod"
import { Gender } from "@prisma/client"
import { EMPLOYMENT_TYPE_OPTIONS } from "@/lib/teachers/options"

const errors = {
  nameRequired: "errors.nameRequired",
  invalidEmail: "errors.invalidEmail",
  passwordTooShort: "errors.passwordTooShort",
  phoneRequired: "errors.phoneRequired",
  invalidPhone: "errors.invalidPhone",
  employeeIdRequired: "errors.employeeIdRequired",
  designationRequired: "errors.designationRequired",
  joiningDateRequired: "errors.joiningDateRequired",
  employmentTypeRequired: "errors.employmentTypeRequired",
  invalidDate: "errors.invalidDate",
  futureDateOfBirth: "errors.futureDateOfBirth",
}

const optionalText = (max = 255) => z.string().trim().max(max).optional().or(z.literal(""))

// Loose on purpose: this rejects only obviously-wrong input (letters, way
// too short/long). Nothing else in this codebase enforces a single
// country's dialing format either (see phone in lib/validations/student.ts),
// so this doesn't invent a new, stricter convention just for teachers.
const PHONE_PATTERN = /^[0-9+\-()\s]{7,20}$/
const phoneSchema = z
  .string()
  .trim()
  .min(1, { error: errors.phoneRequired })
  .regex(PHONE_PATTERN, { error: errors.invalidPhone })

const isoDateSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), { error: errors.invalidDate })

// A date of birth in the future isn't just unusual, it's impossible - worth
// rejecting server-side (spec: "validate sensible dates"). Joining date gets
// no such check: hiring a teacher who starts next term is a real case.
const dateOfBirthSchema = z
  .union([
    isoDateSchema.refine((value) => new Date(value) <= new Date(), { error: errors.futureDateOfBirth }),
    z.literal(""),
  ])
  .optional()

const genderSchema = z.union([z.enum(Gender), z.literal("")]).optional()
const employmentTypeOptionalSchema = z.union([z.enum(EMPLOYMENT_TYPE_OPTIONS), z.literal("")]).optional()

// Fields that are optional in every context - personal detail that helps
// identify the teacher, or professional colour that doesn't gate anything.
const optionalProfileFields = {
  address: optionalText(),
  department: optionalText(),
  qualifications: optionalText(),
  specialization: optionalText(),
  experience: optionalText(60),
  gender: genderSchema,
  dateOfBirth: dateOfBirthSchema,
}

// The newly-required fields (§2 of the spec) are enforced on *creation*
// only. Editing keeps them optional so an admin can still update, say, a
// teacher's phone number without being forced to simultaneously backfill
// Employee ID/Designation/Joining Date/Employment Type on an older record
// that was created before this form existed (or via the seed script).
export const createTeacherSchema = z.object({
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  phone: phoneSchema,
  employeeId: z.string().trim().min(1, { error: errors.employeeIdRequired }).max(50),
  designation: z.string().trim().min(1, { error: errors.designationRequired }).max(255),
  joiningDate: z
    .string()
    .trim()
    .min(1, { error: errors.joiningDateRequired })
    .refine((value) => !Number.isNaN(Date.parse(value)), { error: errors.invalidDate }),
  employmentType: z.enum(EMPLOYMENT_TYPE_OPTIONS, { error: errors.employmentTypeRequired }),
  ...optionalProfileFields,
  email: z.email({ error: errors.invalidEmail }),
  password: z.string().min(8, { error: errors.passwordTooShort }),
  // "Allow teacher to access the system" (§12). There is no separate
  // account-vs-profile split in this architecture - a teacher record *is*
  // a login (User row) - so this maps straight onto the same isActive flag
  // that gates login in actions/auth/login.ts and that the profile page's
  // Activate/Deactivate button already controls. Defaults to true so a
  // normal creation behaves exactly as it does today.
  isActive: z.boolean().default(true),
})
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>

// Email/password are not editable here - changing a teacher's login
// credentials is a separate, more sensitive operation than editing their
// profile, and isn't part of this phase's scope. System access (isActive)
// is likewise deliberately absent here: the profile page's dedicated
// Activate/Deactivate control already owns that, with its own confirmation
// step - duplicating it into "Save changes" would let an admin revoke a
// teacher's access by accident.
export const updateTeacherSchema = z.object({
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  phone: optionalText(30),
  employeeId: optionalText(50),
  designation: optionalText(255),
  joiningDate: z.string().trim().optional().or(z.literal("")),
  employmentType: employmentTypeOptionalSchema,
  ...optionalProfileFields,
})
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>
