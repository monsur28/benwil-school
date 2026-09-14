"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { finalizeExamResults } from "@/actions/results/finalization"

export function FinalizeResultsButton({ examId }: { examId: string }) {
  const t = useTranslations("results")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      className="gap-1.5"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await finalizeExamResults(examId)
          if (result.error) {
            toast.add({ title: result.error, type: "error" })
            return
          }
          toast.add({ title: t("success.finalized"), type: "success" })
          router.refresh()
        })
      }}
    >
      <Lock />
      {t("actions.finalize")}
    </Button>
  )
}
