"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "cn"

const LINKS = [
  { href: "/results", labelKey: "subnav.results" },
  { href: "/results/grading", labelKey: "subnav.grading" },
]

export function ResultsSubNav() {
  const t = useTranslations("results")
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-1 border-b pb-2">
      {LINKS.map((link) => {
        const isActive =
          link.href === "/results" ? pathname === "/results" : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t(link.labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
