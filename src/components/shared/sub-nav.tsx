"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"

export type SubNavLink = {
  href: string
  label: string
  /** Match this href exactly instead of as a path prefix (module roots). */
  exact?: boolean
}

/**
 * Module sub-navigation.
 *
 * One implementation for every module (academics, exams, fees, homework,
 * notices, results, settings) so the seven copies of this rail can never
 * drift apart again.
 *
 * Presented as an underlined rail: it sits beneath the page title and reads
 * as "sections of this module". Filled pills were ambiguous with filters, and
 * an underline also survives being scrolled horizontally on a phone, which a
 * wrapping pill row does not do gracefully.
 */
export function SubNav({ links, className }: { links: SubNavLink[]; className?: string }) {
  const pathname = usePathname()

  return (
    <nav
      className={cn("scroll-thin -mb-px flex gap-0.5 overflow-x-auto border-b border-border", className)}
    >
      {links.map((link) => {
        const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative shrink-0 whitespace-nowrap rounded-t-md px-3 pb-2.5 pt-1 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
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
