"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"

export type PortalNavLink = { href: string; label: string; exact?: boolean }

export function PortalNav({ links }: { links: PortalNavLink[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-1 overflow-x-auto">
      {links.map((link) => {
        const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
