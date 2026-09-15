import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import { FeesSubNav } from "@/components/fees/fees-subnav"
import { StudentSearchForm } from "@/components/fees/student-search"

export default async function FeesStudentSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const user = await requireRole(...getRolesForHref("/fees/student"))
  const t = await getTranslations("fees")
  const { q } = await searchParams

  const students = q
    ? await prisma.student.findMany({
        where: {
          schoolId: user.schoolId,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { admissionNumber: { contains: q, mode: "insensitive" } },
            { studentUid: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { class: true, section: true },
        orderBy: { name: "asc" },
        take: 50,
      })
    : []

  return (
    <div className="space-y-6">
      <PageHeader title={t("subnav.student")} />
      <FeesSubNav />
      <StudentSearchForm />

      {q && students.length === 0 && <EmptyState icon={Users} title={t("list.empty")} />}

      {students.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.student")}</TableHead>
                <TableHead>{t("fields.class")}</TableHead>
                <TableHead className="text-right">{t("actions.label")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    {student.name} <span className="text-xs text-muted-foreground">({student.admissionNumber})</span>
                  </TableCell>
                  <TableCell>
                    {student.class.name} {student.section.name}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      nativeButton={false}
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/fees/student/${student.id}`} />}
                    >
                      {t("actions.view")}
                    </Button>
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
