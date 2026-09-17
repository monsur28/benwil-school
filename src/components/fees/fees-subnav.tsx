"use client"

import { useTranslations } from "next-intl"
import { SubNav } from "@/components/shared/sub-nav"

const LINKS = [
  { href: "/fees", labelKey: "subnav.overview", exact: true },
  { href: "/fees/categories", labelKey: "subnav.categories" },
  { href: "/fees/structures", labelKey: "subnav.structures" },
  { href: "/fees/student", labelKey: "subnav.student" },
  { href: "/fees/payments", labelKey: "subnav.payments" },
  { href: "/fees/reports/outstanding", labelKey: "subnav.outstanding" },
  { href: "/fees/reports/collections", labelKey: "subnav.collections" },
]

export function FeesSubNav({ links = LINKS }: { links?: typeof LINKS }) {
  const t = useTranslations("fees")

  return (
    <SubNav
      links={links.map((link) => ({ href: link.href, label: t(link.labelKey), exact: link.exact }))}
    />
  )
}
