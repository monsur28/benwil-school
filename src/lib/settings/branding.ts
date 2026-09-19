import "server-only"
import { getLocale } from "next-intl/server"
import { getPrimarySchoolId, getSchoolWithSettings } from "./school-settings"
import { pickLocalized } from "@/lib/format"
import { SETTINGS_DEFAULTS } from "./defaults"

// See the identical helper/comment in ./school-settings.ts - getLocale()
// throws outside a real Next.js request; this keeps that from ever crashing
// resolvePublicBranding() (e.g. under a future direct unit test).
async function currentLocale(): Promise<string> {
  try {
    return await getLocale()
  } catch {
    return "en"
  }
}

// Everything in here is safe to reach an unauthenticated visitor (the login
// page, the root layout before any session exists). Never add email, phone,
// address, principalName, or anything else administrative to this type -
// getSchoolIdentity() is the authenticated equivalent for that (spec §22).
export type PublicBranding = {
  schoolName: string
  logoUrl: string | null
  faviconUrl: string | null
  loginLogoUrl: string | null
  loginBackgroundUrl: string | null
  loginTitle: string
  loginSubtitle: string
  loginDescription: string
  loginFooterText: string | null
  primaryColor: string
  secondaryColor: string
  sidebarColor: string | null
}

async function resolvePublicBranding(): Promise<PublicBranding> {
  const [schoolId, locale] = await Promise.all([getPrimarySchoolId(), currentLocale()])
  const school = schoolId ? await getSchoolWithSettings(schoolId) : null
  const settings = school?.settings ?? null
  const englishName = settings?.schoolName || school?.name || SETTINGS_DEFAULTS.schoolName

  return {
    schoolName: pickLocalized(englishName, settings?.schoolNameBangla, locale),
    logoUrl: settings?.logoUrl || SETTINGS_DEFAULTS.logoUrl,
    faviconUrl: settings?.faviconUrl || SETTINGS_DEFAULTS.faviconUrl,
    loginLogoUrl: settings?.loginLogoUrl || settings?.logoUrl || SETTINGS_DEFAULTS.loginLogoUrl,
    loginBackgroundUrl: settings?.loginBackgroundUrl || SETTINGS_DEFAULTS.loginBackgroundUrl,
    loginTitle: settings?.loginTitle || SETTINGS_DEFAULTS.loginTitle,
    loginSubtitle: settings?.loginSubtitle || SETTINGS_DEFAULTS.loginSubtitle,
    loginDescription: settings?.loginDescription || SETTINGS_DEFAULTS.loginDescription,
    loginFooterText: settings?.loginFooterText || SETTINGS_DEFAULTS.loginFooterText,
    primaryColor: settings?.primaryColor || SETTINGS_DEFAULTS.primaryColor,
    secondaryColor: settings?.secondaryColor || SETTINGS_DEFAULTS.secondaryColor,
    sidebarColor: settings?.sidebarColor || null,
  }
}

// getLoginBranding() and getRootBrandingVariables() intentionally share this
// one resolver: the login page's branding IS the same public branding the
// root layout injects as CSS variables for every page (dashboard, portals,
// and the login screen itself) - one lookup, one fallback chain, per spec's
// "change it once in Settings, the whole app follows" goal.
export const getLoginBranding = resolvePublicBranding

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/
function safeHex(value: string | null | undefined): string | undefined {
  return value && HEX_COLOR.test(value) ? value : undefined
}

// CSS custom properties to inject on <html> in the root layout. Reuses the
// EXISTING --brand-navy/--brand-red tokens (see src/app/globals.css) rather
// than inventing a competing --brand-primary/--brand-secondary namespace -
// --primary, --sidebar, --ring etc. are already defined in globals.css as
// var(--brand-navy)/var(--brand-red), so overriding just these two variables
// here is enough for the whole app (buttons, links, sidebar, focus rings) to
// follow automatically. Returns an empty object when nothing is configured,
// so the static defaults in globals.css simply apply (spec §40 - never crash
// on missing settings).
export async function getRootBrandingVariables(): Promise<Record<string, string>> {
  const branding = await resolvePublicBranding()
  const vars: Record<string, string> = {}

  const primary = safeHex(branding.primaryColor)
  const secondary = safeHex(branding.secondaryColor)
  const sidebar = safeHex(branding.sidebarColor)

  if (primary) vars["--brand-navy"] = primary
  if (secondary) vars["--brand-red"] = secondary
  // Only injected when a school has explicitly picked a rail colour. Left
  // alone, globals.css derives the rail from --brand-navy (a deepened ink
  // mix), so setting just the primary colour still re-themes the rail - but
  // as a deliberate dark surface rather than a flat wash of the brand hue.
  if (sidebar) vars["--sidebar"] = sidebar

  return vars
}
