"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { brandingColorsSchema, type BrandingColorsInput } from "@/lib/validations/school-settings"
import { updateBrandingColors } from "@/actions/settings/school-settings"
import { SETTINGS_DEFAULTS } from "@/lib/settings/defaults"
import { ColorInput } from "@/components/settings/color-input"
import { BrandingImageUploader } from "@/components/settings/branding-image-uploader"
import { BrandingPreview } from "@/components/settings/branding-preview"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"

export function BrandingForm({
  schoolName,
  initialColors,
  initialLogoUrl,
  initialFaviconUrl,
}: {
  schoolName: string
  initialColors: BrandingColorsInput
  initialLogoUrl: string | null
  initialFaviconUrl: string | null
}) {
  const t = useTranslations("settings")
  const [isPending, startTransition] = useTransition()
  const [colors, setColors] = useState<BrandingColorsInput>(initialColors)
  const [errors, setErrors] = useState<Partial<Record<keyof BrandingColorsInput, string>>>({})
  const [rootError, setRootError] = useState<string | null>(null)

  function setColor(key: keyof BrandingColorsInput, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }))
  }

  function submit() {
    setRootError(null)
    const parsed = brandingColorsSchema.safeParse(colors)
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof BrandingColorsInput, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof BrandingColorsInput
        fieldErrors[key] = t(issue.message as never)
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    startTransition(async () => {
      const result = await updateBrandingColors(parsed.data)
      if (!result.success) {
        setRootError(result.error)
        return
      }
      toast.add({ title: t("success.saved"), type: "success" })
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BrandingImageUploader
          kind="logo"
          label={t("branding.logo")}
          recommendedText={t("branding.logoRecommended")}
          accept="image/jpeg,image/png,image/webp"
          initialUrl={initialLogoUrl}
        />
        <BrandingImageUploader
          kind="favicon"
          label={t("branding.favicon")}
          recommendedText={t("branding.faviconRecommended")}
          accept="image/png,image/x-icon"
          initialUrl={initialFaviconUrl}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <ColorInput
            id="branding-primary-color"
            label={t("branding.primaryColor")}
            value={colors.primaryColor ?? ""}
            onChange={(value) => setColor("primaryColor", value)}
            error={errors.primaryColor}
          />
          <ColorInput
            id="branding-secondary-color"
            label={t("branding.secondaryColor")}
            value={colors.secondaryColor ?? ""}
            onChange={(value) => setColor("secondaryColor", value)}
            error={errors.secondaryColor}
          />
          <ColorInput
            id="branding-sidebar-color"
            label={t("branding.sidebarColor")}
            value={colors.sidebarColor ?? ""}
            onChange={(value) => setColor("sidebarColor", value)}
            error={errors.sidebarColor}
          />
          <ColorInput
            id="branding-accent-color"
            label={t("branding.accentColor")}
            value={colors.accentColor ?? ""}
            onChange={(value) => setColor("accentColor", value)}
            error={errors.accentColor}
          />
        </div>

        <BrandingPreview
          schoolName={schoolName}
          primaryColor={colors.primaryColor || SETTINGS_DEFAULTS.primaryColor}
          secondaryColor={colors.secondaryColor || SETTINGS_DEFAULTS.secondaryColor}
          sidebarColor={colors.sidebarColor || colors.primaryColor || SETTINGS_DEFAULTS.primaryColor}
        />
      </div>

      {rootError && <p className="text-sm text-destructive">{rootError}</p>}

      <Button type="button" onClick={submit} disabled={isPending}>
        {isPending ? t("actions.saving") : t("actions.saveChanges")}
      </Button>
    </div>
  )
}
