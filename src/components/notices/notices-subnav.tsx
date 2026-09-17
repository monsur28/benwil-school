"use client"

import { useTranslations } from "next-intl"
import { Megaphone, Tag } from "lucide-react"
import { SubNav } from "@/components/shared/sub-nav"

const LINKS = [
  { href: "/notices", labelKey: "subnav.notices", exact: true, icon: Megaphone },
  { href: "/notices/categories", labelKey: "subnav.categories", icon: Tag },
]

export function NoticesSubNav() {
  const t = useTranslations("notices")

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
