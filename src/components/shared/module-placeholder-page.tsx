import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { PageHeader } from "@/components/shared/page-header"
import { ComingSoon } from "@/components/shared/coming-soon"

// Every not-yet-built module page is the same shape: enforce the same
// roles its nav entry declares, show its title, show the coming-soon state.
export async function ModulePlaceholderPage({ href, titleKey }: { href: string; titleKey: string }) {
  await requireRole(...getRolesForHref(href))
  const t = await getTranslations()

  return (
    <div className="space-y-6">
      <PageHeader title={t(titleKey)} />
      <ComingSoon />
    </div>
  )
}
