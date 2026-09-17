import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { requireGuardianIdentity, requireGuardianChild } from "@/lib/portal/identity"
import { getHomeworkDetailForStudent } from "@/lib/homework/homework-visibility"
import { getStudentSubmission } from "@/lib/homework/get-homework-submissions"
import { SharedHomeworkDetail } from "@/components/portal/shared-homework-detail"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function GuardianChildHomeworkDetailPage({
  params,
}: {
  params: Promise<{ studentId: string; homeworkId: string }>
}) {
  const { user, guardian } = await requireGuardianIdentity()
  const { studentId, homeworkId } = await params
  const { student } = await requireGuardianChild(guardian.id, studentId, user.schoolId)
  const t = await getTranslations("homework")

  const [homework, submission] = await Promise.all([
    getHomeworkDetailForStudent({
      schoolId: user.schoolId,
      homeworkId,
      academicYearId: student.academicYearId,
      classId: student.classId,
      sectionId: student.sectionId,
    }),
    getStudentSubmission({
      schoolId: user.schoolId,
      homeworkId,
      studentId: student.id,
    }),
  ])
  if (!homework) notFound()

  return (
    <div className="space-y-6">
      <SharedHomeworkDetail homework={homework} basePath={`/portal/guardian/children/${studentId}/homework`} />
      
      {submission && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("portal.childSubmission")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {submission.content && (
              <div className="rounded-md border p-4 bg-muted/20">
                <p className="whitespace-pre-line text-sm">{submission.content}</p>
              </div>
            )}
            {submission.fileUrl && (
              <a
                href={submission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-info hover:underline"
              >
                {submission.fileName ?? submission.fileUrl}
              </a>
            )}
            {submission.status === "REVIEWED" && (
              <div className="rounded-md border border-primary/20 bg-primary/5 p-4 space-y-2">
                {(submission.marks !== null || submission.grade) && (
                  <p className="text-2xl font-bold text-foreground">
                    {submission.marks !== null && (
                      <>
                        {Number(submission.marks)}
                        {typeof homework.maxMarks === "number" && (
                          <span className="text-base font-normal text-muted-foreground"> / {homework.maxMarks}</span>
                        )}
                      </>
                    )}
                    {submission.grade && <span className="ml-2 text-base font-semibold text-primary">{submission.grade}</span>}
                  </p>
                )}
                <h4 className="font-semibold text-sm">{t("fields.teacherFeedback")}</h4>
                <p className="whitespace-pre-line text-sm">{submission.feedback || "—"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
