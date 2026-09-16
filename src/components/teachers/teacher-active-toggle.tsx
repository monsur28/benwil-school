"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { setTeacherActive } from "@/actions/teachers/teachers"

export function TeacherActiveToggle({ teacherId, isActive }: { teacherId: string; isActive: boolean }) {
  const t = useTranslations("teachers")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function onClick() {
    if (isActive && !window.confirm(t("confirm.deactivate"))) return

    startTransition(async () => {
      const result = await setTeacherActive(teacherId, !isActive)
      if (!result.success) {
        toast.add({ title: result.error, type: "error" })
        return
      }
      toast.add({ title: isActive ? t("success.deactivated") : t("success.activated"), type: "success" })
      router.refresh()
    })
  }

  return (
    <Button variant={isActive ? "outline" : "default"} size="sm" disabled={isPending} onClick={onClick}>
      {isActive ? t("actions.deactivate") : t("actions.activate")}
    </Button>
  )
}
