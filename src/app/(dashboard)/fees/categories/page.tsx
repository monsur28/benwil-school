import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Wallet } from "lucide-react"
import { FeesSubNav } from "@/components/fees/fees-subnav"
import { FeeCategoryDialog } from "@/components/fees/fee-category-dialog"
import { FeeCategoryActiveToggle } from "@/components/fees/fee-category-active-toggle"

export default async function FeeCategoriesPage() {
  const user = await requireRole(...getRolesForHref("/fees/categories"))
  const t = await getTranslations("fees")

  const categories = await prisma.feeCategory.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t("subnav.categories")} actions={<FeeCategoryDialog />} />
      <FeesSubNav />

      {categories.length === 0 ? (
        <EmptyState icon={Wallet} title={t("list.emptyCategories")} />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.name")}</TableHead>
                <TableHead>{t("fields.description")}</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
                <TableHead className="text-right">{t("actions.label")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    {category.name}
                    {category.nameBn && <span className="ml-2 text-xs text-muted-foreground">({category.nameBn})</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{category.description ?? "—"}</TableCell>
                  <TableCell>{category.isActive ? t("status.active") : t("status.inactive")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <FeeCategoryDialog category={category} />
                      <FeeCategoryActiveToggle id={category.id} isActive={category.isActive} />
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
