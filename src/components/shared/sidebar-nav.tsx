"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"
import type { TranslatedNavItem } from "@/components/shared/nav-items"

export function SidebarNav({ items }: { items: TranslatedNavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5 p-2">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
