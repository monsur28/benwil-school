"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "@/components/ui/toast"

export function StudentSavedToast() {
  const t = useTranslations("students")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const shown = useRef(false)

  useEffect(() => {
    if (shown.current) return
    const created = searchParams.get("created")
    const updated = searchParams.get("updated")
    if (!created && !updated) return

    shown.current = true
    toast.add({ title: t(created ? "success.created" : "success.updated"), type: "success" })
    router.replace(pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
