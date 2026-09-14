import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Role, type Prisma } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { PageHeader } from "@/components/shared/page-header"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ExamsSubNav } from "@/components/exams/exams-subnav"
import { ExamDialog } from "@/components/exams/exam-dialog"
import { ExamActiveToggle } from "@/components/exams/exam-active-toggle"
import { ExamFilters } from "@/components/exams/exam-filters"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireRole(...getRolesForHref("/exams"))
  const t = await getTranslations("exams")
  const params = await searchParams

  const search = typeof params.search === "string" ? params.search.trim() : ""
  const academicYearId = typeof params.academicYearId === "string" ? params.academicYearId : ""
  const examTypeId = typeof params.examTypeId === "string" ? params.examTypeId : ""
  const status = typeof params.status === "string" ? params.status : ""

  const where: Prisma.ExamWhereInput = {
    schoolId: user.schoolId,
    ...(search && { name: { contains: search, mode: "insensitive" } }),
    ...(academicYearId && { academicYearId }),
    ...(examTypeId && { examTypeId }),
    ...(status === "active" && { isActive: true }),
    ...(status === "inactive" && { isActive: false }),
  }

  const canManage = CAN_MANAGE.includes(user.role)

  const [exams, academicYears, examTypes] = await Promise.all([
    prisma.exam.findMany({
      where,
      include: { academicYear: true, examType: true },
      orderBy: { startDate: "desc" },
    }),
    prisma.academicYear.findMany({ where: { schoolId: user.schoolId }, orderBy: { name: "desc" } }),
    prisma.examType.findMany({ where: { schoolId: user.schoolId, isActive: true }, orderBy: { name: "asc" } }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={canManage && <ExamDialog academicYears={academicYears} examTypes={examTypes} />}
      />
      <ExamsSubNav />
      <ExamFilters academicYears={academicYears} examTypes={examTypes} />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.name")}</TableHead>
              <TableHead>{t("fields.examType")}</TableHead>
              <TableHead>{t("fields.academicYear")}</TableHead>
              <TableHead>{t("fields.startDate")}</TableHead>
              <TableHead>{t("fields.endDate")}</TableHead>
              <TableHead>{t("fields.status")}</TableHead>
              <TableHead className="text-right">{t("actions.label")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {t("list.empty")}
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>
                    <Link href={`/exams/${exam.id}`} className="font-medium hover:underline">
                      {exam.name}
                    </Link>
                  </TableCell>
                  <TableCell>{exam.examType.name}</TableCell>
                  <TableCell>{exam.academicYear.name}</TableCell>
                  <TableCell>{exam.startDate.toLocaleDateString()}</TableCell>
                  <TableCell>{exam.endDate.toLocaleDateString()}</TableCell>
                  <TableCell>{exam.isActive ? t("status.active") : t("status.inactive")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        nativeButton={false}
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/exams/${exam.id}`} />}
                      >
                        {t("list.viewDetail")}
                      </Button>
                      {canManage && (
                        <>
                          <ExamDialog academicYears={academicYears} examTypes={examTypes} exam={exam} />
                          <ExamActiveToggle id={exam.id} isActive={exam.isActive} />
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
