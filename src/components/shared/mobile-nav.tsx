"use client"

import { useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from "@/components/ui/drawer"
import { SidebarNav } from "@/components/shared/sidebar-nav"
import type { TranslatedNavItem, TranslatedNavGroup } from "@/components/shared/nav-items"

/**
 * Below `lg` the rail becomes a full-height drawer that reproduces the rail
 * exactly — same brand block, same grouping, same account card — rather than a
 * stripped-down list. Navigating closes it.
 */
export function MobileNav({
  items,
  groups,
  appName,
  brand,
  footer,
  triggerLabel,
}: {
  items?: TranslatedNavItem[]
  groups?: TranslatedNavGroup[]
  appName: string
  brand?: ReactNode
  footer?: ReactNode
  triggerLabel: string
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the drawer on navigation.
  const [renderedPathname, setRenderedPathname] = useState(pathname)
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname)
    setOpen(false)
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="left">
      <DrawerTrigger
        render={
          <button
            type="button"
            aria-label={triggerLabel}
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
          />
        }
      >
        <Menu className="size-4.5" />
      </DrawerTrigger>
      <DrawerContent className="flex flex-col bg-sidebar text-sidebar-foreground [--drawer-bleed-background:var(--color-sidebar)] [--drawer-content-width:min(19rem,86vw)]">
        <DrawerTitle className="sr-only">{appName}</DrawerTitle>
        {brand}
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarNav items={items} groups={groups} onNavigate={() => setOpen(false)} />
        </div>
        {footer && <div className="shrink-0 border-t border-sidebar-border p-3">{footer}</div>}
      </DrawerContent>
    </Drawer>
  )
}
