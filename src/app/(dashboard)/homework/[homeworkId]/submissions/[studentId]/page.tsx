import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations, getLocale } from "next-intl/server"
import { Role } from "@prisma/client"
import { ArrowLeft } from "lucide-react"
import { requireRole } from "@/lib/auth/dal"
import { getSubmissionForReview } from "@/lib/homework/get-homework-submissions"
import { HOMEWORK_ROLES } from "@/lib/homework/homework-access"
import { checkTeacherReviewAccess } from "@/lib/homework/homework-submission-access"
import { isSubmissionLate } from "@/lib/homework/submission-timing"
import { formatDate, pickLocalized } from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { TeacherReviewForm } from "@/components/homework/teacher-review-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function HomeworkSubmissionReviewPage({
  params,
}: {
  params: Promise<{ homeworkId: string; studentId: string }>
}) {
  const user = await requireRole(...HOMEWORK_ROLES)
  const [t, locale] = await Promise.all([getTranslations("homework"), getLocale()])
  const { homeworkId, studentId } = await params

  const data = await getSubmissionForReview({
    schoolId: user.schoolId,
    homeworkId,
    studentId,
  })

  if (!data) notFound()

  const { homework, student, submission } = data

  const reviewAccess = checkTeacherReviewAccess(user, homework, student)
  if (!reviewAccess.ok) notFound()

  const studentName = pickLocalized(student.name, student.nameBn, locale)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-3 text-muted-foreground"
          nativeButton={false}
          render={<Link href={`/homework/${homeworkId}`} />}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("review.back")}
        </Button>
        <PageHeader
          title={t("review.title")}
          description={`${studentName} (Roll: ${student.roll}) • ${homework.title}`}
        />
      </div>

      {!submission ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            {t("review.notSubmitted")}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">{t("review.studentSubmission")}</CardTitle>
              <div className="flex items-center gap-1.5">
                <Badge variant={submission.status === "REVIEWED" ? "default" : "secondary"}>
                  {t(`submissions.status.${submission.status}`)}
                </Badge>
                {isSubmissionLate(submission.submittedAt, homework.dueDate) && (
                  <Badge variant="outline" className="border-warning/30 text-warning">
                    {t("submissions.lateBadge")}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {t("submissions.table.submittedAt")}: {formatDate(submission.submittedAt, locale)}
              </div>

              {submission.content && (
                <div className="rounded-md bg-muted p-4 whitespace-pre-wrap text-sm">
                  {submission.content}
                </div>
              )}

              {submission.fileUrl && (
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-info hover:underline"
                >
                  {t("review.viewAttachment")}: {submission.fileName ?? submission.fileUrl}
                </a>
              )}
            </CardContent>
          </Card>

          <TeacherReviewForm
            homeworkId={homeworkId}
            studentId={studentId}
            maxMarks={homework.maxMarks}
            initialFeedback={submission.feedback}
            initialMarks={submission.marks !== null ? Number(submission.marks) : null}
            initialGrade={submission.grade}
          />
        </>
      )}
    </div>
  )
}
