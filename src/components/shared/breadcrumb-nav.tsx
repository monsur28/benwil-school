"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function BreadcrumbNav({
  items,
  dashboardLabel,
}: {
  items: { href: string; label: string }[]
  dashboardLabel: string
}) {
  const pathname = usePathname()
  const current = items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
  const isDashboard = current?.href === "/dashboard"

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {isDashboard || !current ? (
            <BreadcrumbPage>{dashboardLabel}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink render={<Link href="/dashboard" />}>{dashboardLabel}</BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {current && !isDashboard && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{current.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
