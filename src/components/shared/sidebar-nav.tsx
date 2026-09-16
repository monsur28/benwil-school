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
          "group relative flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[11px] font-medium outline-none transition-[background-color,color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-sidebar-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar active:scale-[0.98]",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/45 hover:text-sidebar-foreground"
        )}
      >
        {isActive && <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-brand-red" />}
        <span className={cn("flex size-4 shrink-0 items-center justify-center", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground/85")}>
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
      </Link>
    )
  }

  if (groups?.length) {
    return (
      <nav aria-label="Main navigation" className="flex flex-col gap-3 px-3 py-3">
        {groups.map((group, index) => (
          <section key={group.titleKey || index} className="space-y-1">
            {group.title && (
              <div className="flex items-center gap-2 px-2.5 pb-1 pt-0.5">
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-sidebar-foreground/35">{group.title}</span>
                <span className="h-px flex-1 bg-sidebar-border/45" />
              </div>
            )}
            <div className="flex flex-col gap-0.5">{group.items.map(renderItem)}</div>
          </section>
        ))}
      </nav>
    )
  }

  return <nav aria-label="Main navigation" className="flex flex-col gap-0.5 px-3 py-3">{(items ?? []).map(renderItem)}</nav>
}
