import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export type QuickAction = { href: string; label: string; icon: LucideIcon }

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {actions.map((action) => (
        <Button
          key={action.href}
          nativeButton={false}
          variant="outline"
          className="h-auto flex-col gap-1.5 py-3"
          render={<Link href={action.href} />}
        >
          <action.icon className="size-4" />
          <span className="text-xs">{action.label}</span>
        </Button>
      ))}
    </div>
  )
}
