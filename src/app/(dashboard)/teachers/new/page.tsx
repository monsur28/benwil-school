import { Role } from "@prisma/client"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { PageHeader } from "@/components/shared/page-header"
import { TeacherForm } from "@/components/teachers/teacher-form"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export default async function NewTeacherPage() {
  await requireRole(...CAN_MANAGE)
  const t = await getTranslations("teachers")

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12">
      <PageHeader
        title={t("actions.addTeacher")}
        description={t("new.subtitle")}
        backHref="/teachers"
        backLabel={t("title")}
      />
      <TeacherForm />
    </div>
  )
}
