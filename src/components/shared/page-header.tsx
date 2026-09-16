import type { ReactNode } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "cn"

/**
 * The opening of every screen.
 *
 * Hierarchy, top to bottom: an optional module eyebrow (where am I), the
 * title (what is this), a one-line description (what can I do here), and the
 * primary action set — right-aligned on desktop, promoted to a full-width row
 * on phones where thumb reach matters more than alignment.
 *
 * `meta` takes short key/value facts (counts, session, status) that belong
 * *with* the title rather than inside the first panel below it.
 */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  meta,
  backHref,
  backLabel,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  eyebrow?: string
  meta?: ReactNode
  backHref?: string
  backLabel?: string
  className?: string
}) {
  return (
    <header className={cn("flex flex-col gap-4", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {backLabel ?? "Back"}
        </Link>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1.5">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="title-page">{title}</h1>
          {description && (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 [&>*]:max-sm:flex-1">{actions}</div>
        )}
      </div>

      {meta && <div className="flex flex-wrap items-center gap-x-6 gap-y-2">{meta}</div>}

      <div className="rule-fade h-px w-full" aria-hidden="true" />
    </header>
  )
}

/**
 * A single fact in the `meta` row: a small label above a prominent value.
 * Deliberately not a card — these are supporting details, not metrics.
 */
export function PageHeaderMeta({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: ReactNode
  tone?: "default" | "success" | "warning" | "danger"
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="eyebrow">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "default" && "text-foreground",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger"
        )}
      >
        {value}
      </span>
    </div>
  )
}
