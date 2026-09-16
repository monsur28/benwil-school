import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "cn"

/**
 * Empty states explain what the space is for and what to do next — never just
 * "No data". Rendered as a generous dashed field rather than a solid card so
 * it reads as "nothing here yet", not as a populated section.
 *
 * `inset` is for empties that sit *inside* an existing panel (an empty table
 * body, an empty tab) and therefore must not draw a second border.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  inset = false,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  inset?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        !inset && "rounded-2xl border border-dashed border-border-strong bg-card/60",
        className
      )}
    >
      <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 font-heading text-base font-semibold tracking-[-0.01em] text-foreground">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
