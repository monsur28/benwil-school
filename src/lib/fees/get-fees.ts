import "server-only"
import { Prisma, type PaymentMethod, type PaymentStatus } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { calculateFeeBalance, resolveStudentFeeStatus, type AllocationInput } from "@/lib/fees/calculate-fee-balance"

// Prisma-querying orchestration for the Fees module - batched (findMany
// with `in:`, grouped into a Map in JS) rather than one query per row, and
// the only place these models are queried for read purposes. Pure balance
// math lives in calculate-fee-balance.ts; this file's job is turning rows
// into the shapes pages/components render, converting Decimal -> number at
// this final read boundary (never earlier - see calculate-fee-balance.ts).

export type StudentFeeRow = {
  id: string
  name: string
  categoryName: string
  amount: number
  paidAmount: number
  remaining: number
  status: "UNPAID" | "PARTIAL" | "PAID" | "WAIVED" | "CANCELLED"
  dueDate: Date | null
  createdAt: Date
}

export type PaymentRow = {
  id: string
  receiptNumber: string
  amount: number
  method: string
  status: "COMPLETED" | "VOIDED"
  paidAt: Date
  receivedByName: string
  allocations: { studentFeeId: string; feeName: string; amount: number }[]
}

export type StudentFeeOverview = {
  fees: StudentFeeRow[]
  payments: PaymentRow[]
  summary: { totalCharges: number; totalPaid: number; totalOutstanding: number }
}

function toAllocationInputs(
  allocations: { amount: Prisma.Decimal; payment: { status: "COMPLETED" | "VOIDED" } }[]
): AllocationInput[] {
  return allocations.map((allocation) => ({
    amount: allocation.amount,
    paymentStatus: allocation.payment.status,
  }))
}

export async function getStudentFeeOverview(params: {
  schoolId: string
  studentId: string
}): Promise<StudentFeeOverview> {
  const { schoolId, studentId } = params

  const [feeRows, paymentRows] = await Promise.all([
    prisma.studentFee.findMany({
      where: { schoolId, studentId },
      include: {
        feeCategory: { select: { name: true } },
        allocations: { include: { payment: { select: { status: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { schoolId, studentId },
      include: {
        receivedBy: { select: { name: true } },
        allocations: { include: { studentFee: { select: { id: true, name: true } } } },
      },
      orderBy: { paidAt: "desc" },
    }),
  ])

  const fees: StudentFeeRow[] = feeRows.map((fee) => {
    const balance = resolveStudentFeeStatus(fee, toAllocationInputs(fee.allocations))
    return {
      id: fee.id,
      name: fee.name,
      categoryName: fee.feeCategory.name,
      amount: fee.amount.toNumber(),
      paidAmount: balance.paidAmount.toNumber(),
      remaining: balance.remaining.toNumber(),
      status: balance.status,
      dueDate: fee.dueDate,
      createdAt: fee.createdAt,
    }
  })

  const payments: PaymentRow[] = paymentRows.map((payment) => ({
    id: payment.id,
    receiptNumber: payment.receiptNumber,
    amount: payment.amount.toNumber(),
    method: payment.method,
    status: payment.status,
    paidAt: payment.paidAt,
    receivedByName: payment.receivedBy.name,
    allocations: payment.allocations.map((allocation) => ({
      studentFeeId: allocation.studentFee.id,
      feeName: allocation.studentFee.name,
      amount: allocation.amount.toNumber(),
    })),
  }))

  const payable = fees.filter((fee) => fee.status !== "CANCELLED")
  const summary = {
    totalCharges: payable.reduce((sum, fee) => sum + fee.amount, 0),
    totalPaid: payable.reduce((sum, fee) => sum + fee.paidAmount, 0),
    totalOutstanding: payable.reduce((sum, fee) => sum + fee.remaining, 0),
  }

  return { fees, payments, summary }
}

export type OutstandingFeeRow = {
  studentFeeId: string
  studentId: string
  studentName: string
  studentUid: string
  className: string
  sectionName: string
  feeName: string
  amount: number
  paidAmount: number
  remaining: number
  dueDate: Date | null
}

export async function getOutstandingFeesReport(params: {
  schoolId: string
  academicYearId?: string
  classId?: string
  sectionId?: string
  feeCategoryId?: string
}): Promise<OutstandingFeeRow[]> {
  const { schoolId, academicYearId, classId, feeCategoryId, sectionId } = params

  const fees = await prisma.studentFee.findMany({
    where: {
      schoolId,
      status: { in: ["UNPAID", "PARTIAL"] },
      ...(academicYearId ? { academicYearId } : {}),
      ...(feeCategoryId ? { feeCategoryId } : {}),
      student: {
        ...(classId ? { classId } : {}),
        ...(sectionId ? { sectionId } : {}),
      },
    },
    include: {
      student: { select: { id: true, name: true, studentUid: true, class: true, section: true } },
      allocations: { include: { payment: { select: { status: true } } } },
    },
    orderBy: [{ student: { name: "asc" } }],
  })

  return fees.map((fee) => {
    const balance = calculateFeeBalance(fee.amount, toAllocationInputs(fee.allocations))
    return {
      studentFeeId: fee.id,
      studentId: fee.student.id,
      studentName: fee.student.name,
      studentUid: fee.student.studentUid,
      className: fee.student.class.name,
      sectionName: fee.student.section.name,
      feeName: fee.name,
      amount: balance.amount.toNumber(),
      paidAmount: balance.paidAmount.toNumber(),
      remaining: balance.remaining.toNumber(),
      dueDate: fee.dueDate,
    }
  })
}

export type PaymentReportRow = {
  id: string
  receiptNumber: string
  studentName: string
  studentUid: string
  className: string
  amount: number
  method: string
  status: "COMPLETED" | "VOIDED"
  paidAt: Date
  receivedByName: string
}

export async function getPaymentsReport(params: {
  schoolId: string
  dateFrom?: Date
  dateTo?: Date
  classId?: string
  method?: PaymentMethod
  status?: PaymentStatus
  search?: string
}): Promise<PaymentReportRow[]> {
  const { schoolId, dateFrom, dateTo, classId, method, status, search } = params

  const payments = await prisma.payment.findMany({
    where: {
      schoolId,
      ...(dateFrom || dateTo
        ? { paidAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
        : {}),
      ...(method ? { method } : {}),
      ...(status ? { status } : {}),
      ...(classId ? { student: { classId } } : {}),
      ...(search
        ? {
            OR: [
              { receiptNumber: { contains: search, mode: "insensitive" } },
              { student: { name: { contains: search, mode: "insensitive" } } },
              { student: { admissionNumber: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      student: { select: { name: true, studentUid: true, class: { select: { name: true } } } },
      receivedBy: { select: { name: true } },
    },
    orderBy: { paidAt: "desc" },
    take: 200,
  })

  return payments.map((payment) => ({
    id: payment.id,
    receiptNumber: payment.receiptNumber,
    studentName: payment.student.name,
    studentUid: payment.student.studentUid,
    className: payment.student.class.name,
    amount: payment.amount.toNumber(),
    method: payment.method,
    status: payment.status,
    paidAt: payment.paidAt,
    receivedByName: payment.receivedBy.name,
  }))
}

export type PaymentReceipt = {
  id: string
  receiptNumber: string
  amount: number
  method: string
  status: "COMPLETED" | "VOIDED"
  paidAt: Date
  notes: string | null
  receivedByName: string
  voidedAt: Date | null
  voidedByName: string | null
  voidReason: string | null
  student: { id: string; name: string; studentUid: string; admissionNumber: string; className: string; sectionName: string }
  allocations: { feeName: string; amount: number }[]
}

export async function getPaymentReceipt(params: {
  schoolId: string
  paymentId: string
  studentId?: string
}): Promise<PaymentReceipt | null> {
  const { schoolId, paymentId, studentId } = params

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, schoolId, ...(studentId ? { studentId } : {}) },
    include: {
      student: { select: { id: true, name: true, studentUid: true, admissionNumber: true, class: true, section: true } },
      receivedBy: { select: { name: true } },
      voidedBy: { select: { name: true } },
      allocations: { include: { studentFee: { select: { name: true } } } },
    },
  })
  if (!payment) return null

  return {
    id: payment.id,
    receiptNumber: payment.receiptNumber,
    amount: payment.amount.toNumber(),
    method: payment.method,
    status: payment.status,
    paidAt: payment.paidAt,
    notes: payment.notes,
    receivedByName: payment.receivedBy.name,
    voidedAt: payment.voidedAt,
    voidedByName: payment.voidedBy?.name ?? null,
    voidReason: payment.voidReason,
    student: {
      id: payment.student.id,
      name: payment.student.name,
      studentUid: payment.student.studentUid,
      admissionNumber: payment.student.admissionNumber,
      className: payment.student.class.name,
      sectionName: payment.student.section.name,
    },
    allocations: payment.allocations.map((allocation) => ({
      feeName: allocation.studentFee.name,
      amount: allocation.amount.toNumber(),
    })),
  }
}

export type FeeDashboardSummary = {
  totalOutstanding: number
  paymentsTodayAmount: number
  paymentsTodayCount: number
  paymentsThisMonthAmount: number
  studentsWithOutstandingCount: number
}

export async function getFeeDashboardSummary(schoolId: string): Promise<FeeDashboardSummary> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [outstandingFees, todayAgg, monthAgg, distinctStudents] = await Promise.all([
    prisma.studentFee.findMany({
      where: { schoolId, status: { in: ["UNPAID", "PARTIAL"] } },
      include: { allocations: { include: { payment: { select: { status: true } } } } },
    }),
    prisma.payment.aggregate({
      where: { schoolId, status: "COMPLETED", paidAt: { gte: startOfDay } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { schoolId, status: "COMPLETED", paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.studentFee.findMany({
      where: { schoolId, status: { in: ["UNPAID", "PARTIAL"] } },
      select: { studentId: true },
      distinct: ["studentId"],
    }),
  ])

  const totalOutstanding = outstandingFees.reduce((sum, fee) => {
    const balance = calculateFeeBalance(fee.amount, toAllocationInputs(fee.allocations))
    return sum + balance.remaining.toNumber()
  }, 0)

  return {
    totalOutstanding,
    paymentsTodayAmount: todayAgg._sum.amount?.toNumber() ?? 0,
    paymentsTodayCount: todayAgg._count,
    paymentsThisMonthAmount: monthAgg._sum.amount?.toNumber() ?? 0,
    studentsWithOutstandingCount: distinctStudents.length,
  }
}

export type MonthlyCollectionPoint = {
  month: string
  /** Display unit for the dashboard chart. */
  amountLakhs: number
  /** Raw taka, so callers can compute an exact month-on-month change without
      the rounding that the lakh figure applies. */
  amount: number
  /** First day of the month, for building a real axis range label. */
  monthStart: Date
}

// Real monthly collection trend for the admin dashboard's fee chart - one
// query over the trailing `months` calendar months, bucketed in JS (never
// one query per month). Returns amounts in lakhs to match the existing
// dashboard chart's display unit.
export async function getMonthlyCollections(schoolId: string, months = 9): Promise<MonthlyCollectionPoint[]> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)

  const payments = await prisma.payment.findMany({
    where: { schoolId, status: "COMPLETED", paidAt: { gte: start } },
    select: { paidAt: true, amount: true },
  })

  const totalsByMonthKey = new Map<string, number>()
  const orderedKeys: string[] = []
  for (let i = 0; i < months; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    orderedKeys.push(key)
    totalsByMonthKey.set(key, 0)
  }
  for (const payment of payments) {
    const key = `${payment.paidAt.getFullYear()}-${payment.paidAt.getMonth()}`
    if (totalsByMonthKey.has(key)) {
      totalsByMonthKey.set(key, totalsByMonthKey.get(key)! + payment.amount.toNumber())
    }
  }

  return orderedKeys.map((key) => {
    const [year, month] = key.split("-").map(Number)
    const monthStart = new Date(year, month, 1)
    const label = monthStart.toLocaleDateString("en-US", { month: "short" })
    const amount = totalsByMonthKey.get(key)!
    const amountLakhs = Math.round((amount / 100000) * 10) / 10
    return { month: label, amountLakhs, amount, monthStart }
  })
}

export type FeeStructureRow = {
  id: string
  academicYearId: string
  classId: string
  feeCategoryId: string
  name: string
  nameBn: string | null
  categoryName: string
  className: string
  academicYearName: string
  amount: number
  frequency: string
  dueDate: Date | null
  isActive: boolean
}

export async function getFeeStructures(params: {
  schoolId: string
  academicYearId?: string
  classId?: string
  feeCategoryId?: string
}): Promise<FeeStructureRow[]> {
  const { schoolId, academicYearId, classId, feeCategoryId } = params

  const structures = await prisma.feeStructure.findMany({
    where: {
      schoolId,
      ...(academicYearId ? { academicYearId } : {}),
      ...(classId ? { classId } : {}),
      ...(feeCategoryId ? { feeCategoryId } : {}),
    },
    include: { feeCategory: true, class: true, academicYear: true },
    orderBy: [{ academicYear: { name: "desc" } }, { class: { order: "asc" } }, { name: "asc" }],
  })

  return structures.map((structure) => ({
    id: structure.id,
    academicYearId: structure.academicYearId,
    classId: structure.classId,
    feeCategoryId: structure.feeCategoryId,
    name: structure.name,
    nameBn: structure.nameBn,
    categoryName: structure.feeCategory.name,
    className: structure.class.name,
    academicYearName: structure.academicYear.name,
    amount: structure.amount.toNumber(),
    frequency: structure.frequency,
    dueDate: structure.dueDate,
    isActive: structure.isActive,
  }))
}

export type ClassRosterForAssignment = {
  structureName: string
  structureAmount: number
  eligibleStudents: { id: string; name: string; studentUid: string; alreadyAssigned: boolean }[]
}

export async function getClassRosterForAssignment(params: {
  schoolId: string
  structureId: string
}): Promise<ClassRosterForAssignment | null> {
  const { schoolId, structureId } = params

  const structure = await prisma.feeStructure.findFirst({
    where: { id: structureId, schoolId },
  })
  if (!structure) return null

  const students = await prisma.student.findMany({
    where: {
      schoolId,
      classId: structure.classId,
      academicYearId: structure.academicYearId,
      status: "ACTIVE",
    },
    include: { studentFees: { where: { feeStructureId: structureId }, select: { id: true } } },
    orderBy: { roll: "asc" },
  })

  return {
    structureName: structure.name,
    structureAmount: structure.amount.toNumber(),
    eligibleStudents: students.map((student) => ({
      id: student.id,
      name: student.name,
      studentUid: student.studentUid,
      alreadyAssigned: student.studentFees.length > 0,
    })),
  }
}
