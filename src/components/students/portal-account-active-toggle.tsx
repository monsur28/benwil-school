"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { setPortalAccountActive } from "@/actions/portal/account-linking"

export function PortalAccountActiveToggle({ userId, isActive }: { userId: string; isActive: boolean }) {
  const t = useTranslations("portal")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await setPortalAccountActive(userId, !isActive)
          if (!result.success) {
            toast.add({ title: result.error, type: "error" })
            return
          }
          router.refresh()
        })
      }}
    >
      {isActive ? t("actions.deactivateAccount") : t("actions.activateAccount")}
    </Button>
  )
}
