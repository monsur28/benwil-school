import { getLocale, getTranslations } from "next-intl/server"
import type { StudentWithRelations } from "@/lib/students/types"
import { InfoRow } from "@/components/students/info-row"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(
    date
  )
}

export async function OverviewTab({ student }: { student: StudentWithRelations }) {
  const [t, currentLocale] = await Promise.all([getTranslations("students"), getLocale()])

  const primaryGuardian = student.guardians.find((g) => g.isPrimary)?.guardian

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.basicInformation")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <InfoRow label={t("fields.name")} value={student.name} />
          <InfoRow label={t("fields.nameBn")} value={student.nameBn} />
          <InfoRow label={t("fields.dateOfBirth")} value={formatDate(student.dateOfBirth, currentLocale)} />
          <InfoRow label={t("fields.gender")} value={t(`gender.${student.gender}`)} />
          <InfoRow
            label={t("fields.bloodGroup")}
            value={student.bloodGroup ? t(`bloodGroup.${student.bloodGroup}`) : undefined}
          />
          <InfoRow label={t("fields.religion")} value={student.religion} />
          <InfoRow label={t("fields.nationality")} value={student.nationality} />
          <InfoRow
            label={t("fields.birthCertificateNumber")}
            value={student.birthCertificateNumber}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.guardianInformation")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {student.guardians.length === 0 && (
            <p className="py-1.5 text-sm text-muted-foreground">{t("profile.noGuardians")}</p>
          )}
          {student.guardians.map((link) => (
            <div key={link.id} className="flex items-center justify-between gap-4 py-1.5 text-sm">
              <div>
                <p className="font-medium text-foreground">{link.guardian.name}</p>
                <p className="text-muted-foreground">{t(`relation.${link.relation}`)}</p>
              </div>
              {link.isPrimary && <Badge variant="secondary">{t("profile.primaryGuardian")}</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.contactInformation")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <InfoRow label={t("fields.phone")} value={primaryGuardian?.phone} />
          <InfoRow label={t("fields.email")} value={primaryGuardian?.email} />
          <InfoRow label={t("fields.address")} value={primaryGuardian?.address} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.admissionInformation")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <InfoRow label={t("profile.studentIdLabel")} value={student.studentUid} />
          <InfoRow label={t("profile.admissionNoLabel")} value={student.admissionNumber} />
          <InfoRow
            label={t("fields.admissionDate")}
            value={formatDate(student.admissionDate, currentLocale)}
          />
          <InfoRow label={t("fields.status")} value={t(`status.${student.status}`)} />
        </CardContent>
      </Card>
    </div>
  )
}
