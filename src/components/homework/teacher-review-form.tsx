"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/components/ui/toast"
import { reviewHomeworkSubmissionSchema, type ReviewHomeworkSubmissionInput } from "@/lib/validations/homework-submission"
import { reviewHomeworkSubmission } from "@/actions/homework/homework-submissions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { TranslatedFormMessage } from "@/components/homework/translated-form-message"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface TeacherReviewFormProps {
  homeworkId: string
  studentId: string
  maxMarks?: number | null
  initialFeedback?: string | null
  initialMarks?: number | null
  initialGrade?: string | null
}

export function TeacherReviewForm({ homeworkId, studentId, maxMarks, initialFeedback, initialMarks, initialGrade }: TeacherReviewFormProps) {
  const t = useTranslations("homework")
  const [isPending, startTransition] = useTransition()

  const form = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(reviewHomeworkSubmissionSchema) as any,
    defaultValues: {
      homeworkId,
      studentId,
      feedback: initialFeedback || "",
      marks: initialMarks ?? undefined,
      grade: initialGrade || "",
    },
  })

  function onSubmit(data: ReviewHomeworkSubmissionInput) {
    startTransition(async () => {
      const result = await reviewHomeworkSubmission(data)
      if (result.success) {
        toast.add({ title: t("review.success"), type: "success" })
      } else {
        toast.add({ title: result.error || "An error occurred", type: "error" })
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("review.teacherFeedback")}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder={t("review.feedbackPlaceholder")}
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <TranslatedFormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="marks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("review.marks")}
                      {typeof maxMarks === "number" && (
                        <span className="ml-1 font-normal text-muted-foreground">/ {maxMarks}</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t("review.marksPlaceholder")}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        value={(field.value as any) ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <TranslatedFormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("review.grade")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("review.gradePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <TranslatedFormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("review.saving") : t("review.save")}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
