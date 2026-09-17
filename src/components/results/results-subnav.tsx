"use client"

import { useTranslations } from "next-intl"
import { Award, SlidersHorizontal } from "lucide-react"
import { SubNav } from "@/components/shared/sub-nav"

const LINKS = [
  { href: "/results", labelKey: "subnav.results", exact: true, icon: Award },
  { href: "/results/grading", labelKey: "subnav.grading", icon: SlidersHorizontal },
]

export function ResultsSubNav() {
  const t = useTranslations("results")

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
