import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "cn"

/**
 * The colour-surface level of the system, between the tinted page canvas and
 * a white `Panel`.
 *
 * A tinted panel carries no border and no shadow — the tint alone separates
 * it from the canvas, which is what stops a page reading as a grid of
 * identical outlined boxes. Every tone maps to `--surface-*` in globals.css,
 * so re-theming is a token edit, never a component edit.
 *
 * Tones are chosen by meaning, not decoration (see `Tone` below).
 */
export type Tint = "blue" | "orange" | "green" | "yellow" | "violet" | "rose"

const SURFACE: Record<Tint, string> = {
  blue: "bg-surface-blue",
  orange: "bg-surface-orange",
  green: "bg-surface-green",
  yellow: "bg-surface-yellow",
  violet: "bg-surface-violet",
  rose: "bg-surface-rose",
}

const INK: Record<Tint, string> = {
  blue: "text-surface-blue-foreground",
  orange: "text-surface-orange-foreground",
  green: "text-surface-green-foreground",
  yellow: "text-surface-yellow-foreground",
  violet: "text-surface-violet-foreground",
  rose: "text-surface-rose-foreground",
}

/** The tint's own ink — for headings, values and icons sitting on it. */
export function tintInk(tint: Tint) {
  return INK[tint]
}

/** The tint's background — for chips and accents matching a section. */
export function tintSurface(tint: Tint) {
  return SURFACE[tint]
}

export function TintedPanel({
  tint,
  children,
  className,
  as: Component = "section",
}: {
  tint: Tint
  children: ReactNode
  className?: string
  as?: "section" | "div" | "article"
}) {
  return (
    <Component className={cn("flex min-w-0 flex-col overflow-hidden rounded-2xl", SURFACE[tint], className)}>
      {children}
    </Component>
  )
}

/**
 * Heading for a tinted panel. Title and icon take the tint's ink; the
 * "see all" link is the same ink at reduced weight, so a tinted section
 * never needs a divider rule to separate its head from its body.
 */
export function TintedPanelHeader({
  tint,
  title,
  icon,
  href,
  hrefLabel,
  action,
  className,
}: {
  tint: Tint
  title: string
  icon?: ReactNode
  href?: string
  hrefLabel?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-5 pb-3 pt-4", className)}>
      <h2 className={cn("flex min-w-0 items-center gap-2 text-[13px] font-bold uppercase tracking-[0.1em]", INK[tint])}>
        {icon && <span className="shrink-0 [&_svg]:size-4">{icon}</span>}
        <span className="truncate">{title}</span>
      </h2>

      {action ??
        (href && (
          <Link
            href={href}
            className={cn(
              "group inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold opacity-80 transition-opacity hover:opacity-100",
              INK[tint]
            )}
          >
            {hrefLabel}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
    </div>
  )
}

/**
 * An inset white sheet *inside* a tinted panel — for the one part of a
 * coloured section that is dense enough to need maximum readability (a
 * homework list, a notice feed). Keeps the section's colour identity at its
 * edges while the content itself stays on white.
 */
export function TintedPanelBody({
  children,
  className,
  inset = true,
}: {
  children: ReactNode
  className?: string
  inset?: boolean
}) {
  return (
    // Deliberately *not* `flex-1`: when a panel is stretched to match a
    // taller sibling, the slack should show as the section's own tint, not as
    // a tall empty white rectangle.
    <div
      className={cn(
        "min-w-0",
        inset ? "mx-1.5 mb-1.5 overflow-hidden rounded-[0.85rem] bg-card" : "px-5 pb-5",
        className
      )}
    >
      {children}
    </div>
  )
}
