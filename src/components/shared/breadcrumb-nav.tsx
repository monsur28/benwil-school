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

/**
 * "Where am I", in the top bar.
 *
 * The root crumb is the signed-in user's home. A portal user's home nav entry
 * is itself labelled "Dashboard", so matching on the label as well as on
 * `/dashboard` is what stops that case rendering as "Dashboard / Dashboard".
 */
export function BreadcrumbNav({
  items,
  dashboardLabel,
}: {
  items: { href: string; label: string }[]
  dashboardLabel: string
}) {
  const pathname = usePathname()
  // Longest match wins: /portal/student and /portal/student/results both
  // match on a results page, and the more specific one is the answer.
  const current = items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]
  const isHome = !current || current.href === "/dashboard" || current.label === dashboardLabel

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem className="min-w-0">
          {isHome ? (
            <BreadcrumbPage className="truncate font-semibold text-foreground">
              {current?.label ?? dashboardLabel}
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink render={<Link href="/dashboard" />} className="truncate">
              {dashboardLabel}
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {current && !isHome && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate font-semibold text-foreground">
                {current.label}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
