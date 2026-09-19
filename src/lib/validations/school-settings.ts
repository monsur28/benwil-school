import { z } from "zod"

const errors = {
  nameRequired: "errors.nameRequired",
  invalidEmail: "errors.invalidEmail",
  invalidUrl: "errors.invalidUrl",
  invalidColor: "errors.invalidColor",
  invalidYear: "errors.invalidYear",
  invalidTimezone: "errors.invalidTimezone",
  invalidCurrency: "errors.invalidCurrency",
  invalidLanguage: "errors.invalidLanguage",
  invalidDateFormat: "errors.invalidDateFormat",
  invalidTimeFormat: "errors.invalidTimeFormat",
  invalidWeekStart: "errors.invalidWeekStart",
  invalidWorkingDay: "errors.invalidWorkingDay",
  invalidPageSize: "errors.invalidPageSize",
}

const optionalText = (max = 255) => z.string().trim().max(max).optional().or(z.literal(""))
const optionalEmail = z.union([z.email({ error: errors.invalidEmail }), z.literal("")]).optional()
const optionalUrl = z.union([z.string().trim().url({ error: errors.invalidUrl }), z.literal("")]).optional()

// Number inputs arrive from HTML forms as strings - validating/refining as a
// string (rather than z.coerce.number(), whose *input* type is `unknown` and
// breaks react-hook-form's resolver typing when unioned with z.literal(""))
// keeps the form's TypeScript types clean; the server action does the final
// Number(...) conversion right before writing to the database.
function optionalIntString(min: number, max: number, errorKey: string) {
  return z
    .string()
    .trim()
    .refine((value) => value === "" || (/^-?\d+$/.test(value) && Number(value) >= min && Number(value) <= max), {
      error: errorKey,
    })
    .optional()
}

// Standardized on 6-digit hex per src/lib/validations/school-settings.ts spec
// (never arbitrary CSS - rgb()/hsl()/named colors are rejected) so every
// saved value can be dropped straight into a CSS custom property.
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/
const optionalHexColor = z.union([z.string().trim().regex(HEX_COLOR, { error: errors.invalidColor }), z.literal("")]).optional()

function isValidTimezone(value: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value })
    return true
  } catch {
    return false
  }
}

export const CURRENCY_CODES = ["BDT", "USD", "EUR", "GBP", "INR"] as const
export const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as const
export const TIME_FORMATS = ["12h", "24h"] as const
export const LANGUAGE_CODES = ["en", "bn"] as const

export const schoolProfileSchema = z.object({
  schoolName: z.string().trim().min(1, { error: errors.nameRequired }).max(255),
  schoolNameBangla: optionalText(255),
  shortName: optionalText(100),
  schoolCode: optionalText(50),
  motto: optionalText(255),
  description: optionalText(2000),
  establishedYear: optionalIntString(1800, new Date().getFullYear(), errors.invalidYear),
  principalName: optionalText(255),
  email: optionalEmail,
  phone: optionalText(30),
  alternatePhone: optionalText(30),
  website: optionalUrl,
  address: optionalText(500),
  city: optionalText(100),
  country: optionalText(100),
  postalCode: optionalText(20),
})
export type SchoolProfileInput = z.infer<typeof schoolProfileSchema>

export const brandingColorsSchema = z.object({
  primaryColor: optionalHexColor,
  secondaryColor: optionalHexColor,
  accentColor: optionalHexColor,
  sidebarColor: optionalHexColor,
})
export type BrandingColorsInput = z.infer<typeof brandingColorsSchema>

export const loginBrandingSchema = z.object({
  loginTitle: optionalText(100),
  loginSubtitle: optionalText(200),
  loginDescription: optionalText(500),
  loginFooterText: optionalText(255),
})
export type LoginBrandingInput = z.infer<typeof loginBrandingSchema>

export const systemSettingsSchema = z.object({
  defaultLanguage: z.union([z.enum(LANGUAGE_CODES, { error: errors.invalidLanguage }), z.literal("")]).optional(),
  timezone: z.union([
    z.string().trim().refine(isValidTimezone, { error: errors.invalidTimezone }),
    z.literal(""),
  ]).optional(),
  currency: z.union([z.enum(CURRENCY_CODES, { error: errors.invalidCurrency }), z.literal("")]).optional(),
  dateFormat: z.union([z.enum(DATE_FORMATS, { error: errors.invalidDateFormat }), z.literal("")]).optional(),
  timeFormat: z.union([z.enum(TIME_FORMATS, { error: errors.invalidTimeFormat }), z.literal("")]).optional(),
  weekStartsOn: optionalIntString(0, 6, errors.invalidWeekStart),
  workingDays: z.array(z.number().int().min(0, { error: errors.invalidWorkingDay }).max(6, { error: errors.invalidWorkingDay })).optional(),
  pageSize: optionalIntString(5, 200, errors.invalidPageSize),
})
export type SystemSettingsInput = z.infer<typeof systemSettingsSchema>

export const BRANDING_IMAGE_KINDS = ["logo", "favicon", "loginLogo", "loginBackground"] as const
export type BrandingImageKind = (typeof BRANDING_IMAGE_KINDS)[number]

export const BRANDING_IMAGE_LIMITS: Record<BrandingImageKind, { maxBytes: number; mimeTypes: string[] }> = {
  logo: { maxBytes: 2 * 1024 * 1024, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  favicon: { maxBytes: 512 * 1024, mimeTypes: ["image/png", "image/x-icon", "image/vnd.microsoft.icon"] },
  loginLogo: { maxBytes: 2 * 1024 * 1024, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  loginBackground: { maxBytes: 5 * 1024 * 1024, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
}

export function validateBrandingImage(kind: BrandingImageKind, file: { type: string; size: number }): string | null {
  const limits = BRANDING_IMAGE_LIMITS[kind]
  if (!file.type || !Number.isFinite(file.size) || file.size <= 0) return "invalid"
  if (!limits.mimeTypes.includes(file.type)) return "unsupportedType"
  if (file.size > limits.maxBytes) return "tooLarge"
  return null
}
