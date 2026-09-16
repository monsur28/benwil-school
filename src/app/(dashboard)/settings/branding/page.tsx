import { getTranslations } from "next-intl/server"
import { requireSettingsAccess } from "@/lib/settings/settings-access"
import { getRawSchoolSettings, getSchoolIdentity } from "@/lib/settings/school-settings"
import { PageHeader } from "@/components/shared/page-header"
import { SettingsSubNav } from "@/components/settings/settings-subnav"
import { BrandingForm } from "@/components/settings/branding-form"
import { LoginBrandingForm } from "@/components/settings/login-branding-form"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default async function BrandingSettingsPage() {
  const user = await requireSettingsAccess()
  const t = await getTranslations("settings")

  const [settings, identity] = await Promise.all([
    getRawSchoolSettings(user.schoolId),
    getSchoolIdentity(user.schoolId),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title={t("branding.title")} description={t("branding.description")} />
      <SettingsSubNav />

      <Card>
        <CardHeader>
          <CardTitle>{t("branding.title")}</CardTitle>
          <CardDescription>{t("branding.sectionDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <BrandingForm
            schoolName={identity.schoolName}
            initialColors={{
              primaryColor: settings?.primaryColor ?? "",
              secondaryColor: settings?.secondaryColor ?? "",
              accentColor: settings?.accentColor ?? "",
              sidebarColor: settings?.sidebarColor ?? "",
            }}
            initialLogoUrl={identity.logoUrl}
            initialFaviconUrl={identity.faviconUrl}
          />
        </CardContent>
      </Card>

      <Card id="login">
        <CardHeader>
          <CardTitle>{t("loginExperience.title")}</CardTitle>
          <CardDescription>{t("loginExperience.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginBrandingForm
            settings={{
              loginTitle: settings?.loginTitle ?? "",
              loginSubtitle: settings?.loginSubtitle ?? "",
              loginDescription: settings?.loginDescription ?? "",
              loginFooterText: settings?.loginFooterText ?? "",
            }}
            initialLoginLogoUrl={settings?.loginLogoUrl ?? null}
            initialLoginBackgroundUrl={settings?.loginBackgroundUrl ?? null}
          />
        </CardContent>
      </Card>
    </div>
  )
}
