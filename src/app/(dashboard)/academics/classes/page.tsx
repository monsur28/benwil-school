import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getRolesForHref } from "@/lib/permissions/nav"
import { PageHeader } from "@/components/shared/page-header"
import { AcademicsSubNav } from "@/components/academics/academics-subnav"
import { ActiveBadge } from "@/components/academics/active-badge"
import { ClassDialog } from "@/components/academics/class-dialog"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

export default async function ClassesPage() {
  const user = await requireRole(...getRolesForHref("/academics"))
  const t = await getTranslations("academics")

  const classes = await prisma.class.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { order: "asc" },
    include: { _count: { select: { sections: true, students: true } } },
  })
  const nextOrder = (classes.at(-1)?.order ?? 0) + 1

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} actions={<ClassDialog defaultOrder={nextOrder} />} />
      <AcademicsSubNav />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("fields.name")}</TableHead>
            <TableHead>{t("fields.sections")}</TableHead>
            <TableHead>{t("fields.students")}</TableHead>
            <TableHead>{t("fields.status")}</TableHead>
            <TableHead className="text-right">{t("actions.title")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((klass) => (
            <TableRow key={klass.id}>
              <TableCell>
                <Link href={`/academics/classes/${klass.id}`} className="font-medium text-foreground hover:underline">
                  {klass.name}
                </Link>
              </TableCell>
              <TableCell>{klass._count.sections}</TableCell>
              <TableCell>{klass._count.students}</TableCell>
              <TableCell>
                <ActiveBadge
                  isActive={klass.isActive}
                  activeLabel={t("status.active")}
                  inactiveLabel={t("status.inactive")}
                />
              </TableCell>
              <TableCell className="text-right">
                <ClassDialog klass={klass} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
