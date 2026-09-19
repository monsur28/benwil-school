"use client"

import { useTranslations } from "next-intl"
import { SETTINGS_DEFAULTS } from "@/lib/settings/defaults"

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

export function BrandingPreview({
  schoolName,
  primaryColor,
  secondaryColor,
  sidebarColor,
}: {
  schoolName: string
  primaryColor: string
  secondaryColor: string
  sidebarColor: string
}) {
  const t = useTranslations("settings")
  const safePrimary = HEX_COLOR.test(primaryColor) ? primaryColor : SETTINGS_DEFAULTS.primaryColor
  const safeSecondary = HEX_COLOR.test(secondaryColor) ? secondaryColor : SETTINGS_DEFAULTS.secondaryColor
  const safeSidebar = HEX_COLOR.test(sidebarColor) ? sidebarColor : safePrimary

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{t("branding.preview")}</p>
      <div className="overflow-hidden rounded-xl border border-border shadow-sm">
        <div className="flex h-9 items-center gap-2 px-3" style={{ backgroundColor: safeSidebar }}>
          <div className="size-4 rounded-full bg-white/90" />
          <span className="truncate text-xs font-semibold text-white">{schoolName}</span>
        </div>
        <div className="flex gap-2 bg-muted/40 p-3">
          <div className="hidden w-16 shrink-0 rounded-lg sm:block" style={{ backgroundColor: safeSidebar }} />
          <div className="flex-1 space-y-2 rounded-lg bg-background p-3">
            <div className="h-2 w-1/2 rounded-full bg-muted" />
            <div className="h-2 w-3/4 rounded-full bg-muted" />
            <div className="flex gap-2 pt-1">
              <span
                className="rounded-md px-2.5 py-1 text-[11px] font-medium text-white"
                style={{ backgroundColor: safePrimary }}
              >
                {t("branding.previewPrimaryButton")}
              </span>
              <span
                className="rounded-md px-2.5 py-1 text-[11px] font-medium text-white"
                style={{ backgroundColor: safeSecondary }}
              >
                {t("branding.previewSecondaryButton")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
