"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { toggleNoticeCategoryActive } from "@/actions/notices/notice-categories"

export function NoticeCategoryActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const t = useTranslations("notices")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await toggleNoticeCategoryActive(id, !isActive)
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
