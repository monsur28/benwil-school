"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "cn"

const LINKS = [
  { href: "/homework", labelKey: "subnav.homework" },
  { href: "/homework/categories", labelKey: "subnav.categories" },
]

// Category management is admin/principal-only (see HOMEWORK_ADMIN_ROLES /
// ADMIN_ROLES in nav.ts) - a teacher never sees a tab that would just 403.
export function HomeworkSubNav({ showCategories = true }: { showCategories?: boolean }) {
  const t = useTranslations("homework")
  const pathname = usePathname()
  const links = showCategories ? LINKS : LINKS.filter((link) => link.href === "/homework")

  return (
    <nav className="flex flex-wrap gap-1 border-b pb-2">
      {links.map((link) => {
        const isActive = link.href === "/homework" ? pathname === "/homework" : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t(link.labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
