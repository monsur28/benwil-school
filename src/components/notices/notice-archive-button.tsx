"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { archiveNotice } from "@/actions/notices/notices"

export function NoticeArchiveButton({ id }: { id: string }) {
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
          const result = await archiveNotice(id)
          if (!result.success) {
            toast.add({ title: result.error, type: "error" })
            return
          }
          toast.add({ title: t("success.archived"), type: "success" })
          router.refresh()
        })
      }}
    >
      <Archive />
      {t("actions.archive")}
    </Button>
  )
}
