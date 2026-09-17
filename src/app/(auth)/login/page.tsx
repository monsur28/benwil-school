import { redirect } from "next/navigation"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { ShieldCheck } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { portalHomeForRole } from "@/lib/portal/routes"
import { getLoginBranding } from "@/lib/settings/branding"
import { SlidingAuthCard } from "@/components/auth/sliding-auth-card"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { SchoolCrest } from "@/components/shared/school-crest"

/**
 * Sign-in.
 *
 * Composition: an ink brand panel on the left (the same surface language as
 * the app's navigation rail, so signing in already feels like the product),
 * and a calm white column on the right holding nothing but the form. The
 * campus photograph sits *behind* the ink at low opacity rather than under a
 * white scrim, which keeps every piece of text at full contrast.
 *
 * Below `lg` the brand panel collapses into a compact header above the form.
 */
export default async function LoginPage() {
  const session = await getSession()
  if (session.userId && session.role) {
    redirect(portalHomeForRole(session.role))
  }

  const [branding, tAuth] = await Promise.all([getLoginBranding(), getTranslations("auth")])
  const year = new Date().getFullYear()

  const mark = branding.logoUrl ? (
    <Image
      src={branding.logoUrl}
      alt={branding.schoolName}
      width={44}
      height={44}
      className="size-11 shrink-0 rounded-xl bg-white/10 object-contain p-1.5 ring-1 ring-white/15"
      unoptimized
      priority
    />
  ) : (
    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
      <SchoolCrest size="sm" className="size-7" />
    </span>
  )

  return (
    <main className="flex min-h-dvh w-full bg-card">
      {/* Brand panel */}
      <aside className="relative hidden w-[46%] shrink-0 flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex xl:w-[50%] xl:p-14">
        <Image
          src={branding.loginBackgroundUrl || "/students_studying.jpg"}
          alt=""
          fill
          priority
          unoptimized={Boolean(branding.loginBackgroundUrl)}
          aria-hidden="true"
          className="pointer-events-none object-cover opacity-[0.14]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/70 to-sidebar/30"
        />

        <div className="relative flex items-center gap-3">
          {mark}
          <span className="font-heading text-lg font-bold tracking-[-0.02em]">{branding.schoolName}</span>
        </div>

        <div className="relative max-w-lg">
          <h2 className="font-heading text-[2.75rem] font-bold leading-[1.05] tracking-[-0.04em] xl:text-[3.25rem]">
            {branding.loginTitle}
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-sidebar-muted">
            {branding.loginDescription}
          </p>
        </div>

        <p className="relative flex items-center gap-2 text-[12px] text-sidebar-muted">
          <ShieldCheck className="size-4 shrink-0" />
          {tAuth("securityNotice")}
        </p>
      </aside>

      {/* Form column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-2.5 lg:invisible">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
              {branding.logoUrl ? (
                <Image
                  src={branding.logoUrl}
                  alt={branding.schoolName}
                  width={28}
                  height={28}
                  className="size-7 object-contain"
                  unoptimized
                />
              ) : (
                <SchoolCrest size="sm" className="size-6" />
              )}
            </span>
            <span className="truncate font-heading text-sm font-bold tracking-[-0.01em] text-foreground">
              {branding.schoolName}
            </span>
          </div>
          <LanguageSwitcher variant="rounded" />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-6 sm:px-8">
          <SlidingAuthCard branding={branding} />
        </div>

        <footer className="flex flex-col items-center gap-1.5 border-t border-border-light px-5 py-5 text-[12px] text-muted-foreground sm:flex-row sm:justify-between sm:px-8">
          <p>{branding.loginFooterText || `© ${year} ${branding.schoolName}`}</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 lg:hidden" />
            <span className="lg:hidden">{tAuth("securityNotice")}</span>
          </p>
        </footer>
      </div>
    </main>
  )
}
