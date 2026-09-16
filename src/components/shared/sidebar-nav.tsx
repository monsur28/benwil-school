"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"
import type { TranslatedNavItem, TranslatedNavGroup } from "@/components/shared/nav-items"

interface SidebarNavProps {
  groups?: TranslatedNavGroup[]
  items?: TranslatedNavItem[]
  onNavigate?: () => void
}

/**
 * The navigation rail's link list.
 *
 * Active-state resolution is unchanged from the previous implementation: the
 * dashboard matches exactly, every other entry matches itself or a descendant
 * path unless a more specific sibling entry already claims that path.
 *
 * Visually the item is now a solid "current page" chip — the inverse of the
 * rail surface — which reads instantly at a glance and needs no accent bar,
 * arrow or weight change to be findable.
 */
export function SidebarNav({ groups, items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()
  const allHrefs = (groups ? groups.flatMap((group) => group.items) : (items ?? [])).map((item) => item.href)

  const renderItem = (item: TranslatedNavItem) => {
    const isDashboard = item.href === "/dashboard"
    const isActive = isDashboard
      ? pathname === "/dashboard"
      : pathname === item.href || (
        pathname.startsWith(`${item.href}/`) &&
        !allHrefs.some((href) => href !== item.href && href.startsWith(`${item.href}/`) && (pathname === href || pathname.startsWith(`${href}/`)))
      )

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] outline-none transition-colors duration-150",
          "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
          isActive
            ? "bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-card"
            : "font-medium text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center transition-colors",
            isActive ? "text-sidebar-primary-foreground" : "text-sidebar-muted group-hover:text-sidebar-foreground"
          )}
        >
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
      </Link>
    )
  }

  if (groups?.length) {
    return (
      <nav aria-label="Main navigation" className="flex flex-col gap-6 px-3 py-4">
        {groups.map((group, index) => (
          <section key={group.titleKey || index}>
            {group.title && (
              <h2 className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted/70">
                {group.title}
              </h2>
            )}
            <div className="flex flex-col gap-0.5">{group.items.map(renderItem)}</div>
          </section>
        ))}
      </nav>
    )
  }

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-0.5 px-3 py-4">
      {(items ?? []).map(renderItem)}
    </nav>
  )
}
