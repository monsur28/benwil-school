import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: LucideIcon
  label: string
}) {
  return (
    <Button nativeButton={false} variant="outline" className="h-auto justify-start gap-2 py-2.5" render={<Link href={href} />}>
      <Icon />
      {label}
    </Button>
  )
}
