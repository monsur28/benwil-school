import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { Search, GraduationCap } from "lucide-react"
import type { SessionData } from "@/lib/auth/session"
import { getNavForRole, getGroupedNavForRole } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { getSchoolIdentity } from "@/lib/settings/school-settings"
import { SidebarNav } from "@/components/shared/sidebar-nav"
import { MobileNav } from "@/components/shared/mobile-nav"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { UserMenu } from "@/components/shared/user-menu"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { NotificationsMenu } from "@/components/shared/notifications-menu"
import { SchoolCrest } from "@/components/shared/school-crest"
import { Toaster } from "@/components/ui/toast"

export async function AppShell({ 
  user, 
  children,
  customNavItems,
  customNavGroups
}: { 
  user: SessionData; 
  children: ReactNode;
  customNavItems?: { href: string; label: string; icon: ReactNode }[];
  customNavGroups?: { titleKey: string; title: string; items: { href: string; label: string; icon: ReactNode }[] }[];
}) {
  const [t, tCommon, tRoles, activeAcademicYear, identity] = await Promise.all([
    getTranslations(),
    getTranslations("common"),
    getTranslations("roles"),
    prisma.academicYear.findFirst({
      where: { schoolId: user.schoolId, isActive: true },
      select: { name: true },
    }),
    getSchoolIdentity(user.schoolId),
  ])

  const navItems = customNavItems ?? getNavForRole(user.role).map((item) => ({
    href: item.href,
    label: t(item.labelKey),
    icon: <item.icon className="size-4" />,
  }))

  const navGroups = customNavGroups ?? getGroupedNavForRole(user.role).map((group) => ({
    titleKey: group.titleKey,
    title: t(group.titleKey),
    items: group.items.map((item) => ({
      href: item.href,
      label: t(item.labelKey),
      icon: <item.icon className="size-4" />,
    })),
  }))

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border/70 bg-sidebar lg:flex print:hidden">
        {/* Institutional Sidebar Header with School Crest */}
        <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-sidebar-border/60 px-5">
          {identity.logoUrl ? (
            <Image
              src={identity.logoUrl}
              alt={identity.schoolName}
              width={36}
              height={36}
              className="size-9 shrink-0 rounded-lg object-contain drop-shadow-xs"
              unoptimized
            />
          ) : (
            <SchoolCrest size="sm" className="size-9 drop-shadow-xs" />
          )}
          <div className="min-w-0">
            <span className="font-heading text-[15px] font-bold tracking-tight text-sidebar-foreground truncate block">
              {identity.schoolName}
            </span>
            {identity.establishedYear && (
              <p className="text-[10px] font-medium tracking-widest text-sidebar-foreground/60 uppercase">
                {t("common.header.establishedYear", { year: identity.establishedYear })}
              </p>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Container */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-1 [scrollbar-width:thin] [scrollbar-color:var(--color-sidebar-border)_transparent] hover:[scrollbar-color:var(--color-muted-foreground)_transparent]">
          <SidebarNav groups={navGroups} items={navItems} />
        </div>

        {/* Institutional System Status Footer */}
        <div className="shrink-0 border-t border-sidebar-border/60 px-3 py-3">
          <div className="rounded-xl border border-sidebar-border/65 bg-sidebar-accent/35 p-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-sidebar-foreground">
              <span>{activeAcademicYear ? t("common.header.session", { year: activeAcademicYear.name }) : t("common.header.session", { year: "—" })}</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-success">
                <span className="size-1.5 rounded-full bg-success animate-pulse" />
                {tCommon("online")}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-sidebar-foreground/50">{tCommon("allModulesNominal")}</p>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-60 print:pl-0">
        <header className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center justify-between gap-2 border-b border-border px-3 sm:px-6 bg-background/95 backdrop-blur-xs print:hidden">
          <div className="flex items-center gap-3">
            <MobileNav groups={navGroups} items={navItems} appName={identity.schoolName} />
            <BreadcrumbNav items={navItems} dashboardLabel={t("nav.dashboard")} />
          </div>

          <div className="flex items-center gap-2">
            {activeAcademicYear && (
              <span
                className="hidden items-center gap-1.5 rounded-md border border-brand-navy-light bg-brand-navy-light px-2.5 py-1 text-xs font-medium text-brand-navy md:flex"
                title={t("common.header.academicSession")}
              >
                <GraduationCap className="size-3.5" />
                {activeAcademicYear.name}
              </span>
            )}

            {/* Quick Search Trigger */}
            <Link
              href="/students"
              className="hidden md:flex items-center gap-2 rounded-md border border-border/70 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
            >
              <Search className="size-3.5 text-muted-foreground" />
              <span>Search directory...</span>
              <kbd className="ml-1 rounded border border-border/80 bg-muted px-1 font-mono text-[10px] text-muted-foreground">
                Cmd+K
              </kbd>
            </Link>

            <NotificationsMenu />
            <LanguageSwitcher />
            <UserMenu name={user.name} roleLabel={tRoles(user.role)} />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 print:p-0">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
