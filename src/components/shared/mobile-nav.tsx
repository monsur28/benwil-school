"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from "@/components/ui/drawer"
import { SidebarNav } from "@/components/shared/sidebar-nav"
import type { TranslatedNavItem } from "@/components/shared/nav-items"

export function MobileNav({ items, appName }: { items: TranslatedNavItem[]; appName: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the drawer on navigation. Adjusting state during render (rather
  // than in an effect) for a prop change is the pattern React recommends.
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
        <DrawerTitle className="px-4 pt-4">{appName}</DrawerTitle>
        <SidebarNav items={items} />
      </DrawerContent>
    </Drawer>
  )
}
