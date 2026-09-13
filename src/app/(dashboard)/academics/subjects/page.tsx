import { getTranslations } from "next-intl/server"
import { BookOpen } from "lucide-react"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getRolesForHref } from "@/lib/permissions/nav"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { AcademicsSubNav } from "@/components/academics/academics-subnav"
import { ActiveBadge } from "@/components/academics/active-badge"
import { SubjectDialog } from "@/components/academics/subject-dialog"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

export default async function SubjectsPage() {
  const user = await requireRole(...getRolesForHref("/academics"))
  const t = await getTranslations("academics")

  const subjects = await prisma.subject.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} actions={<SubjectDialog />} />
      <AcademicsSubNav />

      {subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title={t("classDetail.noSubjects")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.name")}</TableHead>
              <TableHead>{t("fields.nameBn")}</TableHead>
              <TableHead>{t("fields.code")}</TableHead>
              <TableHead>{t("fields.status")}</TableHead>
              <TableHead className="text-right">{t("actions.title")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell className="font-medium text-foreground">{subject.name}</TableCell>
                <TableCell>{subject.nameBn ?? "—"}</TableCell>
                <TableCell>{subject.code}</TableCell>
                <TableCell>
                  <ActiveBadge
                    isActive={subject.isActive}
                    activeLabel={t("status.active")}
                    inactiveLabel={t("status.inactive")}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <SubjectDialog subject={subject} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
