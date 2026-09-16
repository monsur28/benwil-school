import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Eye } from "lucide-react"
import { getHomeworkSubmissionsRoster } from "@/lib/homework/get-homework-submissions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pickLocalized } from "@/lib/format"
import { getLocale } from "next-intl/server"
import { formatDate } from "@/lib/format"

export async function HomeworkSubmissionsList({
  schoolId,
  homeworkId,
  canReview,
}: {
  schoolId: string
  homeworkId: string
  canReview: boolean
}) {
  const [t, locale] = await Promise.all([getTranslations("homework"), getLocale()])
  const data = await getHomeworkSubmissionsRoster({ schoolId, homeworkId })

  if (!data) return null

  const { summary, roster } = data

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">{t("submissions.summary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("submissions.totalStudents")}</p>
              <p className="text-2xl font-bold">{summary.totalStudents}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("submissions.submitted")}</p>
              <p className="text-2xl font-bold text-info">{summary.submittedCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("submissions.reviewed")}</p>
              <p className="text-2xl font-bold text-success">{summary.reviewedCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("submissions.late")}</p>
              <p className="text-2xl font-bold text-warning">{summary.lateCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("submissions.notSubmitted")}</p>
              <p className="text-2xl font-bold">{summary.notSubmittedCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">{t("submissions.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("submissions.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{t("submissions.table.student")}</TableHead>
                    <TableHead>{t("submissions.table.status")}</TableHead>
                    <TableHead>{t("submissions.table.submittedAt")}</TableHead>
                    {canReview && <TableHead className="text-right">{t("submissions.table.actions")}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((item) => {
                    const studentName = pickLocalized(item.student.name, item.student.nameBn, locale)
                    
                    return (
                      <TableRow key={item.student.id}>
                        <TableCell>{item.student.roll}</TableCell>
                        <TableCell className="font-medium">{studentName}</TableCell>
                        <TableCell>
                          {item.submission ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant={item.submission.status === "REVIEWED" ? "default" : "secondary"}
                              >
                                {t(`submissions.status.${item.submission.status}`)}
                              </Badge>
                              {item.submission.isLate && (
                                <Badge variant="outline" className="border-warning/30 text-warning">
                                  {t("submissions.lateBadge")}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline">{t("submissions.notSubmitted")}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.submission
                            ? formatDate(item.submission.submittedAt, locale)
                            : "—"}
                        </TableCell>
                        {canReview && (
                          <TableCell className="text-right">
                            {item.submission ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                nativeButton={false}
                                render={
                                  <Link
                                    href={`/homework/${homeworkId}/submissions/${item.student.id}`}
                                    title={t("review.title")}
                                  />
                                }
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">{t("review.title")}</span>
                              </Button>
                            ) : null}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
