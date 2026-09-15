"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { toggleFeeStructureActive } from "@/actions/fees/fee-structures"

export function FeeStructureActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
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
          const result = await toggleFeeStructureActive(id, !isActive)
          if (result.error) {
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
