"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { submitHomeworkSchema, type SubmitHomeworkInput } from "@/lib/validations/homework-submission"
import { submitHomework } from "@/actions/homework/homework-submissions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { TranslatedFormMessage } from "@/components/homework/translated-form-message"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"
import type { StudentSubmissionWithReviewer } from "@/lib/homework/get-homework-submissions"
import { isSubmissionOpen } from "@/lib/homework/submission-timing"

export function StudentHomeworkSubmission({
  homeworkId,
  dueDate,
  maxMarks,
  submission,
}: {
  homeworkId: string
  dueDate: Date
  maxMarks?: number | null
  submission: StudentSubmissionWithReviewer | null
}) {
  const t = useTranslations("homework")
  const [isEditing, setIsEditing] = useState(!submission)
  const [isPending, setIsPending] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const open = isSubmissionOpen(dueDate)

  const form = useForm<SubmitHomeworkInput>({
    resolver: zodResolver(submitHomeworkSchema),
    defaultValues: {
      homeworkId,
      content: submission?.content || "",
    },
  })

  async function onSubmit(data: SubmitHomeworkInput) {
    if (!data.content?.trim() && !file) {
      toast.add({ title: t("errors.submissionEmpty"), type: "error" })
      return
    }

    setIsPending(true)
    const formData = new FormData()
    formData.append("homeworkId", data.homeworkId)
    formData.append("content", data.content ?? "")
    if (file) {
      formData.append("file", file)
    }

    const actualResult = await submitHomework(formData)

    if (actualResult.success) {
      toast.add({ title: t("success.submitted"), type: "success" })
      setIsEditing(false)
      setFile(null)
    } else {
      toast.add({ title: actualResult.error || t("errors.failedSubmit"), type: "error" })
    }
    setIsPending(false)
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">
          {submission ? t("portal.yourSubmission") : t("actions.submitHomework")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {submission && !isEditing && (
          <div className="space-y-4">
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
                        {typeof maxMarks === "number" && <span className="text-base font-normal text-muted-foreground"> / {maxMarks}</span>}
                      </>
                    )}
                    {submission.grade && <span className="ml-2 text-base font-semibold text-primary">{submission.grade}</span>}
                  </p>
                )}
                <h4 className="font-semibold text-sm">{t("fields.teacherFeedback")}</h4>
                <p className="whitespace-pre-line text-sm">{submission.feedback || "—"}</p>
              </div>
            )}
            {open && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                {t("actions.editSubmission")}
              </Button>
            )}
          </div>
        )}

        {isEditing && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.submissionContent")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("portal.submissionPlaceholder")}
                        className="min-h-[150px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <TranslatedFormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-1.5">
                <label htmlFor="homework-submission-file" className="text-sm font-medium">
                  {t("fields.attachment")}
                </label>
                <input
                  id="homework-submission-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
                />
                {submission?.fileName && !file && (
                  <p className="text-xs text-muted-foreground">{t("fields.currentAttachment")}: {submission.fileName}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isPending || !open}>
                  {isPending ? t("actions.saving") : t("actions.submit")}
                </Button>
                {submission && (
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isPending}>
                    {t("actions.cancel")}
                  </Button>
                )}
              </div>
              {!open && (
                <p className="text-sm text-destructive mt-2">{t("errors.submissionClosed")}</p>
              )}
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
