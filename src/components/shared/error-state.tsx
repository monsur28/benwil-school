"use client"

import { AlertTriangle } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("common")

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState
        icon={AlertTriangle}
        title={t("somethingWentWrong")}
        description={t("somethingWentWrongDescription")}
        action={<Button onClick={onRetry}>{t("tryAgain")}</Button>}
      />
    </div>
  )
}
