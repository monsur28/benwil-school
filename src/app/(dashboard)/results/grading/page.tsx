import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { RESULT_ADMIN_ROLES } from "@/lib/results/result-access"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { Sparkles } from "lucide-react"
import { ResultsSubNav } from "@/components/results/results-subnav"
import { GradingScaleDialog } from "@/components/results/grading-scale-dialog"
import { GradingScaleActiveToggle } from "@/components/results/grading-scale-active-toggle"
import { GradeRuleDialog } from "@/components/results/grade-rule-dialog"
import { DeleteGradeRuleButton } from "@/components/results/delete-grade-rule-button"

export default async function GradingPage() {
  const user = await requireRole(...RESULT_ADMIN_ROLES)
  const t = await getTranslations("results")

  const gradingScales = await prisma.gradingScale.findMany({
    where: { schoolId: user.schoolId },
    include: { gradeRules: { orderBy: { minPercentage: "desc" } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t("grading.title")} actions={<GradingScaleDialog />} />
      <ResultsSubNav />

      {gradingScales.length === 0 ? (
        <EmptyState icon={Sparkles} title={t("grading.empty")} />
      ) : (
        <div className="space-y-4">
          {gradingScales.map((scale) => (
            <Card key={scale.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    {scale.name}
                    {scale.nameBn && <span className="ml-2 font-normal text-muted-foreground">({scale.nameBn})</span>}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {scale.isActive ? t("status.active") : t("status.inactive")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <GradeRuleDialog gradingScaleId={scale.id} />
                  <GradingScaleDialog gradingScale={{ id: scale.id, name: scale.name, nameBn: scale.nameBn, isActive: scale.isActive }} />
                  <GradingScaleActiveToggle id={scale.id} isActive={scale.isActive} />
                </div>
              </CardHeader>
              <CardContent>
                {scale.gradeRules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("grading.noRules")}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("fields.minPercentage")}</TableHead>
                        <TableHead>{t("fields.maxPercentage")}</TableHead>
                        <TableHead>{t("fields.grade")}</TableHead>
                        <TableHead>{t("fields.gradeBn")}</TableHead>
                        <TableHead>{t("fields.gradePoint")}</TableHead>
                        <TableHead className="text-right">{t("actions.label")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scale.gradeRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>{rule.minPercentage.toString()}</TableCell>
                          <TableCell>{rule.maxPercentage.toString()}</TableCell>
                          <TableCell>{rule.grade}</TableCell>
                          <TableCell>{rule.gradeBn ?? "—"}</TableCell>
                          <TableCell>{rule.gradePoint.toString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <GradeRuleDialog
                                gradingScaleId={scale.id}
                                gradeRule={{
                                  id: rule.id,
                                  minPercentage: rule.minPercentage.toNumber(),
                                  maxPercentage: rule.maxPercentage.toNumber(),
                                  grade: rule.grade,
                                  gradeBn: rule.gradeBn,
                                  gradePoint: rule.gradePoint.toNumber(),
                                }}
                              />
                              <DeleteGradeRuleButton id={rule.id} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
