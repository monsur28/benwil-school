import { notFound } from "next/navigation"
import { Role } from "@prisma/client"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { PageHeader } from "@/components/shared/page-header"
import { StudentForm, type StudentFormValues } from "@/components/students/student-form"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const user = await requireRole(...CAN_MANAGE)
  const t = await getTranslations("students")
  const { studentId } = await params

  const [student, academicYears, classes, sections] = await Promise.all([
    prisma.student.findFirst({
      where: { id: studentId, schoolId: user.schoolId },
      include: { guardians: { include: { guardian: true } } },
    }),
    prisma.academicYear.findMany({ where: { schoolId: user.schoolId }, orderBy: { name: "desc" } }),
    prisma.class.findMany({ where: { schoolId: user.schoolId }, orderBy: { order: "asc" } }),
    prisma.section.findMany({
      where: { class: { schoolId: user.schoolId } },
      orderBy: { name: "asc" },
    }),
  ])

  if (!student) {
    notFound()
  }

  const primaryIndex = Math.max(
    student.guardians.findIndex((link) => link.isPrimary),
    0
  )

  const defaultValues: Partial<StudentFormValues> = {
    name: student.name,
    nameBn: student.nameBn ?? "",
    dateOfBirth: toDateInputValue(student.dateOfBirth),
    admissionDate: toDateInputValue(student.admissionDate),
    gender: student.gender,
    bloodGroup: student.bloodGroup ?? "",
    religion: student.religion ?? "",
    nationality: student.nationality ?? "",
    birthCertificateNumber: student.birthCertificateNumber ?? "",
    admissionNumber: student.admissionNumber,
    status: student.status,
    academicYearId: student.academicYearId,
    classId: student.classId,
    sectionId: student.sectionId,
    roll: student.roll,
    guardians: student.guardians.map((link) => ({
      name: link.guardian.name,
      nameBn: link.guardian.nameBn ?? "",
      phone: link.guardian.phone,
      email: link.guardian.email ?? "",
      occupation: link.guardian.occupation ?? "",
      address: link.guardian.address ?? "",
      relation: link.relation,
      isPrimary: link.isPrimary,
    })),
    documents: [],
    primaryGuardianIndex: String(primaryIndex),
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("edit.title")} />
      <StudentForm
        mode="edit"
        studentId={student.id}
        academicOptions={{ academicYears, classes, sections }}
        defaultValues={defaultValues}
      />
    </div>
  )
}
