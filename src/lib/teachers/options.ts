import { Gender } from "@prisma/client"

// Reuses the existing Gender enum (already defined for students) rather
// than introducing a second one - see prisma/schema.prisma User.gender.
export const GENDER_OPTIONS = Object.values(Gender)

// employmentType stays a free-text column (see schema.prisma comment) so no
// migration/enum was needed - this is just the closed set of options the
// form's select offers. A legacy/unexpected value already stored on a
// teacher is still preserved and shown by the form (see teacher-form.tsx),
// it just won't appear as one of these choices.
export const EMPLOYMENT_TYPE_OPTIONS = ["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY"] as const
export type EmploymentTypeOption = (typeof EMPLOYMENT_TYPE_OPTIONS)[number]
