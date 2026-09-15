import { Prisma } from "@prisma/client"

// The single source of truth for turning a StudentFee's raw payment
// allocations into a paid amount, a remaining balance, and a status. Pure
// and DB-free on purpose (see src/lib/fees/get-fees.ts for the Prisma-
// querying orchestration that feeds this) so every caller - the fee list,
// the student overview, the portal, the reports - computes balances the
// exact same way. A WAIVED/CANCELLED fee's status is set directly by the
// waive/cancel actions and is never overwritten by this calculation (see
// resolveStudentFeeStatus below).
//
// Kept in Prisma.Decimal space end-to-end rather than converting to a plain
// number early (contrast calculate-result.ts, which converts percentages to
// numbers immediately): summing many currency allocations over the life of
// a fee is more exposed to float drift than a single percentage comparison,
// so money stays in exact decimal arithmetic all the way to the UI-
// formatting boundary.

export type AllocationInput = {
  amount: Prisma.Decimal
  paymentStatus: "COMPLETED" | "VOIDED"
}

export type PayableFeeStatus = "UNPAID" | "PARTIAL" | "PAID"

export type FeeBalance = {
  amount: Prisma.Decimal
  paidAmount: Prisma.Decimal
  remaining: Prisma.Decimal
  status: PayableFeeStatus
}

const ZERO = new Prisma.Decimal(0)

// Only meaningful for a fee that is still in the normal payable lifecycle.
// WAIVED/CANCELLED fees never reach this - see resolveStudentFeeStatus.
export function calculateFeeBalance(feeAmount: Prisma.Decimal, allocations: AllocationInput[]): FeeBalance {
  const paidAmount = allocations
    .filter((allocation) => allocation.paymentStatus === "COMPLETED")
    .reduce((sum, allocation) => sum.plus(allocation.amount), ZERO)

  const remainingRaw = feeAmount.minus(paidAmount)
  const remaining = remainingRaw.isNegative() ? ZERO : remainingRaw

  const status: PayableFeeStatus = remaining.isZero() ? "PAID" : paidAmount.isZero() ? "UNPAID" : "PARTIAL"

  return { amount: feeAmount, paidAmount, remaining, status }
}

// A StudentFee's *stored* status is WAIVED/CANCELLED once either action has
// been taken (permanent, not recomputed from payments), otherwise it's the
// live calculation above. This is what every read path should call rather
// than calculateFeeBalance directly, so a waived/cancelled fee is never
// silently reported back to UNPAID/PARTIAL/PAID.
export function resolveStudentFeeStatus(
  fee: { status: "UNPAID" | "PARTIAL" | "PAID" | "WAIVED" | "CANCELLED"; amount: Prisma.Decimal },
  allocations: AllocationInput[]
): { paidAmount: Prisma.Decimal; remaining: Prisma.Decimal; status: "UNPAID" | "PARTIAL" | "PAID" | "WAIVED" | "CANCELLED" } {
  if (fee.status === "WAIVED" || fee.status === "CANCELLED") {
    return { paidAmount: ZERO, remaining: ZERO, status: fee.status }
  }
  const balance = calculateFeeBalance(fee.amount, allocations)
  return { paidAmount: balance.paidAmount, remaining: balance.remaining, status: balance.status }
}
