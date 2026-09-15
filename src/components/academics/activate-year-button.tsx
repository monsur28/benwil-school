"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { CheckCircle2 } from "lucide-react"
import { setActiveAcademicYear } from "@/actions/academics/academic-years"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"

export function ActivateYearButton({ id }: { id: string }) {
  const t = useTranslations("academics")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      const result = await setActiveAcademicYear(id)
      if (!result.success) {
        toast.add({ title: result.error, type: "error" })
        return
      }
      toast.add({ title: t("success.activated"), type: "success" })
      router.refresh()
    })
  }

  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={isPending}>
      <CheckCircle2 />
      {t("actions.activate")}
    </Button>
  )
}
