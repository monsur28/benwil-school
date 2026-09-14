import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "cn"

export function QuickAction({
  href,
  icon: Icon,
  label,
  description,
  kbd,
  className,
}: {
  href: string
  icon: LucideIcon
  label: string
  description?: string
  kbd?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3.5 text-card-foreground transition-all duration-150 hover:border-neutral-300 hover:bg-muted/20 active:scale-[0.99] dark:hover:border-neutral-700",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-foreground transition-colors group-hover:border-neutral-300 group-hover:bg-[#E1F3FE] group-hover:text-[#1F6C9F] dark:group-hover:bg-neutral-800 dark:group-hover:text-blue-400">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium tracking-tight text-foreground transition-colors group-hover:text-foreground">
            {label}
          </p>
          {description && (
            <p className="truncate text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>

      {kbd && (
        <kbd className="hidden shrink-0 items-center justify-center rounded border border-border/80 bg-[#F7F6F3] px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground shadow-xs group-hover:border-neutral-300 group-hover:text-foreground dark:bg-neutral-800 sm:inline-flex">
          {kbd}
        </kbd>
      )}
    </Link>
  )
}
