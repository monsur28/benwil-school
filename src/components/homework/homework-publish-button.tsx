"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { publishHomework } from "@/actions/homework/homework"

export function HomeworkPublishButton({ id }: { id: string }) {
  const t = useTranslations("homework")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await publishHomework(id)
          if (!result.success) {
            toast.add({ title: result.error, type: "error" })
            return
          }
          toast.add({ title: t("success.published"), type: "success" })
          router.refresh()
        })
      }}
    >
      <Send />
      {t("actions.publish")}
    </Button>
  )
}
