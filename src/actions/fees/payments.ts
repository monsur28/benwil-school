"use server"
import { ActionResult } from "@/lib/types/action"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { Prisma } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { isSerializationError } from "@/lib/db/prisma-errors"
import { FEE_ADMIN_ROLES, FEE_STAFF_ROLES } from "@/lib/fees/fee-access"
import { calculateFeeBalance } from "@/lib/fees/calculate-fee-balance"
import { createPaymentSchema, voidPaymentSchema } from "@/lib/validations/fees"

export type PaymentActionResult = ActionResult<{ paymentId: string; receiptNumber: string }>
export type VoidActionResult = ActionResult

// Thrown for ordinary business-rule failures discovered *inside* the
// transaction (fresh, re-checked balances) - as opposed to a Postgres
// serialization failure (P2034), which is retried instead. Throwing here
// aborts+rolls back the whole transaction, same as any other error would.
class FeeValidationError extends Error {}

// The counter row every payment in a school/year shares (see
// FeeReceiptSequence in schema.prisma) means Serializable write conflicts
// happen between *any* two concurrent payments for that school this year,
// not only two people racing the same fee's balance. Retrying a handful of
// times keeps that routine contention invisible; if a retry's fresh read
// still finds insufficient balance, the ordinary FeeValidationError path
// (not this retry loop) reports it as a normal validation error.
const MAX_SERIALIZATION_RETRIES = 3

export async function createPayment(input: unknown): Promise<PaymentActionResult> {
  const user = await requireRole(...FEE_STAFF_ROLES)
  const t = await getTranslations("fees")

  const parsed = createPaymentSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }
  const data = parsed.data

  const student = await prisma.student.findFirst({
    where: { id: data.studentId, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!student) return { success: false, error: t("errors.invalidSelection") }

  const paidAt = new Date(data.paidAt)
  if (Number.isNaN(paidAt.getTime())) return { success: false, error: t("errors.invalidSelection") }

  const uniqueFeeIds = [...new Set(data.allocations.map((allocation) => allocation.studentFeeId))]
  if (uniqueFeeIds.length !== data.allocations.length) {
    return { success: false, error: t("errors.invalidAllocation") }
  }

  for (let attempt = 1; attempt <= MAX_SERIALIZATION_RETRIES; attempt += 1) {
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          // Re-verify every fee belongs to this student and school, and
          // re-read its *current* allocations from inside this Serializable
          // transaction - never the client's numbers - so the balance check
          // below can never be stale or spoofed. See §2 of the design: two
          // concurrent payments against the same fee will both read here,
          // but only one can commit; Postgres aborts the other with P2034.
          const fees = await tx.studentFee.findMany({
            where: { id: { in: uniqueFeeIds }, studentId: data.studentId, schoolId: user.schoolId },
            include: { allocations: { include: { payment: { select: { status: true } } } } },
          })
          if (fees.length !== uniqueFeeIds.length) {
            throw new FeeValidationError(t("errors.invalidSelection"))
          }
          for (const fee of fees) {
            if (fee.status === "WAIVED" || fee.status === "CANCELLED") {
              throw new FeeValidationError(t("errors.feeNotPayable"))
            }
          }

          const feesById = new Map(fees.map((fee) => [fee.id, fee]))
          let totalAllocated = 0
          for (const allocation of data.allocations) {
            const fee = feesById.get(allocation.studentFeeId)
            if (!fee) throw new FeeValidationError(t("errors.invalidSelection"))
            const balance = calculateFeeBalance(
              fee.amount,
              fee.allocations.map((row) => ({ amount: row.amount, paymentStatus: row.payment.status }))
            )
            if (allocation.amount > balance.remaining.toNumber() + 0.005) {
              throw new FeeValidationError(t("errors.allocationExceedsBalance"))
            }
            totalAllocated += allocation.amount
          }
          if (totalAllocated > data.amount + 0.005) {
            throw new FeeValidationError(t("errors.allocationExceedsPayment"))
          }

          // The row lock this UPDATE takes on (schoolId, year) is what makes
          // concurrent receipt-number generation safe without raw SQL - see
          // the FeeReceiptSequence schema comment.
          const year = paidAt.getUTCFullYear()
          const sequence = await tx.feeReceiptSequence.upsert({
            where: { schoolId_year: { schoolId: user.schoolId, year } },
            create: { schoolId: user.schoolId, year, lastNumber: 1 },
            update: { lastNumber: { increment: 1 } },
          })
          const receiptNumber = `RCPT-${year}-${String(sequence.lastNumber).padStart(6, "0")}`

          const payment = await tx.payment.create({
            data: {
              schoolId: user.schoolId,
              studentId: data.studentId,
              receiptNumber,
              amount: data.amount,
              method: data.method,
              paidAt,
              notes: data.notes || null,
              receivedById: user.userId,
              allocations: {
                create: data.allocations.map((allocation) => ({
                  schoolId: user.schoolId,
                  studentFeeId: allocation.studentFeeId,
                  amount: allocation.amount,
                })),
              },
            },
          })

          for (const fee of fees) {
            const previouslyPaid = fee.allocations
              .filter((row) => row.payment.status === "COMPLETED")
              .reduce((sum, row) => sum + row.amount.toNumber(), 0)
            const newlyAllocated = data.allocations.find((a) => a.studentFeeId === fee.id)?.amount ?? 0
            const remaining = fee.amount.toNumber() - previouslyPaid - newlyAllocated
            await tx.studentFee.update({
              where: { id: fee.id },
              data: { status: remaining <= 0.005 ? "PAID" : "PARTIAL" },
            })
          }

          return {
            paymentId: payment.id,
            receiptNumber: payment.receiptNumber,
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      )

      revalidatePath(`/fees/student/${data.studentId}`)
      revalidatePath(`/students/${data.studentId}`)
      revalidatePath("/fees/payments")
      revalidatePath("/fees")
      return { success: true, data: result }
    } catch (error) {
      if (error instanceof FeeValidationError) {
        return { success: false, error: error.message }
      }
      if (isSerializationError(error)) {
        if (attempt < MAX_SERIALIZATION_RETRIES) continue
        return { success: false, error: t("errors.balanceChanged") }
      }
      return { success: false, error: t("errors.saveFailed") }
    }
  }

  return { success: false, error: t("errors.saveFailed") }
}

// Voiding is a single-row compare-and-swap (mirrors GradingScale's guarded
// updateMany for its own "exactly one active" invariant) - no isolation-
// level trickery needed: only one concurrent void can match
// `status: "COMPLETED"`, so a second simultaneous void simply finds
// `count === 0` and reports "already voided/not found".
export async function voidPayment(input: unknown): Promise<VoidActionResult> {
  const user = await requireRole(...FEE_ADMIN_ROLES)
  const t = await getTranslations("fees")

  const parsed = voidPaymentSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  const payment = await prisma.payment.findFirst({
    where: { id: parsed.data.paymentId, schoolId: user.schoolId },
    include: { allocations: true },
  })
  if (!payment) return { success: false, error: t("errors.notFound") }

  const voided = await prisma.payment.updateMany({
    where: { id: payment.id, schoolId: user.schoolId, status: "COMPLETED" },
    data: {
      status: "VOIDED",
      voidedAt: new Date(),
      voidedById: user.userId,
      voidReason: parsed.data.voidReason,
    },
  })
  if (voided.count === 0) return { success: false, error: t("errors.alreadyVoided") }

  // The voided payment's allocations no longer count toward any fee's paid
  // amount (calculateFeeBalance excludes non-COMPLETED payments), so every
  // fee it touched needs its cached status recomputed - never left as PAID
  // for a fee whose payment turned out to be void.
  const affectedFeeIds = [...new Set(payment.allocations.map((allocation) => allocation.studentFeeId))]
  const fees = await prisma.studentFee.findMany({
    where: { id: { in: affectedFeeIds } },
    include: { allocations: { include: { payment: { select: { status: true } } } } },
  })
  for (const fee of fees) {
    if (fee.status === "WAIVED" || fee.status === "CANCELLED") continue
    const balance = calculateFeeBalance(
      fee.amount,
      fee.allocations.map((row) => ({ amount: row.amount, paymentStatus: row.payment.status }))
    )
    await prisma.studentFee.update({ where: { id: fee.id }, data: { status: balance.status } })
  }

  revalidatePath(`/fees/student/${payment.studentId}`)
  revalidatePath("/fees/payments")
  revalidatePath("/fees")
  return { success: true }
}
