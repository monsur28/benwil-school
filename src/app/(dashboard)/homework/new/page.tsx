import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { HOMEWORK_ROLES } from "@/lib/homework/homework-access"
import { PageHeader } from "@/components/shared/page-header"
import { HomeworkForm } from "@/components/homework/homework-form"

export default async function NewHomeworkPage() {
  const user = await requireRole(...HOMEWORK_ROLES)
  const t = await getTranslations("homework")

  const [activeAcademicYear, categories] = await Promise.all([
    prisma.academicYear.findFirst({ where: { schoolId: user.schoolId, isActive: true }, select: { id: true, name: true } }),
    prisma.homeworkCategory.findMany({ where: { schoolId: user.schoolId, isActive: true }, orderBy: { name: "asc" } }),
  ])
  const academicYearId = activeAcademicYear?.id ?? ""
  const academicYearName = activeAcademicYear?.name ?? ""

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={t("actions.createHomework")} />

      {user.role === Role.TEACHER ? (
        <TeacherHomeworkForm schoolId={user.schoolId} teacherId={user.userId} categories={categories} academicYearId={academicYearId} academicYearName={academicYearName} />
      ) : (
        <AdminHomeworkForm schoolId={user.schoolId} categories={categories} academicYearId={academicYearId} academicYearName={academicYearName} />
      )}
    </div>
  )
}

async function TeacherHomeworkForm({
  schoolId,
  teacherId,
  categories,
  academicYearId,
  academicYearName,
}: {
  schoolId: string
  teacherId: string
  categories: { id: string; name: string }[]
  academicYearId: string
  academicYearName: string
}) {
  const assignmentRows = await prisma.teacherAssignment.findMany({
    where: { schoolId, teacherId },
    include: { class: true, section: true, subject: true },
  })
  const assignments = assignmentRows.map((row) => ({
    classId: row.classId,
    className: row.class.name,
    sectionId: row.sectionId,
    sectionName: row.section.name,
    subjectId: row.subjectId,
    subjectName: row.subject.name,
  }))

  return (
    <HomeworkForm
      mode="teacher"
      assignments={assignments}
      categories={categories}
      academicYearId={academicYearId}
      academicYearName={academicYearName}
    />
  )
}

async function AdminHomeworkForm({
  schoolId,
  categories,
  academicYearId,
  academicYearName,
}: {
  schoolId: string
  categories: { id: string; name: string }[]
  academicYearId: string
  academicYearName: string
}) {
  const [classes, sections, subjects, teachers] = await Promise.all([
    prisma.class.findMany({ where: { schoolId }, orderBy: { order: "asc" } }),
    prisma.section.findMany({ where: { class: { schoolId } }, orderBy: { name: "asc" } }),
    prisma.subject.findMany({ where: { schoolId }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { schoolId, role: Role.TEACHER, isActive: true }, orderBy: { name: "asc" } }),
  ])

  return (
    <HomeworkForm
      mode="admin"
      classes={classes}
      sections={sections}
      subjects={subjects}
      teachers={teachers}
      categories={categories}
      academicYearId={academicYearId}
      academicYearName={academicYearName}
    />
  )
}
