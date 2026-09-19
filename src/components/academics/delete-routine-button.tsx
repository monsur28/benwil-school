"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Trash2 } from "lucide-react"
import { deleteRoutineEntry } from "@/actions/academics/routine"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"

export function DeleteRoutineButton({ id }: { id: string }) {
  const t = useTranslations("routine")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function onClick() {
    if (!window.confirm(t("deleteConfirm"))) return

    startTransition(async () => {
      const result = await deleteRoutineEntry(id)
      if (!result.success) {
        toast.add({ title: result.error, type: "error" })
        return
      }
      toast.add({ title: t("success.deleted"), type: "success" })
      router.refresh()
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={onClick}
      disabled={isPending}
      title={t("deleteEntry")}
    >
      <Trash2 className="size-3.5" />
      <span className="sr-only sm:not-sr-only sm:text-xs">{t("delete")}</span>
    </Button>
  )
}
