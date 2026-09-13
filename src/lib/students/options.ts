import { BloodGroup, DocumentType, Gender, GuardianRelation, StudentStatus } from "@prisma/client"

export const GENDER_OPTIONS = Object.values(Gender)
export const BLOOD_GROUP_OPTIONS = Object.values(BloodGroup)
export const RELATION_OPTIONS = Object.values(GuardianRelation)
export const DOCUMENT_TYPE_OPTIONS = Object.values(DocumentType)
export const STATUS_OPTIONS = Object.values(StudentStatus)
