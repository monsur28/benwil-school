"use client"

import { useTranslations } from "next-intl"
import { useFormField } from "@/components/ui/form"
import { cn } from "cn"

// Zod messages on homework forms are translation-key strings (e.g.
// "errors.marksInvalid"), the same convention homework-form.tsx already
// resolves manually via t(errors.field.message). The generic shadcn
// <FormMessage /> renders String(error.message) directly with no
// translation step, so it shows that raw key to the user instead of real
// text. This re-implements the same rendering with a translate step, for
// TeacherReviewForm/StudentHomeworkSubmission.
export function TranslatedFormMessage({ className }: { className?: string }) {
  const t = useTranslations("homework")
  const { error, formMessageId } = useFormField()

  if (!error?.message) return null

  return (
    <p id={formMessageId} className={cn("text-[0.8rem] font-medium text-destructive", className)}>
      {t(error.message as never)}
    </p>
  )
}
