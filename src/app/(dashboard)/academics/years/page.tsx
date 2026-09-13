import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getRolesForHref } from "@/lib/permissions/nav"
import { PageHeader } from "@/components/shared/page-header"
import { AcademicsSubNav } from "@/components/academics/academics-subnav"
import { ActiveBadge } from "@/components/academics/active-badge"
import { AcademicYearDialog } from "@/components/academics/academic-year-dialog"
import { ActivateYearButton } from "@/components/academics/activate-year-button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

export default async function AcademicYearsPage() {
  const user = await requireRole(...getRolesForHref("/academics"))
  const t = await getTranslations("academics")

  const years = await prisma.academicYear.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { name: "desc" },
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} actions={<AcademicYearDialog />} />
      <AcademicsSubNav />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("fields.name")}</TableHead>
            <TableHead>{t("fields.status")}</TableHead>
            <TableHead className="text-right">{t("actions.title")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {years.map((year) => (
            <TableRow key={year.id}>
              <TableCell className="font-medium text-foreground">{year.name}</TableCell>
              <TableCell>
                <ActiveBadge
                  isActive={year.isActive}
                  activeLabel={t("status.active")}
                  inactiveLabel={t("status.inactive")}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {!year.isActive && <ActivateYearButton id={year.id} />}
                  <AcademicYearDialog academicYear={{ id: year.id, name: year.name }} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
