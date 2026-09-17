import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { AlertCircle, Plus, Receipt } from "lucide-react"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { getFeeDashboardSummary, getMonthlyCollections, getFeeStructures } from "@/lib/fees/get-fees"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { FeesSubNav } from "@/components/fees/fees-subnav"
import { FeesQuickActions } from "@/components/fees/fees-quick-actions"
import { FeesKpiBand } from "@/components/fees/fees-kpi-band"
import { RecentPaymentsCard, type RecentPaymentItem } from "@/components/fees/recent-payments-card"
import { FeeCollectionTrend } from "@/components/fees/fee-collection-trend"
import { FeeLookupWidget } from "@/components/fees/fee-lookup-widget"

export default async function FeesDashboardPage() {
  const user = await requireRole(...getRolesForHref("/fees"))
  const t = await getTranslations("fees")

  const [summary, monthlyData, recentPayments, structures, methodAggregates] = await Promise.all([
    getFeeDashboardSummary(user.schoolId),
    getMonthlyCollections(user.schoolId, 6),
    prisma.payment.findMany({
      where: { schoolId: user.schoolId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentUid: true,
            roll: true,
            class: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
        receivedBy: { select: { name: true } },
      },
      orderBy: { paidAt: "desc" },
      take: 6,
    }),
    getFeeStructures({ schoolId: user.schoolId }),
    prisma.payment.groupBy({
      by: ["method"],
      where: { schoolId: user.schoolId, status: "COMPLETED" },
      _count: true,
      _sum: { amount: true },
    }),
  ])

  const recentPaymentsFormatted: RecentPaymentItem[] = recentPayments.map((p) => ({
    id: p.id,
    receiptNumber: p.receiptNumber,
    amount: p.amount.toNumber(),
    method: p.method,
    status: p.status as "COMPLETED" | "VOIDED",
    paidAt: p.paidAt,
    student: p.student,
    receivedBy: p.receivedBy,
  }))

  const paymentMethodsSummary = methodAggregates.map((m) => ({
    method: m.method,
    count: m._count,
    totalAmount: m._sum.amount?.toNumber() ?? 0,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("dashboard.subtitle")}
        actions={
          <Button
            nativeButton={false}
            render={<Link href="/fees/student" />}
            className="gap-1.5 font-medium shadow-2xs"
          >
            <Plus className="size-4" />
            {t("dashboard.collectFee")}
          </Button>
        }
      />

      <FeesSubNav />

      {/* Financial Quick Action Shortcuts */}
      <FeesQuickActions />

      {/* Core Executive KPI Band */}
      <FeesKpiBand summary={summary} />

      {/* 2-Column Financial Grid (8 cols / 4 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Primary Left Column */}
        <div className="space-y-6 lg:col-span-8">
          <RecentPaymentsCard payments={recentPaymentsFormatted} />
          <FeeCollectionTrend monthlyData={monthlyData} />
        </div>

        {/* Supporting Right Column */}
        <div className="space-y-6 lg:col-span-4">
          <FeeLookupWidget
            structures={structures.filter((s) => s.isActive)}
            paymentMethodsSummary={paymentMethodsSummary}
          />
        </div>
      </div>
    </div>
  )
}
