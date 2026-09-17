import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { getResultOverviewRows } from "@/lib/results/get-results"
import { getTeacherClassSectionPairs } from "@/lib/academics/teacher-assignments"
import { PageHeader } from "@/components/shared/page-header"
import { FilterBar } from "@/components/shared/filter-bar"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ResultsSubNav } from "@/components/results/results-subnav"
import { ResultFilters } from "@/components/results/result-filters"

export default async function ResultsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireRole(...getRolesForHref("/results"))
  const t = await getTranslations("results")
  const params = await searchParams

  const academicYearId = typeof params.academicYearId === "string" ? params.academicYearId : ""
  const examId = typeof params.examId === "string" ? params.examId : ""
  const classId = typeof params.classId === "string" ? params.classId : ""

  let restrictToClassIds: string[] | undefined
  if (user.role === Role.TEACHER) {
    // This overview spans every exam/year by default - scope to the
    // filtered year when one is selected, otherwise show classes the
    // teacher has ever been assigned to (matches the existing "all years"
    // overview behavior when no year filter is applied).
    const triples = await getTeacherClassSectionPairs(user.userId, academicYearId || null)
    restrictToClassIds = Array.from(new Set(triples.map((triple) => triple.classId)))
  }

  const [rows, academicYears, exams, classes] = await Promise.all([
    getResultOverviewRows({
      schoolId: user.schoolId,
      academicYearId: academicYearId || undefined,
      examId: examId || undefined,
      classId: classId || undefined,
      restrictToClassIds,
    }),
    prisma.academicYear.findMany({ where: { schoolId: user.schoolId }, orderBy: { name: "desc" } }),
    prisma.exam.findMany({ where: { schoolId: user.schoolId }, orderBy: { startDate: "desc" } }),
    prisma.class.findMany({ where: { schoolId: user.schoolId }, orderBy: { order: "asc" } }),
  ])

  // A row links to /results/[examId]/[classId]/[sectionId] - resolve each
  // class's first section once, batched, rather than a query per row.
  const sections = await prisma.section.findMany({
    where: { class: { schoolId: user.schoolId } },
    orderBy: { name: "asc" },
    select: { id: true, classId: true },
  })
  const firstSectionByClassId = new Map<string, string>()
  for (const section of sections) {
    if (!firstSectionByClassId.has(section.classId)) {
      firstSectionByClassId.set(section.classId, section.id)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      <ResultsSubNav />
      <FilterBar>
        <ResultFilters academicYears={academicYears} exams={exams} classes={classes} />
      </FilterBar>
      <div className="panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.exam")}</TableHead>
              <TableHead>{t("fields.academicYear")}</TableHead>
              <TableHead>{t("fields.class")}</TableHead>
              <TableHead>{t("fields.status")}</TableHead>
              <TableHead>{t("status.draft")}/{t("status.finalized")}</TableHead>
              <TableHead className="text-right">{t("actions.label")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {t("list.empty")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const sectionId = firstSectionByClassId.get(row.classId)
                return (
                  <TableRow key={`${row.examId}-${row.classId}`}>
                    <TableCell>
                      {row.examName} <span className="text-xs text-muted-foreground">({row.examTypeName})</span>
                    </TableCell>
                    <TableCell>{row.academicYearName}</TableCell>
                    <TableCell>{row.className}</TableCell>
                    <TableCell>{row.isComplete ? t("status.complete") : t("status.incomplete")}</TableCell>
                    <TableCell>{row.resultStatus === "FINALIZED" ? t("status.finalized") : t("status.draft")}</TableCell>
                    <TableCell className="text-right">
                      {sectionId ? (
                        <Button
                          nativeButton={false}
                          variant="ghost"
                          size="sm"
                          render={<Link href={`/results/${row.examId}/${row.classId}/${sectionId}`} />}
                        >
                          {t("list.openClass")}
                        </Button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
