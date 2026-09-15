import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { getStudentFeeOverview } from "@/lib/fees/get-fees"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { UserX } from "lucide-react"
import { RecordPaymentForm } from "@/components/fees/record-payment-form"

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>
}) {
  const user = await requireRole(...getRolesForHref("/fees/payments"))
  const t = await getTranslations("fees")
  const { studentId } = await searchParams

  const student = studentId
    ? await prisma.student.findFirst({
        where: { id: studentId, schoolId: user.schoolId },
        include: { class: true, section: true },
      })
    : null

  if (!student) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState icon={UserX} title={t("errors.notFound")} />
      </div>
    )
  }

  const { fees } = await getStudentFeeOverview({ schoolId: user.schoolId, studentId: student.id })
  const outstandingFees = fees
    .filter((fee) => fee.status === "UNPAID" || fee.status === "PARTIAL")
    .map((fee) => ({ id: fee.id, name: fee.name, remaining: fee.remaining }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("payment.title")}
        description={`${student.name} · ${student.class.name} ${student.section.name}`}
      />
      <RecordPaymentForm studentId={student.id} outstandingFees={outstandingFees} />
    </div>
  )
}
