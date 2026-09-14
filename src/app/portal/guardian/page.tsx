import Link from "next/link"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ChevronRight, Users } from "lucide-react"
import { requireGuardianIdentity } from "@/lib/portal/identity"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

export default async function GuardianChildrenPage() {
  const { children } = await requireGuardianIdentity()
  const t = await getTranslations("portal")

  // One child is the common case - skip the list and land the guardian
  // straight on that child's dashboard (Login -> Select Child -> Results
  // should take very few interactions, per the portal's UX principle).
  if (children.length === 1) {
    redirect(`/portal/guardian/children/${children[0].id}`)
  }

  if (children.length === 0) {
    return <EmptyState icon={Users} title={t("empty.noChildrenTitle")} description={t("empty.noChildren")} />
  }

  return (
    <div className="space-y-2">
      <h1 className="font-heading text-xl font-bold tracking-tight">{t("nav.myChildren")}</h1>
      {children.map((child) => (
        <Button
          key={child.id}
          nativeButton={false}
          variant="outline"
          className="h-auto w-full justify-between gap-3 px-4 py-3 text-left"
          render={<Link href={`/portal/guardian/children/${child.id}`} />}
        >
          <div>
            <p className="text-sm font-medium">{child.name}</p>
            <p className="text-xs text-muted-foreground">
              {child.className} {child.sectionName}
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      ))}
    </div>
  )
}
