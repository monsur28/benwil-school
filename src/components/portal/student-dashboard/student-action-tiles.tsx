import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "cn"
import { tintInk, tintSurface, type Tint } from "@/components/shared/tinted-panel"

export type StudentAction = {
  key: string
  href: string
  label: string
  icon: LucideIcon
  /** Chosen by what the destination *means*, never for variety's sake. */
  tint: Tint
}

/**
 * The student's shortcuts.
 *
 * Solid tinted tiles rather than outlined white ones: this row is the page's
 * colour key, and a student learns "green is attendance, orange is homework"
 * here before meeting those same tints on the sections below.
 *
 * No borders — the tint does the separating — and the icon sits on a white
 * chip so it stays legible on every surface.
 */
export function StudentActionTiles({ actions }: { actions: StudentAction[] }) {
  return (
    <nav aria-label="Quick actions" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {actions.map((action) => (
        <Link
          key={action.key}
          href={action.href}
          className={cn(
            "group flex min-h-[5.5rem] flex-col justify-between gap-3 rounded-2xl p-4 transition-[transform,filter] duration-150 hover:-translate-y-0.5 hover:brightness-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            tintSurface(action.tint)
          )}
        >
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl bg-card/75",
              tintInk(action.tint)
            )}
          >
            <action.icon className="size-4.5" />
          </span>
          <span className={cn("text-[13px] font-bold leading-snug", tintInk(action.tint))}>
            {action.label}
          </span>
        </Link>
      ))}
    </nav>
  )
}
