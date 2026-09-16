"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/db/client"
import { requireSettingsAccess } from "@/lib/settings/settings-access"
import { getDocumentStorage } from "@/lib/storage/document-storage"
import {
  schoolProfileSchema,
  brandingColorsSchema,
  loginBrandingSchema,
  systemSettingsSchema,
  validateBrandingImage,
  BRANDING_IMAGE_KINDS,
  type BrandingImageKind,
  type SchoolProfileInput,
  type BrandingColorsInput,
  type LoginBrandingInput,
  type SystemSettingsInput,
} from "@/lib/validations/school-settings"
import type { ActionResult } from "@/lib/types/action"

// Every settings edit touches identity/branding that the root layout reads
// on every request (see src/app/layout.tsx) - revalidating the whole layout
// tree is what makes a saved change visible immediately everywhere (spec
// §23), not just on the settings page itself.
function revalidateEverything() {
  revalidatePath("/", "layout")
}

function emptyToUndefined<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data }
  for (const key of Object.keys(result) as (keyof T)[]) {
    if (result[key] === "") result[key] = undefined as T[keyof T]
  }
  return result
}

export async function updateSchoolProfile(input: SchoolProfileInput): Promise<ActionResult> {
  const user = await requireSettingsAccess()
  const t = await getTranslations("settings")
  const parsed = schoolProfileSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }
  const data = emptyToUndefined(parsed.data)

  try {
    await prisma.schoolSettings.upsert({
      where: { schoolId: user.schoolId },
      create: {
        schoolId: user.schoolId,
        schoolName: data.schoolName,
        shortName: data.shortName,
        schoolCode: data.schoolCode,
        motto: data.motto,
        description: data.description,
        establishedYear: data.establishedYear ? Number(data.establishedYear) : undefined,
        principalName: data.principalName,
        email: data.email,
        phone: data.phone,
        alternatePhone: data.alternatePhone,
        website: data.website,
        address: data.address,
        city: data.city,
        country: data.country,
        postalCode: data.postalCode,
      },
      update: {
        schoolName: data.schoolName,
        shortName: data.shortName ?? null,
        schoolCode: data.schoolCode ?? null,
        motto: data.motto ?? null,
        description: data.description ?? null,
        establishedYear: data.establishedYear ? Number(data.establishedYear) : null,
        principalName: data.principalName ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        alternatePhone: data.alternatePhone ?? null,
        website: data.website ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
        country: data.country ?? null,
        postalCode: data.postalCode ?? null,
      },
    })
  } catch {
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidateEverything()
  return { success: true }
}

export async function updateBrandingColors(input: BrandingColorsInput): Promise<ActionResult> {
  const user = await requireSettingsAccess()
  const t = await getTranslations("settings")
  const parsed = brandingColorsSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }
  const data = emptyToUndefined(parsed.data)

  try {
    await prisma.schoolSettings.upsert({
      where: { schoolId: user.schoolId },
      create: { schoolId: user.schoolId, ...data },
      update: {
        primaryColor: data.primaryColor ?? null,
        secondaryColor: data.secondaryColor ?? null,
        accentColor: data.accentColor ?? null,
        sidebarColor: data.sidebarColor ?? null,
      },
    })
  } catch {
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidateEverything()
  return { success: true }
}

export async function updateLoginBranding(input: LoginBrandingInput): Promise<ActionResult> {
  const user = await requireSettingsAccess()
  const t = await getTranslations("settings")
  const parsed = loginBrandingSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }
  const data = emptyToUndefined(parsed.data)

  try {
    await prisma.schoolSettings.upsert({
      where: { schoolId: user.schoolId },
      create: { schoolId: user.schoolId, ...data },
      update: {
        loginTitle: data.loginTitle ?? null,
        loginSubtitle: data.loginSubtitle ?? null,
        loginDescription: data.loginDescription ?? null,
        loginFooterText: data.loginFooterText ?? null,
      },
    })
  } catch {
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidateEverything()
  return { success: true }
}

export async function updateSystemSettings(input: SystemSettingsInput): Promise<ActionResult> {
  const user = await requireSettingsAccess()
  const t = await getTranslations("settings")
  const parsed = systemSettingsSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }
  const data = emptyToUndefined(parsed.data)
  const weekStartsOn = data.weekStartsOn !== undefined && data.weekStartsOn !== null ? Number(data.weekStartsOn) : undefined
  const pageSize = data.pageSize !== undefined && data.pageSize !== null ? Number(data.pageSize) : undefined

  try {
    await prisma.schoolSettings.upsert({
      where: { schoolId: user.schoolId },
      create: {
        schoolId: user.schoolId,
        defaultLanguage: data.defaultLanguage,
        timezone: data.timezone,
        currency: data.currency,
        dateFormat: data.dateFormat,
        timeFormat: data.timeFormat,
        weekStartsOn,
        workingDays: data.workingDays ?? [],
        pageSize,
      },
      update: {
        defaultLanguage: data.defaultLanguage ?? null,
        timezone: data.timezone ?? null,
        currency: data.currency ?? null,
        dateFormat: data.dateFormat ?? null,
        timeFormat: data.timeFormat ?? null,
        weekStartsOn: weekStartsOn ?? null,
        workingDays: data.workingDays ?? [],
        pageSize: pageSize ?? null,
      },
    })
  } catch {
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidateEverything()
  return { success: true }
}

const IMAGE_FIELD_BY_KIND: Record<BrandingImageKind, "logoUrl" | "faviconUrl" | "loginLogoUrl" | "loginBackgroundUrl"> = {
  logo: "logoUrl",
  favicon: "faviconUrl",
  loginLogo: "loginLogoUrl",
  loginBackground: "loginBackgroundUrl",
}

export async function uploadBrandingImage(kind: BrandingImageKind, formData: FormData): Promise<ActionResult<{ url: string }>> {
  const user = await requireSettingsAccess()
  const t = await getTranslations("settings")

  if (!BRANDING_IMAGE_KINDS.includes(kind)) return { success: false, error: t("errors.invalidForm") }

  const file = formData.get("file")
  if (!(file instanceof File)) return { success: false, error: t("errors.invalidForm") }

  const validationError = validateBrandingImage(kind, file)
  if (validationError === "unsupportedType") return { success: false, error: t("errors.unsupportedImageType") }
  if (validationError === "tooLarge") return { success: false, error: t("errors.imageTooLarge") }
  if (validationError) return { success: false, error: t("errors.invalidForm") }

  const extension = file.name.split(".").pop() || "png"
  const relativePath = `uploads/settings/${user.schoolId}/${kind}_${Date.now()}.${extension}`

  let url: string
  try {
    const uploaded = await getDocumentStorage().upload(file, relativePath)
    url = uploaded.url
  } catch {
    return { success: false, error: t("errors.saveFailed") }
  }

  const field = IMAGE_FIELD_BY_KIND[kind]
  try {
    await prisma.schoolSettings.upsert({
      where: { schoolId: user.schoolId },
      create: { schoolId: user.schoolId, [field]: url },
      update: { [field]: url },
    })
  } catch {
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidateEverything()
  return { success: true, data: { url } }
}

export async function removeBrandingImage(kind: BrandingImageKind): Promise<ActionResult> {
  const user = await requireSettingsAccess()
  const t = await getTranslations("settings")

  if (!BRANDING_IMAGE_KINDS.includes(kind)) return { success: false, error: t("errors.invalidForm") }
  const field = IMAGE_FIELD_BY_KIND[kind]

  try {
    await prisma.schoolSettings.upsert({
      where: { schoolId: user.schoolId },
      create: { schoolId: user.schoolId, [field]: null },
      update: { [field]: null },
    })
  } catch {
    return { success: false, error: t("errors.saveFailed") }
  }

  revalidateEverything()
  return { success: true }
}
