"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  User,
  CalendarCheck,
  Award,
  Wallet,
  NotebookPen,
  Megaphone,
  Clock,
} from "lucide-react"
import { cn } from "cn"

export type PortalNavIconKey =
  | "dashboard"
  | "profile"
  | "attendance"
  | "results"
  | "fees"
  | "homework"
  | "notices"
  | "routine"

export type PortalNavLink = {
  href: string
  label: string
  exact?: boolean
  iconKey?: PortalNavIconKey
}

const ICON_MAP: Record<PortalNavIconKey, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  profile: User,
  attendance: CalendarCheck,
  results: Award,
  fees: Wallet,
  homework: NotebookPen,
  notices: Megaphone,
  routine: Clock,
}

function resolveIcon(link: PortalNavLink) {
  if (link.iconKey && ICON_MAP[link.iconKey]) {
    return ICON_MAP[link.iconKey]
  }
  if (link.exact) return LayoutDashboard
  if (link.href.endsWith("/profile")) return User
  if (link.href.endsWith("/attendance")) return CalendarCheck
  if (link.href.endsWith("/results")) return Award
  if (link.href.endsWith("/fees")) return Wallet
  if (link.href.endsWith("/homework")) return NotebookPen
  if (link.href.endsWith("/notices")) return Megaphone
  if (link.href.endsWith("/routine")) return Clock
  return null
}

/**
 * Sub-navigation inside a portal record (a child, a module).
 *
 * Executive segmented pill track with elevated card active pill,
 * smooth hover states, icon support, and horizontal scrolling for mobile.
 */
export function PortalNav({ links, className }: { links: PortalNavLink[]; className?: string }) {
  const pathname = usePathname()

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-0.5">
      <nav
        aria-label="Portal sub navigation"
        className={cn(
          "inline-flex w-max items-center gap-1 rounded-xl border border-border/80 bg-muted/60 p-1 shadow-2xs backdrop-blur-xs",
          className
        )}
      >
        {links.map((link) => {
          const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href)
          const Icon = resolveIcon(link)

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

