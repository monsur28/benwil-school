"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { RESULT_ADMIN_ROLES } from "@/lib/results/result-access"

export type GradingActionResult = { error?: string }

// Finalizing/reopening applies to the whole exam (every schedule, every
// class/section) - matching the spec's suggested Exam.resultStatus field
// exactly, and keeping this a single simple lock rather than a per-class
// approval workflow. Both directions are ADMIN_ROLES-only; a teacher
// cannot reach either action (requireRole redirects before any DB call).
export async function finalizeExamResults(examId: string): Promise<GradingActionResult> {
  const user = await requireRole(...RESULT_ADMIN_ROLES)
  const t = await getTranslations("results")

  const exam = await prisma.exam.findFirst({
    where: { id: examId, schoolId: user.schoolId },
    select: { id: true, resultStatus: true },
  })
  if (!exam) return { error: t("errors.notFound") }
  if (exam.resultStatus === "FINALIZED") return { error: t("errors.alreadyFinalized") }

  await prisma.exam.update({
    where: { id: examId },
    data: {
      resultStatus: "FINALIZED",
      resultStatusChangedAt: new Date(),
      resultStatusChangedById: user.userId,
    },
  })

  revalidatePath("/results")
  return {}
}

export async function reopenExamResults(examId: string): Promise<GradingActionResult> {
  const user = await requireRole(...RESULT_ADMIN_ROLES)
  const t = await getTranslations("results")

  const exam = await prisma.exam.findFirst({
    where: { id: examId, schoolId: user.schoolId },
    select: { id: true, resultStatus: true },
  })
  if (!exam) return { error: t("errors.notFound") }
  if (exam.resultStatus === "DRAFT") return { error: t("errors.alreadyDraft") }

  await prisma.exam.update({
    where: { id: examId },
    data: {
      resultStatus: "DRAFT",
      resultStatusChangedAt: new Date(),
      resultStatusChangedById: user.userId,
    },
  })

  revalidatePath("/results")
  return {}
}
