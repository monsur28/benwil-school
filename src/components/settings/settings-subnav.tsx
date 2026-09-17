"use client"

import { useTranslations } from "next-intl"
import { SubNav } from "@/components/shared/sub-nav"

const LINKS = [
  { href: "/settings", labelKey: "title", exact: true },
  { href: "/settings/school", labelKey: "school.title" },
  { href: "/settings/branding", labelKey: "branding.title" },
  { href: "/settings/system", labelKey: "system.title" },
]

export function SettingsSubNav() {
  const t = useTranslations("settings")

  return (
    <SubNav
      links={LINKS.map((link) => ({ href: link.href, label: t(link.labelKey), exact: link.exact }))}
    />
  )
}
