"use client"

import { useTranslations } from "next-intl"
import { Settings, School, Palette, Server } from "lucide-react"
import { SubNav } from "@/components/shared/sub-nav"

const LINKS = [
  { href: "/settings", labelKey: "title", exact: true, icon: Settings },
  { href: "/settings/school", labelKey: "school.title", icon: School },
  { href: "/settings/branding", labelKey: "branding.title", icon: Palette },
  { href: "/settings/system", labelKey: "system.title", icon: Server },
]

export function SettingsSubNav() {
  const t = useTranslations("settings")

  return (
    <SubNav
      links={LINKS.map((link) => ({
        href: link.href,
        label: t(link.labelKey),
        exact: link.exact,
        icon: link.icon,
      }))}
    />
  )
}
