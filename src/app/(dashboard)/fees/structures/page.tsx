import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { getFeeStructures } from "@/lib/fees/get-fees"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Wallet, Users } from "lucide-react"
import { FeesSubNav } from "@/components/fees/fees-subnav"
import { FeeStructureDialog } from "@/components/fees/fee-structure-dialog"
import { FeeStructureActiveToggle } from "@/components/fees/fee-structure-active-toggle"

export default async function FeeStructuresPage() {
  const user = await requireRole(...getRolesForHref("/fees/structures"))
  const t = await getTranslations("fees")

  const [structures, academicYears, classes, categories] = await Promise.all([
    getFeeStructures({ schoolId: user.schoolId }),
    prisma.academicYear.findMany({ where: { schoolId: user.schoolId }, orderBy: { name: "desc" } }),
    prisma.class.findMany({ where: { schoolId: user.schoolId }, orderBy: { order: "asc" } }),
    prisma.feeCategory.findMany({ where: { schoolId: user.schoolId, isActive: true }, orderBy: { name: "asc" } }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("subnav.structures")}
        actions={<FeeStructureDialog academicYears={academicYears} classes={classes} categories={categories} />}
      />
      <FeesSubNav />

      {structures.length === 0 ? (
        <EmptyState icon={Wallet} title={t("list.emptyStructures")} />
      ) : (
        <div className="panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.name")}</TableHead>
                <TableHead>{t("fields.category")}</TableHead>
                <TableHead>{t("fields.class")}</TableHead>
                <TableHead>{t("fields.academicYear")}</TableHead>
                <TableHead>{t("fields.amount")}</TableHead>
                <TableHead>{t("fields.frequency")}</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
                <TableHead className="text-right">{t("actions.label")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {structures.map((structure) => (
                <TableRow key={structure.id}>
                  <TableCell>{structure.name}</TableCell>
                  <TableCell>{structure.categoryName}</TableCell>
                  <TableCell>{structure.className}</TableCell>
                  <TableCell>{structure.academicYearName}</TableCell>
                  <TableCell>{structure.amount.toFixed(2)}</TableCell>
                  <TableCell>{t(`frequency.${structure.frequency}`)}</TableCell>
                  <TableCell>{structure.isActive ? t("status.active") : t("status.inactive")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        nativeButton={false}
                        variant="ghost"
                        size="icon-sm"
                        render={<Link href={`/fees/structures/${structure.id}/assign`} />}
                        title={t("actions.assignToClass")}
                      >
                        <Users />
                      </Button>
                      <FeeStructureDialog
                        academicYears={academicYears}
                        classes={classes}
                        categories={categories}
                        structure={structure}
                      />
                      <FeeStructureActiveToggle id={structure.id} isActive={structure.isActive} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
