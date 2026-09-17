import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { IconBadge, type IconBadgeName, type IconBadgeTone } from "@/components/ui/icon-badge"
import { cn } from "cn"

export function QuickAction({
  href,
  icon: Icon,
  badgeName,
  badgeTone = "blue",
  label,
  description,
  kbd,
  className,
}: {
  href: string
  icon?: LucideIcon
  badgeName?: IconBadgeName
  badgeTone?: IconBadgeTone
  label: string
  description?: string
  kbd?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-card-foreground transition-colors hover:border-border-strong hover:bg-subtle",
        className
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        {Icon ? (
          <IconBadge icon={Icon} tone={badgeTone} size="sm" />
        ) : badgeName ? (
          <IconBadge name={badgeName} tone={badgeTone} size="sm" />
        ) : null}
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-foreground">{label}</span>
          {description && (
            <span className="block truncate text-[11px] text-muted-foreground">{description}</span>
          )}
        </span>
      </span>

      {kbd && (
        <kbd className="hidden shrink-0 items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground sm:inline-flex">
          {kbd}
        </kbd>
      )}
    </Link>
  )
}

