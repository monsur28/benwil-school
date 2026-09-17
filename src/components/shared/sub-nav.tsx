"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"

export type SubNavLink = {
  href: string
  label: string
  /** Match this href exactly instead of as a path prefix (module roots). */
  exact?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

/**
 * Module sub-navigation.
 *
 * Executive segmented pill track for all dashboard modules (fees, academics,
 * exams, homework, notices, results, settings).
 *
 * Designed with a subtle tinted backdrop, elevated card active pill,
 * smooth hover states, icon support, and horizontal scrolling for mobile.
 */
export function SubNav({ links, className }: { links: SubNavLink[]; className?: string }) {
  const pathname = usePathname()

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-0.5">
      <nav
        aria-label="Sub navigation"
        className={cn(
          "inline-flex w-max items-center gap-1 rounded-xl border border-border/80 bg-muted/60 p-1 shadow-2xs backdrop-blur-xs",
          className
        )}
      >
        {links.map((link) => {
          const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href)
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                isActive
                  ? "border border-border/80 bg-card font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "size-3.5 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
              )}
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
