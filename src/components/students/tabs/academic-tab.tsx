import { getTranslations } from "next-intl/server"
import type { StudentWithRelations } from "@/lib/students/types"
import { InfoRow } from "@/components/students/info-row"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export async function AcademicTab({ student }: { student: StudentWithRelations }) {
  const t = await getTranslations("students")

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>{t("profile.academic")}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        <InfoRow label={t("fields.academicYear")} value={student.academicYear.name} />
        <InfoRow label={t("fields.class")} value={student.class.name} />
        <InfoRow label={t("fields.section")} value={student.section.name} />
        <InfoRow label={t("fields.roll")} value={student.roll} />
        <InfoRow label={t("fields.status")} value={t(`status.${student.status}`)} />
      </CardContent>
    </Card>
  )
}
