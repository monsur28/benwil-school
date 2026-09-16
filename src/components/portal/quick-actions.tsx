import Link from "next/link"
import type { LucideIcon } from "lucide-react"

export type QuickAction = {
  key?: string
  href: string
  label: string
  icon: LucideIcon
}

/**
 * Portal shortcuts.
 *
 * A wrapping row of quiet chips rather than a grid of buttons — on a phone
 * they stack two-up at a comfortable 44px target, and on desktop they read as
 * navigation rather than as a set of competing calls to action.
 */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {actions.map((action, index) => (
        <Link
          key={action.key ?? `${action.label}-${action.href}-${index}`}
          href={action.href}
          className="group flex min-h-11 items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 transition-colors hover:border-border-strong hover:bg-subtle"
        >
          <action.icon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          <span className="min-w-0 truncate text-[13px] font-semibold text-foreground">{action.label}</span>
        </Link>
      ))}
    </nav>
  )
}
