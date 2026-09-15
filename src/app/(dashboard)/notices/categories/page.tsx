import { getTranslations, getLocale } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { pickLocalized } from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Megaphone } from "lucide-react"
import { NoticesSubNav } from "@/components/notices/notices-subnav"
import { NoticeCategoryDialog } from "@/components/notices/notice-category-dialog"
import { NoticeCategoryActiveToggle } from "@/components/notices/notice-category-active-toggle"

export default async function NoticeCategoriesPage() {
  const user = await requireRole(...getRolesForHref("/notices/categories"))
  const [t, locale] = await Promise.all([getTranslations("notices"), getLocale()])

  const categories = await prisma.noticeCategory.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t("subnav.categories")} actions={<NoticeCategoryDialog />} />
      <NoticesSubNav />

      {categories.length === 0 ? (
        <EmptyState icon={Megaphone} title={t("list.emptyCategories")} />
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
                  <TableCell>{pickLocalized(category.name, category.nameBn, locale)}</TableCell>
                  <TableCell>{category.isActive ? t("status.active") : t("status.inactive")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <NoticeCategoryDialog category={category} />
                      <NoticeCategoryActiveToggle id={category.id} isActive={category.isActive} />
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
