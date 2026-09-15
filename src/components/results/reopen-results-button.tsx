"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { LockOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { reopenExamResults } from "@/actions/results/finalization"

export function ReopenResultsButton({ examId }: { examId: string }) {
  const t = useTranslations("results")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await reopenExamResults(examId)
          if (!result.success) {
            toast.add({ title: result.error, type: "error" })
            return
          }
          toast.add({ title: t("success.reopened"), type: "success" })
          router.refresh()
        })
      }}
    >
      <LockOpen />
      {t("actions.reopen")}
    </Button>
  )
}
