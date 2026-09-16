import { z } from "zod"
import { BloodGroup, DocumentType, Gender, GuardianRelation, StudentStatus } from "@prisma/client"

const errors = {
  nameRequired: "errors.nameRequired",
  invalidDate: "errors.invalidDate",
  admissionNumberRequired: "errors.admissionNumberRequired",
  phoneRequired: "errors.phoneRequired",
  invalidEmail: "errors.invalidEmail",
  academicYearRequired: "errors.academicYearRequired",
  classRequired: "errors.classRequired",
  sectionRequired: "errors.sectionRequired",
  rollRequired: "errors.rollRequired",
  guardiansRequired: "errors.guardiansRequired",
  documentTitleRequired: "errors.documentTitleRequired",
  documentFileRequired: "errors.invalidForm",
}

const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), { error: errors.invalidDate })

export const guardianSchema = z.object({
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  nameBn: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().min(1, { error: errors.phoneRequired }),
  email: z.union([z.email({ error: errors.invalidEmail }), z.literal("")]).optional(),
  occupation: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  relation: z.enum(GuardianRelation),
  isPrimary: z.boolean(),
})
export type GuardianInput = z.infer<typeof guardianSchema>

export const documentInputSchema = z.object({
  type: z.enum(DocumentType),
  title: z.string().trim().min(1, { error: errors.documentTitleRequired }),
  fileUrl: z.string().url({ error: errors.documentFileRequired }),
  fileName: z.string().trim().min(1, { error: errors.documentFileRequired }),
  cloudinaryPublicId: z.string().trim().min(1, { error: errors.documentFileRequired }),
  mimeType: z.string().trim().min(1, { error: errors.documentFileRequired }),
  fileSize: z.number().int().positive({ error: errors.documentFileRequired }),
})
export type DocumentInput = z.infer<typeof documentInputSchema>

export const basicInfoSchema = z.object({
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  nameBn: z.string().trim().optional().or(z.literal("")),
  dateOfBirth: isoDate,
  gender: z.enum(Gender),
  bloodGroup: z.union([z.enum(BloodGroup), z.literal("")]).optional(),
  religion: z.string().trim().optional().or(z.literal("")),
  nationality: z.string().trim().optional().or(z.literal("")),
  birthCertificateNumber: z.string().trim().optional().or(z.literal("")),
  admissionNumber: z.string().trim().min(1, { error: errors.admissionNumberRequired }),
  admissionDate: isoDate,
})

export const academicInfoSchema = z.object({
  academicYearId: z.string().min(1, { error: errors.academicYearRequired }),
  classId: z.string().min(1, { error: errors.classRequired }),
  sectionId: z.string().min(1, { error: errors.sectionRequired }),
  roll: z.coerce.number({ error: errors.rollRequired }).int().positive({ error: errors.rollRequired }),
})

export const createStudentSchema = basicInfoSchema.extend({
  ...academicInfoSchema.shape,
  guardians: z.array(guardianSchema).min(1, { error: errors.guardiansRequired }),
  documents: z.array(documentInputSchema).default([]),
})
export type CreateStudentInput = z.infer<typeof createStudentSchema>

export const updateStudentSchema = createStudentSchema.extend({ status: z.enum(StudentStatus) })
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
