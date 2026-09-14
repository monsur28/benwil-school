import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { PageHeader } from "@/components/shared/page-header"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { ExamsSubNav } from "@/components/exams/exams-subnav"
import { ExamTypeDialog } from "@/components/exams/exam-type-dialog"
import { ExamTypeActiveToggle } from "@/components/exams/exam-type-active-toggle"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export default async function ExamTypesPage() {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("exams")

  const examTypes = await prisma.examType.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t("types.title")} actions={<ExamTypeDialog />} />
      <ExamsSubNav />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.name")}</TableHead>
              <TableHead>{t("fields.nameBn")}</TableHead>
              <TableHead>{t("fields.status")}</TableHead>
              <TableHead className="text-right">{t("actions.label")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {examTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  {t("types.empty")}
                </TableCell>
              </TableRow>
            ) : (
              examTypes.map((examType) => (
                <TableRow key={examType.id}>
                  <TableCell>{examType.name}</TableCell>
                  <TableCell>{examType.nameBn ?? "—"}</TableCell>
                  <TableCell>
                    {examType.isActive ? t("status.active") : t("status.inactive")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <ExamTypeDialog examType={examType} />
                      <ExamTypeActiveToggle id={examType.id} isActive={examType.isActive} />
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
