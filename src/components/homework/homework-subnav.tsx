"use client"

import { useTranslations } from "next-intl"
import { SubNav } from "@/components/shared/sub-nav"

const LINKS = [
  { href: "/homework", labelKey: "subnav.homework", exact: true },
  { href: "/homework/categories", labelKey: "subnav.categories" },
]

// Category management is admin/principal-only (see HOMEWORK_ADMIN_ROLES /
// ADMIN_ROLES in nav.ts) - a teacher never sees a tab that would just 403.
export function HomeworkSubNav({ showCategories = true }: { showCategories?: boolean }) {
  const t = useTranslations("homework")
  const links = showCategories ? LINKS : LINKS.filter((link) => link.href === "/homework")

  return (
    <SubNav
      links={links.map((link) => ({ href: link.href, label: t(link.labelKey), exact: link.exact }))}
    />
  )
}
