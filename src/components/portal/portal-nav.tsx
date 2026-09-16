"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"

export type PortalNavLink = { href: string; label: string; exact?: boolean }

/**
 * Sub-navigation inside a portal record (a child, a module).
 *
 * An underlined rail rather than a row of filled pills: it sits directly
 * under the page title and reads as "sections of this page", which pills
 * (which read as filters or toggles) do not.
 */
export function PortalNav({ links }: { links: PortalNavLink[] }) {
  const pathname = usePathname()

  return (
    <nav className="scroll-thin -mb-px flex gap-1 overflow-x-auto border-b border-border">
      {links.map((link) => {
        const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative shrink-0 whitespace-nowrap px-3 pb-3 pt-1 text-[13px] transition-colors",
              isActive
                ? "font-semibold text-foreground after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                : "font-medium text-muted-foreground hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
