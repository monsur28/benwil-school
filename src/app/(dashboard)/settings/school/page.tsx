import { getTranslations } from "next-intl/server"
import { requireSettingsAccess } from "@/lib/settings/settings-access"
import { getRawSchoolSettings } from "@/lib/settings/school-settings"
import { prisma } from "@/lib/db/client"
import { PageHeader } from "@/components/shared/page-header"
import { SettingsSubNav } from "@/components/settings/settings-subnav"
import { SchoolProfileForm } from "@/components/settings/school-profile-form"
import { Card, CardContent } from "@/components/ui/card"

export default async function SchoolProfileSettingsPage() {
  const user = await requireSettingsAccess()
  const t = await getTranslations("settings")

  const [settings, school] = await Promise.all([
    getRawSchoolSettings(user.schoolId),
    prisma.school.findUniqueOrThrow({ where: { id: user.schoolId }, select: { name: true } }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title={t("school.title")} description={t("school.description")} />
      <SettingsSubNav />
      <Card>
        <CardContent className="pt-6">
          <SchoolProfileForm
            settings={{
              schoolName: settings?.schoolName ?? school.name,
              schoolNameBangla: settings?.schoolNameBangla ?? "",
              shortName: settings?.shortName ?? "",
              schoolCode: settings?.schoolCode ?? "",
              motto: settings?.motto ?? "",
              description: settings?.description ?? "",
              establishedYear: settings?.establishedYear ? String(settings.establishedYear) : "",
              principalName: settings?.principalName ?? "",
              email: settings?.email ?? "",
              phone: settings?.phone ?? "",
              alternatePhone: settings?.alternatePhone ?? "",
              website: settings?.website ?? "",
              address: settings?.address ?? "",
              city: settings?.city ?? "",
              country: settings?.country ?? "",
              postalCode: settings?.postalCode ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
