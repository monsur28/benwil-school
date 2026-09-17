"use client"

import { useTranslations } from "next-intl"
import {
  LayoutDashboard,
  Tag,
  Layers,
  UserCheck,
  Receipt,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import { SubNav } from "@/components/shared/sub-nav"

const LINKS = [
  { href: "/fees", labelKey: "subnav.overview", exact: true, icon: LayoutDashboard },
  { href: "/fees/categories", labelKey: "subnav.categories", icon: Tag },
  { href: "/fees/structures", labelKey: "subnav.structures", icon: Layers },
  { href: "/fees/student", labelKey: "subnav.student", icon: UserCheck },
  { href: "/fees/payments", labelKey: "subnav.payments", icon: Receipt },
  { href: "/fees/reports/outstanding", labelKey: "subnav.outstanding", icon: AlertCircle },
  { href: "/fees/reports/collections", labelKey: "subnav.collections", icon: TrendingUp },
]

export function FeesSubNav({ links = LINKS }: { links?: typeof LINKS }) {
  const t = useTranslations("fees")

  return (
    <SubNav
      links={links.map((link) => ({
        href: link.href,
        label: t(link.labelKey),
        exact: link.exact,
        icon: link.icon,
      }))}
    />
  )
}
