import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { getFeeDashboardSummary } from "@/lib/fees/get-fees"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FeesSubNav } from "@/components/fees/fees-subnav"

export default async function FeesDashboardPage() {
  const user = await requireRole(...getRolesForHref("/fees"))
  const t = await getTranslations("fees")

  const summary = await getFeeDashboardSummary(user.schoolId)

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      <FeesSubNav />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">{t("dashboard.totalOutstanding")}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.totalOutstanding.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">{t("dashboard.paymentsToday")}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary.paymentsTodayAmount.toFixed(2)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">({summary.paymentsTodayCount})</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">{t("dashboard.paymentsThisMonth")}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.paymentsThisMonthAmount.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {t("dashboard.studentsWithOutstanding")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.studentsWithOutstandingCount}</CardContent>
        </Card>
      </div>
    </div>
  )
}
