import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "cn"
import { IconBadge, type IconBadgeTone } from "@/components/ui/icon-badge"

/**
 * The container primitive for this design system.
 *
 * A panel is a white sheet with a hairline edge and no shadow — depth comes
 * from the tinted canvas behind it, not from drop shadows. Three tones keep
 * sections from all reading at the same weight:
 *
 *   default — the standard content sheet
 *   quiet   — supporting content that should recede
 *   plain   — no chrome at all: for sections that only need a heading and
 *             whitespace, so the page is not a wall of identical boxes
 */
export function Panel({
  children,
  className,
  tone = "default",
  as: Component = "section",
}: {
  children: ReactNode
  className?: string
  tone?: "default" | "quiet" | "plain"
  as?: "section" | "div" | "article"
}) {
  return (
    <Component
      className={cn(
        "flex min-w-0 flex-col overflow-hidden",
        tone === "default" && "panel",
        tone === "quiet" && "panel-quiet",
        className
      )}
    >
      {children}
    </Component>
  )
}

/**
 * The tone a panel's header icon carries. Default `muted` keeps the icon
 * quiet for ordinary module panels; the colour tones are for dashboards,
 * where the icon is how a section is recognised before it is read.
 */
export type PanelIconTone = IconBadgeTone


/**
 * Panel heading row. `action` sits opposite the title; `href` renders the
 * conventional "see everything" affordance instead.
 *
 * `stack` is for headers whose action is wide enough to squeeze the title to
 * nothing on a phone (a segmented control, a filter pair): the action drops
 * below the title until `sm`, where the usual side-by-side row returns.
 */
export function PanelHeader({
  title,
  description,
  icon,
  iconTone = "muted",
  action,
  href,
  hrefLabel,
  stack = false,
  className,
}: {
  title: string
  description?: string
  icon?: ReactNode
  iconTone?: PanelIconTone
  action?: ReactNode
  href?: string
  hrefLabel?: string
  stack?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "border-b border-border-light px-4 py-3.5 sm:px-5",
        stack
          ? "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
          : "flex items-start justify-between gap-3",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <IconBadge tone={iconTone} size="sm" className="mt-0.5">
            {icon}
          </IconBadge>
        )}
        <div className="min-w-0">
          <h2 className="title-section truncate">{title}</h2>
          {description && (
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      {action ??
        (href && (
          <Link
            href={href}
            className="group inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-dashboard-blue transition-colors hover:text-primary"
          >
            {hrefLabel}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
    </div>
  )
}

export function PanelBody({
  children,
  className,
  flush = false,
}: {
  children: ReactNode
  className?: string
  flush?: boolean
}) {
  return <div className={cn("min-w-0 flex-1", !flush && "px-4 py-4 sm:px-5", className)}>{children}</div>
}

export function PanelFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "strip flex flex-wrap items-center justify-between gap-3 border-t border-border-light px-4 py-3 text-[13px] text-muted-foreground sm:px-5",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * A heading for a *chrome-less* section — the counterpart to PanelHeader for
 * content that should not be boxed. Keeps the page rhythm without adding
 * another card.
 */
export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="font-heading text-lg font-bold tracking-[-0.02em] text-foreground">{title}</h2>
        {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
