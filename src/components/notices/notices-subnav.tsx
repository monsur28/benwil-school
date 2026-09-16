"use client"

import { useTranslations } from "next-intl"
import { SubNav } from "@/components/shared/sub-nav"

const LINKS = [
  { href: "/notices", labelKey: "subnav.notices", exact: true },
  { href: "/notices/categories", labelKey: "subnav.categories" },
]

export function NoticesSubNav() {
  const t = useTranslations("notices")

  return (
    <SubNav
      links={LINKS.map((link) => ({ href: link.href, label: t(link.labelKey), exact: link.exact }))}
    />
  )
}
