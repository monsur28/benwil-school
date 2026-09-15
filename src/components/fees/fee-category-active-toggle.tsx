"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { toggleFeeCategoryActive } from "@/actions/fees/fee-categories"

export function FeeCategoryActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const t = useTranslations("fees")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await toggleFeeCategoryActive(id, !isActive)
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
