"use client"

import { useTranslations } from "next-intl"
import { GraduationCap, SlidersHorizontal } from "lucide-react"
import { SubNav } from "@/components/shared/sub-nav"

const LINKS = [
  { href: "/exams", labelKey: "subnav.exams", exact: true, icon: GraduationCap },
  { href: "/exams/types", labelKey: "subnav.types", icon: SlidersHorizontal },
]

export function ExamsSubNav() {
  const t = useTranslations("exams")

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
