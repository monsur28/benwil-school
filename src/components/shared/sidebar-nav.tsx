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

export function SidebarNav({ groups, items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()

  // Collect all defined nav item hrefs to detect more specific matches
  const allHrefs = (groups ? groups.flatMap((g) => g.items) : (items ?? [])).map((i) => i.href)

  // Helper to render an individual link
  const renderItem = (item: TranslatedNavItem) => {
    const isDashboard = item.href === "/dashboard"
    let isActive = false

    if (isDashboard) {
      isActive = pathname === "/dashboard"
    } else if (pathname === item.href) {
      isActive = true
    } else if (pathname.startsWith(`${item.href}/`)) {
      // If another nav item is a closer / more specific prefix match, don't mark this parent active
      const hasMoreSpecificItem = allHrefs.some(
        (otherHref) =>
          otherHref !== item.href &&
          otherHref.startsWith(`${item.href}/`) &&
          (pathname === otherHref || pathname.startsWith(`${otherHref}/`))
      )
      isActive = !hasMoreSpecificItem
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all duration-150 select-none",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        {/* Subtle active pill indicator on left - navy, not --primary (red):
            the sidebar is explicitly a navy-branded surface per design.md
            §6/§32 ("Do NOT make the entire active item bright red"), while
            --primary drives CTA buttons elsewhere. */}
        {isActive && (
          <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-sidebar-primary" />
        )}
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center transition-colors",
            isActive
              ? "text-sidebar-primary"
              : "text-muted-foreground/80 group-hover:text-sidebar-foreground"
          )}
        >
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
      </Link>
    )
  }

  // If grouped navigation is provided
  if (groups && groups.length > 0) {
    return (
      <nav className="flex flex-col gap-3 px-2 py-1">
        {groups.map((group, groupIdx) => (
          <div key={group.titleKey || groupIdx} className="space-y-0.5">
            {group.title && (
              <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase select-none">
                {group.title}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => renderItem(item))}
            </div>
          </div>
        ))}
      </nav>
    )
  }

  // Fallback for flat items list
  return (
    <nav className="flex flex-col gap-0.5 px-2 py-1">
      {(items ?? []).map((item) => renderItem(item))}
    </nav>
  )
}
