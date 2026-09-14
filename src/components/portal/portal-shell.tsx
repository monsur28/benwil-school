import type { ReactNode } from "react"
import { getTranslations } from "next-intl/server"
import type { SessionData } from "@/lib/auth/session"
import { SchoolCrest } from "@/components/shared/school-crest"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { UserMenu } from "@/components/shared/user-menu"
import { Toaster } from "@/components/ui/toast"

// Deliberately not the admin AppShell: the portal has no sidebar, search,
// or breadcrumbs - just a header and whatever simple nav the caller passes
// in. Reuses the same header pieces (crest, language switcher, logout) so
// the portal still feels like the same product.
export async function PortalShell({
  user,
  nav,
  children,
}: {
  user: SessionData
  nav: ReactNode
  children: ReactNode
}) {
  const [tCommon, tRoles] = await Promise.all([getTranslations("common"), getTranslations("roles")])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-xs print:hidden">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <SchoolCrest size="sm" className="size-7" />
            <span className="truncate font-heading text-sm font-bold tracking-tight">
              {tCommon("appName")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            <UserMenu name={user.name} roleLabel={tRoles(user.role)} />
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-2">{nav}</div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4 print:p-0">{children}</main>
      <Toaster />
    </div>
  )
}
