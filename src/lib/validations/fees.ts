import { z } from "zod"

const errors = {
  nameRequired: "errors.nameRequired",
  invalidAmount: "errors.invalidAmount",
  invalidSelection: "errors.invalidSelection",
  reasonRequired: "errors.reasonRequired",
  noAllocations: "errors.noAllocations",
  allocationExceedsPayment: "errors.allocationExceedsPayment",
}

const optionalText = z.string().trim().optional().or(z.literal(""))
const requiredId = z.string().trim().min(1, { error: errors.invalidSelection })
const moneyAmount = z.coerce.number().positive({ error: errors.invalidAmount })
const optionalDate = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))

export const FEE_FREQUENCIES = ["ONE_TIME", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL"] as const
export const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CHEQUE", "MOBILE_BANKING", "OTHER"] as const

export const createFeeCategorySchema = z.object({
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  nameBn: optionalText,
  description: optionalText,
})
export type CreateFeeCategoryInput = z.infer<typeof createFeeCategorySchema>

export const editFeeCategorySchema = createFeeCategorySchema.extend({
  id: requiredId,
  isActive: z.boolean(),
})
export type EditFeeCategoryInput = z.infer<typeof editFeeCategorySchema>

export const createFeeStructureSchema = z.object({
  academicYearId: requiredId,
  classId: requiredId,
  feeCategoryId: requiredId,
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  nameBn: optionalText,
  amount: moneyAmount,
  frequency: z.enum(FEE_FREQUENCIES),
  dueDate: optionalDate,
})
export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>

export const editFeeStructureSchema = createFeeStructureSchema.extend({
  id: requiredId,
  isActive: z.boolean(),
})
export type EditFeeStructureInput = z.infer<typeof editFeeStructureSchema>

// A manual (no-template) charge still names its category so it can be
// grouped/reported the same way as a structure-based one; the UI pre-fills
// feeCategoryId/name/amount when a feeStructureId is chosen, but always
// submits the final (possibly overridden) values explicitly.
export const assignStudentFeeSchema = z.object({
  studentId: requiredId,
  academicYearId: requiredId,
  feeStructureId: optionalText,
  feeCategoryId: requiredId,
  name: z.string().trim().min(1, { error: errors.nameRequired }),
  amount: moneyAmount,
  dueDate: optionalDate,
})
export type AssignStudentFeeInput = z.infer<typeof assignStudentFeeSchema>

export const bulkAssignFeeSchema = z.object({
  feeStructureId: requiredId,
  dueDate: optionalDate,
})
export type BulkAssignFeeInput = z.infer<typeof bulkAssignFeeSchema>

export const waiveStudentFeeSchema = z.object({
  studentFeeId: requiredId,
  waiverReason: z.string().trim().min(1, { error: errors.reasonRequired }),
})
export type WaiveStudentFeeInput = z.infer<typeof waiveStudentFeeSchema>

export const cancelStudentFeeSchema = z.object({
  studentFeeId: requiredId,
  cancelReason: z.string().trim().min(1, { error: errors.reasonRequired }),
})
export type CancelStudentFeeInput = z.infer<typeof cancelStudentFeeSchema>

export const paymentAllocationSchema = z.object({
  studentFeeId: requiredId,
  amount: moneyAmount,
})

export const createPaymentSchema = z
  .object({
    studentId: requiredId,
    amount: moneyAmount,
    method: z.enum(PAYMENT_METHODS),
    paidAt: z.string().trim().min(1, { error: errors.invalidSelection }),
    notes: optionalText,
    allocations: z.array(paymentAllocationSchema).min(1, { error: errors.noAllocations }),
  })
  .refine((data) => data.allocations.reduce((sum, a) => sum + a.amount, 0) <= data.amount + 0.005, {
    error: errors.allocationExceedsPayment,
    path: ["allocations"],
  })
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>

export const voidPaymentSchema = z.object({
  paymentId: requiredId,
  voidReason: z.string().trim().min(1, { error: errors.reasonRequired }),
})
export type VoidPaymentInput = z.infer<typeof voidPaymentSchema>
