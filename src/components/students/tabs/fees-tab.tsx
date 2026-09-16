import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Wallet } from "lucide-react"
import { getStudentFeeOverview } from "@/lib/fees/get-fees"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FeeStatusBadge } from "@/components/fees/fee-status-badge"

export async function FeesTab({ studentId, schoolId }: { studentId: string; schoolId: string }) {
  const tFees = await getTranslations("fees")

  const { fees, summary } = await getStudentFeeOverview({ schoolId, studentId })

  if (fees.length === 0) {
    return <EmptyState icon={Wallet} title={tFees("list.emptyFees")} />
  }

  const recentFees = fees.slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">{tFees("fields.totalCharges")}</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{summary.totalCharges.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">{tFees("fields.totalPaid")}</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{summary.totalPaid.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {tFees("fields.outstandingBalance")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{summary.totalOutstanding.toFixed(2)}</CardContent>
        </Card>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {recentFees.map((fee) => (
              <tr key={fee.id} className="border-b last:border-0">
                <td className="p-3">{fee.name}</td>
                <td className="p-3 text-muted-foreground">{fee.categoryName}</td>
                <td className="p-3">{fee.remaining.toFixed(2)}</td>
                <td className="p-3">
                  <FeeStatusBadge status={fee.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button nativeButton={false} variant="outline" size="sm" render={<Link href={`/fees/student/${studentId}`} />}>
        {tFees("profile.viewAll")}
      </Button>
    </div>
  )
}
