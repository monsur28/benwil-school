import { getTranslations } from "next-intl/server"
import { requireSettingsAccess } from "@/lib/settings/settings-access"
import { getRawSchoolSettings } from "@/lib/settings/school-settings"
import type { SystemSettingsInput } from "@/lib/validations/school-settings"
import { PageHeader } from "@/components/shared/page-header"
import { SettingsSubNav } from "@/components/settings/settings-subnav"
import { SystemSettingsForm } from "@/components/settings/system-settings-form"
import { Card, CardContent } from "@/components/ui/card"

export default async function SystemSettingsPage() {
  const user = await requireSettingsAccess()
  const t = await getTranslations("settings")
  const settings = await getRawSchoolSettings(user.schoolId)

  // Values already passed schoolSettingsSchema validation when they were
  // saved, so re-asserting the literal-union types here (rather than
  // re-validating) is safe - a bad value would just fall through to each
  // select's own "use application default" option.
  const formValues: SystemSettingsInput = {
    defaultLanguage: (settings?.defaultLanguage ?? "") as SystemSettingsInput["defaultLanguage"],
    timezone: settings?.timezone ?? "",
    currency: (settings?.currency ?? "") as SystemSettingsInput["currency"],
    dateFormat: (settings?.dateFormat ?? "") as SystemSettingsInput["dateFormat"],
    timeFormat: (settings?.timeFormat ?? "") as SystemSettingsInput["timeFormat"],
    weekStartsOn: settings?.weekStartsOn !== null && settings?.weekStartsOn !== undefined ? String(settings.weekStartsOn) : "",
    workingDays: settings?.workingDays ?? [],
    pageSize: settings?.pageSize !== null && settings?.pageSize !== undefined ? String(settings.pageSize) : "",
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("system.title")} description={t("system.description")} />
      <SettingsSubNav />
      <Card>
        <CardContent className="pt-6">
          <SystemSettingsForm settings={formValues} />
        </CardContent>
      </Card>
    </div>
  )
}
