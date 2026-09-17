import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { Search } from "lucide-react"
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

/**
 * The application frame.
 *
 * Composition:
 *   - a fixed navigation rail carrying the school identity, the grouped
 *     navigation and — new in this design — the signed-in account card and
 *     the active academic session, so the top bar is free to be quiet;
 *   - a slim top bar that only answers "where am I" plus the three global
 *     utilities (search, notifications, language);
 *   - a centred content column that never exceeds a comfortable reading
 *     width, so 1440px+ screens do not stretch tables into illegibility.
 *
 * Below `lg` the rail is reproduced verbatim inside a swipe-dismissable
 * drawer — same brand block, same groups, same account card.
 */
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

  // Rendered identically in the fixed rail and in the mobile drawer.
  const brandBlock = (
    <div className="brand-wash shrink-0 px-5 pb-5 pt-6">
      <div className="flex items-center gap-3">
        {identity.logoUrl ? (
          <Image
            src={identity.logoUrl}
            alt={identity.schoolName}
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-xl bg-white/10 object-contain p-1 ring-1 ring-white/15"
            unoptimized
          />
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
            <SchoolCrest size="sm" className="size-6" />
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate font-heading text-[15px] font-bold leading-tight tracking-[-0.01em] text-sidebar-foreground">
            {identity.schoolName}
          </span>
          {identity.establishedYear && (
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-muted">
              {t("common.header.establishedYear", { year: identity.establishedYear })}
            </span>
          )}
        </span>
      </div>
    </div>
  )

  const railFooter = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-xl border border-sidebar-border px-3 py-2">
        <span className="truncate text-[11px] font-medium text-sidebar-foreground">
          {t("common.header.session", { year: activeAcademicYear?.name ?? "—" })}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-medium text-success">
          <span className="size-1.5 rounded-full bg-success" />
          {tCommon("online")}
        </span>
      </div>
      <UserMenu name={user.name} roleLabel={tRoles(user.role)} variant="rail" />
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        {tCommon("skipToContent")}
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17rem] flex-col bg-sidebar text-sidebar-foreground shadow-rail lg:flex print:hidden">
        {brandBlock}
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarNav groups={navGroups} items={navItems} />
        </div>
        <div className="shrink-0 p-3">{railFooter}</div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-[17rem] print:pl-0">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6 lg:px-8 print:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <MobileNav
              groups={navGroups}
              items={navItems}
              appName={identity.schoolName}
              brand={brandBlock}
              footer={railFooter}
              triggerLabel={tCommon("header.openNavigation")}
            />
            <BreadcrumbNav items={navItems} dashboardLabel={t("nav.dashboard")} />
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href="/students"
              className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground md:flex"
            >
              <Search className="size-4" />
              <span>{tCommon("header.searchDirectory")}</span>
            </Link>

            <NotificationsMenu />
            <LanguageSwitcher />
            <span className="lg:hidden">
              <UserMenu name={user.name} roleLabel={tRoles(user.role)} />
            </span>
          </div>
        </header>

        <main
          id="main-content"
          className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:max-w-none print:p-0"
        >
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
