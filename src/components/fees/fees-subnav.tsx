"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "cn"

const LINKS = [
  { href: "/fees", labelKey: "subnav.overview" },
  { href: "/fees/categories", labelKey: "subnav.categories" },
  { href: "/fees/structures", labelKey: "subnav.structures" },
  { href: "/fees/student", labelKey: "subnav.student" },
  { href: "/fees/payments", labelKey: "subnav.payments" },
  { href: "/fees/reports/outstanding", labelKey: "subnav.outstanding" },
  { href: "/fees/reports/collections", labelKey: "subnav.collections" },
]

export function FeesSubNav({ links = LINKS }: { links?: typeof LINKS }) {
  const t = useTranslations("fees")
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-1 border-b pb-2">
      {links.map((link) => {
        const isActive = link.href === "/fees" ? pathname === "/fees" : pathname.startsWith(link.href)
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
