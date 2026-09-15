"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"
import { removeSubjectFromClass } from "@/actions/academics/class-subjects"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"

export function RemoveClassSubjectButton({
  classId,
  subjectId,
}: {
  classId: string
  subjectId: string
}) {
  const t = useTranslations("academics")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      const result = await removeSubjectFromClass(classId, subjectId)
      if (!result.success) {
        toast.add({ title: result.error, type: "error" })
        return
      }
      router.refresh()
    })
  }

  return (
    <Button variant="ghost" size="icon-sm" onClick={onClick} disabled={isPending} aria-label={t("actions.remove")}>
      <X />
    </Button>
  )
}
