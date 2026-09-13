"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Trash2 } from "lucide-react"
import { removeTeacherAssignment } from "@/actions/academics/teacher-assignments"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"

export function RemoveAssignmentButton({ id }: { id: string }) {
  const t = useTranslations("academics")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      const result = await removeTeacherAssignment(id)
      if (result.error) {
        toast.add({ title: result.error, type: "error" })
        return
      }
      router.refresh()
    })
  }

  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={isPending}>
      <Trash2 />
      {t("actions.remove")}
    </Button>
  )
}
