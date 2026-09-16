import { notFound } from "next/navigation"
import { Role } from "@prisma/client"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { PageHeader } from "@/components/shared/page-header"
import { TeacherForm } from "@/components/teachers/teacher-form"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ teacherId: string }>
}) {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("teachers")
  const { teacherId } = await params

  const teacher = await prisma.user.findFirst({
    where: { id: teacherId, schoolId: user.schoolId, role: Role.TEACHER },
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      employeeId: true,
      designation: true,
      department: true,
      joiningDate: true,
      employmentType: true,
      qualifications: true,
      specialization: true,
    },
  })
  if (!teacher) notFound()

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader title={t("actions.editTeacher")} />
      <TeacherForm teacher={teacher} />
    </div>
  )
}
