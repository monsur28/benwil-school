import "server-only"
import { Prisma } from "@prisma/client"

export function isUniqueConstraintError(
  error: unknown
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

// P2034: "Transaction failed due to a write conflict or a deadlock" - the
// error Prisma surfaces when a Serializable transaction is aborted by
// Postgres because a concurrent transaction committed a conflicting change
// first. Expected and retriable, not a real failure - see createPayment in
// src/actions/fees/payments.ts for the one place this is used today.
export function isSerializationError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
}

// Prisma 7's driver adapters (see @prisma/adapter-pg) don't always populate
// `error.meta.target` as a plain string array the way the old query engine
// did — the pg adapter instead nests the underlying Postgres constraint name
// under `meta.driverAdapterError.cause.constraint.index`. Check both shapes
// so this keeps working regardless of which one a given error takes.
export function uniqueConstraintTouches(
  error: Prisma.PrismaClientKnownRequestError,
  field: string
): boolean {
  const target = error.meta?.target
  if (Array.isArray(target) && target.some((column) => String(column).includes(field))) {
    return true
  }

  const meta = error.meta as Record<string, unknown> | undefined
  const driverAdapterError = meta?.driverAdapterError as
    | { cause?: { constraint?: { index?: string } } }
    | undefined
  const index = driverAdapterError?.cause?.constraint?.index

  return typeof index === "string" && index.includes(field)
}
