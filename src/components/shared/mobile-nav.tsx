"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from "@/components/ui/drawer"
import { SidebarNav } from "@/components/shared/sidebar-nav"
import type { TranslatedNavItem, TranslatedNavGroup } from "@/components/shared/nav-items"

export function MobileNav({
  items,
  groups,
  appName,
}: {
  items?: TranslatedNavItem[]
  groups?: TranslatedNavGroup[]
  appName: string
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
      <DrawerTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
        <Menu />
        <span className="sr-only">Open navigation</span>
      </DrawerTrigger>
      <DrawerContent className="bg-sidebar text-sidebar-foreground">
        <DrawerTitle className="px-4 pt-4 font-heading text-base font-bold text-sidebar-foreground">{appName}</DrawerTitle>
        <div className="max-h-[80vh] overflow-y-auto pb-6">
          <SidebarNav items={items} groups={groups} onNavigate={() => setOpen(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
