import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { NotebookPen } from "lucide-react"
import { HomeworkSubNav } from "@/components/homework/homework-subnav"
import { HomeworkCategoryDialog } from "@/components/homework/homework-category-dialog"
import { HomeworkCategoryActiveToggle } from "@/components/homework/homework-category-active-toggle"

export default async function HomeworkCategoriesPage() {
  const user = await requireRole(...getRolesForHref("/homework/categories"))
  const t = await getTranslations("homework")

  const categories = await prisma.homeworkCategory.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t("subnav.categories")} actions={<HomeworkCategoryDialog />} />
      <HomeworkSubNav />

      {categories.length === 0 ? (
        <EmptyState icon={NotebookPen} title={t("list.emptyCategories")} />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.name")}</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
                <TableHead className="text-right">{t("actions.label")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.isActive ? t("status.active") : t("status.inactive")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <HomeworkCategoryDialog category={category} />
                      <HomeworkCategoryActiveToggle id={category.id} isActive={category.isActive} />
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
