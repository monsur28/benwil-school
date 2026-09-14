import { getLocale, getTranslations } from "next-intl/server"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { prisma } from "@/lib/db/client"
import { InfoRow } from "@/components/students/info-row"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default async function StudentProfilePage() {
  const { student } = await requireStudentIdentity()
  const [t, locale] = await Promise.all([getTranslations("students"), getLocale()])

  const guardians = await prisma.studentGuardian.findMany({
    where: { studentId: student.id },
    include: { guardian: true },
  })

  const dateFormatter = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.basicInformation")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <InfoRow label={t("fields.name")} value={student.name} />
          <InfoRow label={t("profile.studentIdLabel")} value={student.studentUid} />
          <InfoRow label={t("profile.admissionNoLabel")} value={student.admissionNumber} />
          <InfoRow label={t("fields.class")} value={student.class.name} />
          <InfoRow label={t("fields.section")} value={student.section.name} />
          <InfoRow label={t("fields.roll")} value={student.roll} />
          <InfoRow label={t("fields.academicYear")} value={student.academicYear.name} />
          <InfoRow label={t("fields.gender")} value={t(`gender.${student.gender}`)} />
          <InfoRow label={t("fields.dateOfBirth")} value={dateFormatter.format(student.dateOfBirth)} />
          <InfoRow
            label={t("fields.bloodGroup")}
            value={student.bloodGroup ? t(`bloodGroup.${student.bloodGroup}`) : undefined}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.guardianInformation")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {guardians.length === 0 && (
            <p className="py-1.5 text-sm text-muted-foreground">{t("profile.noGuardians")}</p>
          )}
          {guardians.map((link) => (
            <div key={link.id} className="space-y-0.5 py-1.5 text-sm">
              <p className="font-medium text-foreground">
                {link.guardian.name} <span className="text-muted-foreground">({t(`relation.${link.relation}`)})</span>
              </p>
              {link.guardian.phone && <p className="text-muted-foreground">{link.guardian.phone}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
