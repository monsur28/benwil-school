import { ShieldAlert } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"

export async function AccessRestricted() {
  const t = await getTranslations("common")

  return (
    <EmptyState
      icon={ShieldAlert}
      title={t("accessRestrictedTitle")}
      description={t("accessRestrictedDescription")}
      action={
        <Button nativeButton={false} render={<Link href="/dashboard" />}>{t("backToDashboard")}</Button>
      }
    />
  )
}
