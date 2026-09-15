"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { toggleGradingScaleActive } from "@/actions/results/grading-scales"

export function GradingScaleActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const t = useTranslations("results")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await toggleGradingScaleActive(id, !isActive)
          if (!result.success) {
            toast.add({ title: result.error, type: "error" })
            return
          }
          router.refresh()
        })
      }}
    >
      {isActive ? t("actions.deactivate") : t("actions.activate")}
    </Button>
  )
}
