import { FileQuestion } from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"

export default async function NotFound() {
  const t = await getTranslations("common")

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center p-6">
      <EmptyState
        icon={FileQuestion}
        title={t("pageNotFound")}
        description={t("pageNotFoundDescription")}
        action={<Button nativeButton={false} render={<Link href="/dashboard" />}>{t("backToDashboard")}</Button>}
      />
    </div>
  )
}
