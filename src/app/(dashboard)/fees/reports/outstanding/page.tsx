import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { getOutstandingFeesReport } from "@/lib/fees/get-fees"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { FilterBar } from "@/components/shared/filter-bar"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "@/components/ui/table"
import { Wallet } from "lucide-react"
import { FeesSubNav } from "@/components/fees/fees-subnav"
import { OutstandingFilters } from "@/components/fees/outstanding-filters"

export default async function OutstandingFeesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireRole(...getRolesForHref("/fees/reports/outstanding"))
  const t = await getTranslations("fees")
  const params = await searchParams

  const academicYearId = typeof params.academicYearId === "string" ? params.academicYearId : ""
  const classId = typeof params.classId === "string" ? params.classId : ""
  const feeCategoryId = typeof params.feeCategoryId === "string" ? params.feeCategoryId : ""

  const [rows, academicYears, classes, categories] = await Promise.all([
    getOutstandingFeesReport({
      schoolId: user.schoolId,
      academicYearId: academicYearId || undefined,
      classId: classId || undefined,
      feeCategoryId: feeCategoryId || undefined,
    }),
    prisma.academicYear.findMany({ where: { schoolId: user.schoolId }, orderBy: { name: "desc" } }),
    prisma.class.findMany({ where: { schoolId: user.schoolId }, orderBy: { order: "asc" } }),
    prisma.feeCategory.findMany({ where: { schoolId: user.schoolId }, orderBy: { name: "asc" } }),
  ])

  const totalOutstanding = rows.reduce((sum, row) => sum + row.remaining, 0)

  return (
    <div className="space-y-6">
      <PageHeader title={t("reports.outstandingTitle")} />
      <div className="print:hidden">
        <FeesSubNav />
      </div>
      <FilterBar>
        <OutstandingFilters academicYears={academicYears} classes={classes} categories={categories} />
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState icon={Wallet} title={t("list.empty")} />
      ) : (
        <div className="panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.student")}</TableHead>
                <TableHead>{t("fields.class")}</TableHead>
                <TableHead>{t("fields.name")}</TableHead>
                <TableHead>{t("fields.amount")}</TableHead>
                <TableHead>{t("fields.paid")}</TableHead>
                <TableHead>{t("fields.balance")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.studentFeeId}>
                  <TableCell>
                    {row.studentName} <span className="text-xs text-muted-foreground">({row.studentUid})</span>
                  </TableCell>
                  <TableCell>
                    {row.className} {row.sectionName}
                  </TableCell>
                  <TableCell>{row.feeName}</TableCell>
                  <TableCell>{row.amount.toFixed(2)}</TableCell>
                  <TableCell>{row.paidAmount.toFixed(2)}</TableCell>
                  <TableCell>{row.remaining.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5}>{t("dashboard.totalOutstanding")}</TableCell>
                <TableCell>{totalOutstanding.toFixed(2)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  )
}
