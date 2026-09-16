import { getTranslations } from "next-intl/server"
import { School, Palette, LogIn, SlidersHorizontal } from "lucide-react"
import { requireSettingsAccess } from "@/lib/settings/settings-access"
import { PageHeader } from "@/components/shared/page-header"
import { DirectoryList, type DirectoryEntry } from "@/components/shared/directory-list"

export default async function SettingsPage() {
  await requireSettingsAccess()
  const t = await getTranslations("settings")

  const entries: DirectoryEntry[] = [
    { href: "/settings/school", icon: School, title: t("school.title"), description: t("school.description") },
    { href: "/settings/branding", icon: Palette, title: t("branding.title"), description: t("branding.description") },
    { href: "/settings/branding#login", icon: LogIn, title: t("loginExperience.title"), description: t("loginExperience.description") },
    { href: "/settings/system", icon: SlidersHorizontal, title: t("system.title"), description: t("system.description") },
  ]

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <DirectoryList entries={entries} />
    </div>
  )
}
