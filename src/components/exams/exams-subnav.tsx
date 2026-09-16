"use client"

import { useTranslations } from "next-intl"
import { SubNav } from "@/components/shared/sub-nav"

const LINKS = [
  { href: "/exams", labelKey: "subnav.exams", exact: true },
  { href: "/exams/types", labelKey: "subnav.types" },
]

export function ExamsSubNav() {
  const t = useTranslations("exams")

  return (
    <SubNav
      links={LINKS.map((link) => ({ href: link.href, label: t(link.labelKey), exact: link.exact }))}
    />
  )
}
