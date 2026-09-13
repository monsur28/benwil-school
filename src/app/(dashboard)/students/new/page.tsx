import { Role } from "@prisma/client"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { PageHeader } from "@/components/shared/page-header"
import { StudentForm } from "@/components/students/student-form"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export default async function NewStudentPage() {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("students")

  // Only active classes/sections: admitting a new student into a retired
  // class/section wouldn't make sense going forward. Editing an existing
  // student keeps showing all of them so a current (possibly since
  // deactivated) assignment never disappears from the form.
  const [academicYears, classes, sections] = await Promise.all([
    prisma.academicYear.findMany({ where: { schoolId: user.schoolId }, orderBy: { name: "desc" } }),
    prisma.class.findMany({
      where: { schoolId: user.schoolId, isActive: true },
      orderBy: { order: "asc" },
    }),
    prisma.section.findMany({
      where: { class: { schoolId: user.schoolId }, isActive: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title={t("new.title")} />
      <StudentForm mode="create" academicOptions={{ academicYears, classes, sections }} />
    </div>
  )
}
