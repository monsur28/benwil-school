import type { ReactNode } from "react"
import { getTranslations } from "next-intl/server"
import { GraduationCap } from "lucide-react"
import type { SessionData } from "@/lib/auth/session"
import { getNavForRole } from "@/lib/permissions/nav"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SidebarNav } from "@/components/shared/sidebar-nav"
import { MobileNav } from "@/components/shared/mobile-nav"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { UserMenu } from "@/components/shared/user-menu"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { Toaster } from "@/components/ui/toast"

export async function AppShell({ user, children }: { user: SessionData; children: ReactNode }) {
  const [t, tCommon, tRoles] = await Promise.all([
    getTranslations(),
    getTranslations("common"),
    getTranslations("roles"),
  ])

  const navItems = getNavForRole(user.role).map((item) => ({
    href: item.href,
    label: t(item.labelKey),
    icon: <item.icon className="size-4" />,
  }))

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-14 items-center gap-2 px-4">
          <GraduationCap className="size-5 text-sidebar-primary" />
          <span className="font-heading text-sm font-semibold text-sidebar-foreground">
            {tCommon("appName")}
          </span>
        </div>
        <ScrollArea className="flex-1">
          <SidebarNav items={navItems} />
        </ScrollArea>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3 sm:px-6">
          <div className="flex items-center gap-2">
            <MobileNav items={navItems} appName={tCommon("appName")} />
            <BreadcrumbNav items={navItems} dashboardLabel={t("nav.dashboard")} />
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <UserMenu name={user.name} roleLabel={tRoles(user.role)} />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
