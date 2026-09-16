import type { ReactNode } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "cn"

/**
 * The container for a record list.
 *
 * A data panel owns the whole list surface: a title bar carrying the record
 * count, the rows themselves, and a footer for pagination. Keeping all three
 * in one component is what stops every list screen inventing its own
 * header/pagination markup.
 */
export function DataPanel({
  title,
  count,
  description,
  toolbar,
  children,
  footer,
  className,
}: {
  title: string
  count?: ReactNode
  description?: string
  toolbar?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  return (
    <section className={cn("panel overflow-hidden", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h2 className="title-section truncate">{title}</h2>
          {count !== undefined && (
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
              {count}
            </span>
          )}
        </div>
        {description && !toolbar && (
          <p className="text-[13px] text-muted-foreground">{description}</p>
        )}
        {toolbar && <div className="flex shrink-0 items-center gap-2">{toolbar}</div>}
      </div>
      {children}
      {footer}
    </section>
  )
}

/**
 * Wraps a `<Table>` so that below `md` its rows re-flow into stacked cards
 * (see `.table-cards` in globals.css) instead of forcing a horizontal scroll.
 *
 * Give every `<TableCell>` a `data-label` matching its column header — that
 * label is what the card layout prints above the value. Mark the identity
 * cell `data-cell="primary"`, the action cell `data-cell="actions"`, and any
 * cell not worth a phone's space `data-cell="hide"`.
 */
export function RecordTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("table-cards divide-y divide-border-light md:divide-y-0", className)}>
      {children}
    </div>
  )
}

/**
 * Pagination footer. Renders as a strip inside the data panel; the page
 * indicator stays left and the controls right, both wrapping cleanly at
 * 390px.
 */
export function PaginationBar({
  label,
  previousHref,
  nextHref,
  previousLabel,
  nextLabel,
}: {
  label: string
  previousHref?: string
  nextHref?: string
  previousLabel: string
  nextLabel: string
}) {
  const buttonClass =
    "inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
  const disabledClass =
    "inline-flex h-8 cursor-not-allowed items-center gap-1 rounded-lg border border-border-light bg-card px-2.5 text-[13px] font-medium text-muted-foreground/60"

  return (
    <div className="strip flex flex-wrap items-center justify-between gap-3 border-t border-border-light px-4 py-3 sm:px-5">
      <span className="text-[13px] tabular-nums text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {previousHref ? (
          <Link href={previousHref} className={buttonClass}>
            <ChevronLeft className="size-3.5" />
            {previousLabel}
          </Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">
            <ChevronLeft className="size-3.5" />
            {previousLabel}
          </span>
        )}
        {nextHref ? (
          <Link href={nextHref} className={buttonClass}>
            {nextLabel}
            <ChevronRight className="size-3.5" />
          </Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">
            {nextLabel}
            <ChevronRight className="size-3.5" />
          </span>
        )}
      </div>
    </div>
  )
}
