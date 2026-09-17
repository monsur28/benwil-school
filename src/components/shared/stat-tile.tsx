import type { ReactNode } from "react"
import Link from "next/link"
import { cn } from "cn"

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info"

const ACCENT: Record<Tone, string> = {
  neutral: "bg-border-strong",
  brand: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
}

const VALUE_TONE: Record<Tone, string> = {
  neutral: "text-foreground",
  brand: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
}

/**
 * A row of metrics rendered as one hairline-divided band rather than N
 * floating cards — the single biggest source of "generic admin template" look.
 * Collapses to two columns on phones and one on very narrow screens.
 */
export function StatRow({
  children,
  columns = 4,
  className,
}: {
  children: ReactNode
  columns?: 2 | 3 | 4 | 5
  className?: string
}) {
  return (
    <section
      className={cn(
        "panel grid divide-y divide-border-light overflow-hidden sm:grid-cols-2 sm:divide-x",
        columns === 2 && "sm:[&>*:nth-child(-n+2)]:border-t-0",
        columns === 3 && "lg:grid-cols-3 lg:divide-y-0",
        columns === 4 && "lg:grid-cols-4 lg:divide-y-0",
        columns === 5 && "lg:grid-cols-5 lg:divide-y-0",
        className
      )}
    >
      {children}
    </section>
  )
}

/**
 * One metric. Number-forward: the value is the largest thing in the tile, the
 * label sits above it as a micro-caption, and supporting detail sits below in
 * muted text. An icon is optional and deliberately small — the number is the
 * subject, not the decoration.
 */
export function StatTile({
  label,
  value,
  detail,
  icon,
  tone = "neutral",
  href,
  footer,
}: {
  label: string
  value: ReactNode
  detail?: ReactNode
  icon?: ReactNode
  tone?: Tone
  href?: string
  footer?: ReactNode
}) {
  const body = (
    <>
      <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-0.5", ACCENT[tone])} />
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow truncate">{label}</span>
        {icon && <span className="shrink-0 text-muted-foreground [&_svg]:size-4">{icon}</span>}
      </div>
      <p className={cn("metric mt-3 truncate text-[1.75rem]", VALUE_TONE[tone])}>{value}</p>
      {detail && <p className="mt-2 truncate text-[13px] text-muted-foreground">{detail}</p>}
      {footer && <div className="mt-3 text-xs">{footer}</div>}
    </>
  )

  const base = "relative min-w-0 bg-card px-4 py-5 sm:px-5"

  if (href) {
    return (
      <Link href={href} className={cn(base, "transition-colors hover:bg-subtle")}>
        {body}
      </Link>
    )
  }

  return <div className={base}>{body}</div>
}

/**
 * Compact inline delta shown under a metric. Neutral by default so an
 * unknown or flat trend never fakes a green "up".
 */
export function StatDelta({
  children,
  tone = "neutral",
  icon,
}: {
  children: ReactNode
  tone?: "neutral" | "up" | "down"
  icon?: ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 text-xs font-medium",
        tone === "neutral" && "text-muted-foreground",
        tone === "up" && "text-success",
        tone === "down" && "text-danger"
      )}
    >
      {icon && <span className="shrink-0 [&_svg]:size-3.5">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  )
}
