import "server-only"
import { cache } from "react"
import { getLocale } from "next-intl/server"
import { prisma } from "@/lib/db/client"
import { pickLocalized } from "@/lib/format"
import { SETTINGS_DEFAULTS } from "./defaults"

// getLocale() needs next-intl's request-scoped config, which only exists
// inside an actual Next.js request - the DB-backed unit tests for this file
// call getSchoolIdentity() directly under plain node:test, with no such
// request/context. Falling back to "en" there (rather than throwing) keeps
// this function safe to call from anywhere, exactly like every other
// fallback in this module - production callers always run inside a real
// request and get the real locale.
async function currentLocale(): Promise<string> {
  try {
    return await getLocale()
  } catch {
    return "en"
  }
}

// Memoized per request (React cache()) - the sidebar, header, dashboard, and
// any portal layout can all call this in the same request tree and it only
// hits the database once (spec §41: no "one settings query per component").
export const getSchoolWithSettings = cache(async (schoolId: string) => {
  return prisma.school.findUnique({
    where: { id: schoolId },
    include: { settings: true },
  })
})

// This app is single-school-per-deployment in practice (every existing
// fixture/query resolves "the school" via school.findFirst()) - used only
// for genuinely unauthenticated contexts (the login page) where there is no
// session to read a schoolId from. Authenticated code must always use
// user.schoolId, never this.
export const getPrimarySchoolId = cache(async (): Promise<string | null> => {
  const school = await prisma.school.findFirst({ select: { id: true } })
  return school?.id ?? null
})

export type SchoolIdentity = {
  schoolName: string
  schoolNameBangla: string | null
  shortName: string | null
  schoolCode: string | null
  motto: string | null
  description: string | null
  establishedYear: number | null
  principalName: string | null
  email: string | null
  phone: string | null
  alternatePhone: string | null
  website: string | null
  address: string | null
  city: string | null
  country: string | null
  postalCode: string | null
  logoUrl: string | null
  faviconUrl: string | null
}

// Fallback hierarchy (spec §15): SchoolSettings -> School.name -> app default.
// schoolName itself is locale-aware (spec §37 of the branding phase) - every
// caller (sidebar, dashboard, login, portals, report cards) gets whichever
// name matches the current locale automatically, without knowing about
// schoolNameBangla at all.
export async function getSchoolIdentity(schoolId: string): Promise<SchoolIdentity> {
  const [school, locale] = await Promise.all([getSchoolWithSettings(schoolId), currentLocale()])
  const settings = school?.settings ?? null
  const englishName = settings?.schoolName || school?.name || SETTINGS_DEFAULTS.schoolName

  return {
    schoolName: pickLocalized(englishName, settings?.schoolNameBangla, locale),
    schoolNameBangla: settings?.schoolNameBangla ?? null,
    shortName: settings?.shortName ?? null,
    schoolCode: settings?.schoolCode ?? null,
    motto: settings?.motto ?? null,
    description: settings?.description ?? null,
    establishedYear: settings?.establishedYear ?? null,
    principalName: settings?.principalName ?? null,
    email: settings?.email ?? null,
    phone: settings?.phone ?? null,
    alternatePhone: settings?.alternatePhone ?? null,
    website: settings?.website ?? null,
    address: settings?.address ?? null,
    city: settings?.city ?? null,
    country: settings?.country ?? null,
    postalCode: settings?.postalCode ?? null,
    logoUrl: settings?.logoUrl || SETTINGS_DEFAULTS.logoUrl,
    faviconUrl: settings?.faviconUrl || SETTINGS_DEFAULTS.faviconUrl,
  }
}

export type SystemSettings = {
  defaultLanguage: string
  timezone: string
  currency: string
  dateFormat: string
  timeFormat: string
  weekStartsOn: number
  workingDays: number[]
  pageSize: number
}

export async function getSystemSettings(schoolId: string): Promise<SystemSettings> {
  const school = await getSchoolWithSettings(schoolId)
  const settings = school?.settings ?? null

  return {
    defaultLanguage: settings?.defaultLanguage || SETTINGS_DEFAULTS.defaultLanguage,
    timezone: settings?.timezone || SETTINGS_DEFAULTS.timezone,
    currency: settings?.currency || SETTINGS_DEFAULTS.currency,
    dateFormat: settings?.dateFormat || SETTINGS_DEFAULTS.dateFormat,
    timeFormat: settings?.timeFormat || SETTINGS_DEFAULTS.timeFormat,
    weekStartsOn: settings?.weekStartsOn ?? SETTINGS_DEFAULTS.weekStartsOn,
    workingDays: settings?.workingDays?.length ? settings.workingDays : [],
    pageSize: settings?.pageSize ?? SETTINGS_DEFAULTS.pageSize,
  }
}

// Raw row, for the settings edit forms only (they need to distinguish "never
// set" from "set to the default value" so inputs start blank rather than
// pre-filled with a default the admin never actually chose).
export async function getRawSchoolSettings(schoolId: string) {
  const school = await getSchoolWithSettings(schoolId)
  return school?.settings ?? null
}
