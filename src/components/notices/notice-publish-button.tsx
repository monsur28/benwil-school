"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { publishNotice } from "@/actions/notices/notices"

export function NoticePublishButton({ id }: { id: string }) {
  const t = useTranslations("notices")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await publishNotice(id)
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
