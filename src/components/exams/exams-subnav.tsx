"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "cn"

const LINKS = [
  { href: "/exams", labelKey: "subnav.exams" },
  { href: "/exams/types", labelKey: "subnav.types" },
]

export function ExamsSubNav() {
  const t = useTranslations("exams")
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-1 border-b pb-2">
      {LINKS.map((link) => {
        const isActive =
          link.href === "/exams" ? pathname === "/exams" : pathname.startsWith(link.href)
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
