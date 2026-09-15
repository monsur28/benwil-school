"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { deleteExamSchedule } from "@/actions/exams/exam-schedules"

export function RemoveScheduleButton({ id, hasMarks }: { id: string; hasMarks: boolean }) {
  const t = useTranslations("exams")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (hasMarks) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm(t("detail.removeConfirm"))) {
          return
        }
        startTransition(async () => {
          const result = await deleteExamSchedule(id)
          if (!result.success) {
            toast.add({ title: result.error, type: "error" })
            return
          }
          router.refresh()
        })
      }}
    >
      <Trash2 />
    </Button>
  )
}
