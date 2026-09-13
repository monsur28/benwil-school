import { Construction } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { EmptyState } from "@/components/shared/empty-state"

export async function ComingSoon() {
  const t = await getTranslations("common")

  return (
    <EmptyState
      icon={Construction}
      title={t("comingSoon")}
      description={t("comingSoonDescription")}
    />
  )
}
