import type { ReactNode } from "react"
import { cn } from "cn"

/**
 * Filters sit on the canvas as a quiet toolbar, not inside a second card
 * stacked above the data. On phones every control goes full width and stacks,
 * so a filter row never turns into a line of unusable 90px dropdowns.
 *
 * Works with the existing filter forms unchanged — it only supplies layout
 * and the mobile sizing rules for `NativeSelect`/`Input` children.
 */
export function FilterBar({
  children,
  className,
  trailing,
}: {
  children: ReactNode
  className?: string
  trailing?: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-2.5 sm:flex-row sm:items-center sm:justify-between",
        // Native selects default to `w-fit`, which collapses them on a phone.
        "[&_[data-slot=native-select-wrapper]]:w-full sm:[&_[data-slot=native-select-wrapper]]:w-auto",
        className
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {trailing && <div className="flex shrink-0 flex-wrap items-center gap-2">{trailing}</div>}
    </div>
  )
}

/**
 * A removable summary of what is currently filtering the view. Gives the user
 * an answer to "why am I only seeing 3 rows?" without re-reading the controls.
 */
export function FilterChip({
  label,
  value,
  onClearHref,
}: {
  label: string
  value: string
  onClearHref?: string
}) {
  const content = (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </>
  )

  if (onClearHref) {
    return (
      <a
        href={onClearHref}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs transition-colors hover:border-border-strong"
      >
        {content}
      </a>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs">
      {content}
    </span>
  )
}
