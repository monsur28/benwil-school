"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { deleteGradeRule } from "@/actions/results/grade-rules"

export function DeleteGradeRuleButton({ id }: { id: string }) {
  const t = useTranslations("results")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm(t("grading.deleteRuleConfirm"))) {
          return
        }
        startTransition(async () => {
          const result = await deleteGradeRule(id)
          if (!result.success) {
            toast.add({ title: result.error, type: "error" })
            return
          }
          toast.add({ title: t("success.gradeRuleDeleted"), type: "success" })
          router.refresh()
        })
      }}
    >
      <Trash2 />
    </Button>
  )
}
