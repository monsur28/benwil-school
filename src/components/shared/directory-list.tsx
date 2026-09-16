import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"
import { Panel } from "@/components/shared/panel"

export type DirectoryEntry = {
  href: string
  icon: LucideIcon
  title: string
  description?: string
}

/**
 * A module's table of contents (Academics, Settings, …).
 *
 * A hub page is a menu, not a data display, so it is rendered as one divided
 * list of destinations rather than a grid of identical cards — faster to
 * scan, and it stops every module landing page looking like the dashboard.
 */
export function DirectoryList({ entries }: { entries: DirectoryEntry[] }) {
  return (
    <Panel>
      <ul className="divide-y divide-border-light">
        {entries.map((entry) => (
          <li key={entry.href}>
            <Link
              href={entry.href}
              className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-subtle sm:px-5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-brand-navy-light group-hover:text-primary">
                <entry.icon className="size-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold leading-snug text-foreground">
                  {entry.title}
                </span>
                {entry.description && (
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-muted-foreground">
                    {entry.description}
                  </span>
                )}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
