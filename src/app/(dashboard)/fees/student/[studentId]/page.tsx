import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { UserX } from "lucide-react"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { getStudentFeeOverview } from "@/lib/fees/get-fees"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FeesSubNav } from "@/components/fees/fees-subnav"
import { FeeStatusBadge } from "@/components/fees/fee-status-badge"
import { AssignFeeDialog } from "@/components/fees/assign-fee-dialog"
import { WaiveCancelDialog } from "@/components/fees/waive-cancel-dialog"

export default async function StudentFeeOverviewPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const user = await requireRole(...getRolesForHref("/fees/student"))
  const t = await getTranslations("fees")
  const { studentId } = await params

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId: user.schoolId },
    include: { class: true, section: true, academicYear: true },
  })
  if (!student) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState icon={UserX} title={t("errors.notFound")} />
      </div>
    )
  }

  const [{ fees, payments, summary }, structures, categories] = await Promise.all([
    getStudentFeeOverview({ schoolId: user.schoolId, studentId }),
    prisma.feeStructure.findMany({
      where: { schoolId: user.schoolId, classId: student.classId, academicYearId: student.academicYearId, isActive: true },
      select: { id: true, name: true, amount: true, feeCategoryId: true },
    }),
    prisma.feeCategory.findMany({ where: { schoolId: user.schoolId, isActive: true }, select: { id: true, name: true } }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title={student.name}
        description={`${student.class.name} ${student.section.name} · ${student.academicYear.name}`}
        actions={
          <div className="flex gap-2">
            <AssignFeeDialog
              studentId={student.id}
              academicYearId={student.academicYearId}
              structures={structures.map((s) => ({ ...s, amount: s.amount.toNumber() }))}
              categories={categories}
            />
            <Button nativeButton={false} render={<Link href={`/fees/payments/new?studentId=${student.id}`} />}>
              {t("actions.recordPayment")}
            </Button>
          </div>
        }
      />
      <FeesSubNav />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">{t("fields.totalCharges")}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.totalCharges.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">{t("fields.totalPaid")}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.totalPaid.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">{t("fields.outstandingBalance")}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.totalOutstanding.toFixed(2)}</CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-sm font-semibold">{t("subnav.student")}</h2>
        {fees.length === 0 ? (
          <EmptyState icon={UserX} title={t("list.emptyFees")} />
        ) : (
          <div className="panel overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fields.name")}</TableHead>
                  <TableHead>{t("fields.category")}</TableHead>
                  <TableHead>{t("fields.amount")}</TableHead>
                  <TableHead>{t("fields.paid")}</TableHead>
                  <TableHead>{t("fields.balance")}</TableHead>
                  <TableHead>{t("fields.status")}</TableHead>
                  <TableHead className="text-right">{t("actions.label")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell>{fee.name}</TableCell>
                    <TableCell>{fee.categoryName}</TableCell>
                    <TableCell>{fee.amount.toFixed(2)}</TableCell>
                    <TableCell>{fee.paidAmount.toFixed(2)}</TableCell>
                    <TableCell>{fee.remaining.toFixed(2)}</TableCell>
                    <TableCell>
                      <FeeStatusBadge status={fee.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {fee.status === "UNPAID" && (
                        <div className="flex justify-end gap-1">
                          <WaiveCancelDialog studentFeeId={fee.id} mode="waive" />
                          <WaiveCancelDialog studentFeeId={fee.id} mode="cancel" />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-heading text-sm font-semibold">{t("subnav.payments")}</h2>
        {payments.length === 0 ? (
          <EmptyState icon={UserX} title={t("list.emptyPayments")} />
        ) : (
          <div className="panel overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fields.receiptNumber")}</TableHead>
                  <TableHead>{t("fields.paymentDate")}</TableHead>
                  <TableHead>{t("fields.amount")}</TableHead>
                  <TableHead>{t("fields.paymentMethod")}</TableHead>
                  <TableHead>{t("fields.status")}</TableHead>
                  <TableHead className="text-right">{t("actions.label")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.receiptNumber}</TableCell>
                    <TableCell>{payment.paidAt.toLocaleDateString()}</TableCell>
                    <TableCell>{payment.amount.toFixed(2)}</TableCell>
                    <TableCell>{t(`method.${payment.method}`)}</TableCell>
                    <TableCell>{t(`status.${payment.status}`)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        nativeButton={false}
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/fees/payments/${payment.id}/receipt`} />}
                      >
                        {t("actions.view")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
