import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getHomeworkById } from "@/lib/homework/get-homework"
import { HOMEWORK_ROLES, checkHomeworkOwnership, checkHomeworkWriteAccess } from "@/lib/homework/homework-access"
import { PageHeader } from "@/components/shared/page-header"
import { HomeworkForm } from "@/components/homework/homework-form"

export default async function EditHomeworkPage({
  params,
}: {
  params: Promise<{ homeworkId: string }>
}) {
  const user = await requireRole(...HOMEWORK_ROLES)
  const t = await getTranslations("homework")
  const { homeworkId } = await params

  const homework = await getHomeworkById({ schoolId: user.schoolId, homeworkId })
  if (!homework) notFound()

  const ownership = checkHomeworkOwnership(user, homework.teacherId)
  if (!ownership.ok) notFound()
  const writeAccess = await checkHomeworkWriteAccess(user, homework.academicYearId, homework.classId, homework.sectionId, homework.subjectId)
  if (!writeAccess.ok) notFound()

  const categories = await prisma.homeworkCategory.findMany({
    where: { schoolId: user.schoolId, isActive: true },
    orderBy: { name: "asc" },
  })
  const homeworkFormValue = {
    id: homework.id,
    title: homework.title,
    instructions: homework.instructions,
    categoryId: homework.categoryId,
    academicYearId: homework.academicYearId,
    classId: homework.classId,
    sectionId: homework.sectionId,
    subjectId: homework.subjectId,
    assignedDate: homework.assignedDate,
    dueDate: homework.dueDate,
    maxMarks: homework.maxMarks,
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={t("actions.editHomework")} />

      {user.role === Role.TEACHER ? (
        <TeacherEditForm
          schoolId={user.schoolId}
          teacherId={user.userId}
          categories={categories}
          homework={homeworkFormValue}
        />
      ) : (
        <AdminEditForm schoolId={user.schoolId} categories={categories} homework={homeworkFormValue} />
      )}
    </div>
  )
}

type HomeworkFormValue = {
  id: string
  title: string
  instructions: string
  categoryId: string | null
  academicYearId: string
  classId: string
  sectionId: string
  subjectId: string
  assignedDate: Date
  dueDate: Date
  maxMarks: number | null
}

async function TeacherEditForm({
  schoolId,
  teacherId,
  categories,
  homework,
}: {
  schoolId: string
  teacherId: string
  categories: { id: string; name: string }[]
  homework: HomeworkFormValue
}) {
  // This homework belongs to a fixed academic year (homework.academicYearId,
  // possibly a past one) - the options offered here must reflect what the
  // teacher was actually assigned to THAT year, not their current-year
  // assignments, or editing an old homework could silently move it onto a
  // class/section/subject the teacher never had in that year.
  const [assignmentRows, academicYear] = await Promise.all([
    prisma.teacherAssignment.findMany({
      where: { schoolId, teacherId, OR: [{ academicYearId: homework.academicYearId }, { academicYearId: null }] },
      include: { class: true, section: true, subject: true },
    }),
    prisma.academicYear.findFirst({ where: { id: homework.academicYearId }, select: { name: true } }),
  ])

  const assignments = assignmentRows.map((row) => ({
    classId: row.classId,
    className: row.class.name,
    sectionId: row.sectionId,
    sectionName: row.section.name,
    subjectId: row.subjectId,
    subjectName: row.subject.name,
  }))

  // If the current homework's class/section/subject is no longer among the
  // teacher's live assignments (e.g. reassigned since this draft was
  // written), merge it in with its real names so the form never strands the
  // user on an unselectable value - the server re-validates the final
  // combination on save regardless (see src/actions/homework/homework.ts).
  const hasCurrentTriple = assignments.some(
    (a) => a.classId === homework.classId && a.sectionId === homework.sectionId && a.subjectId === homework.subjectId
  )
  if (!hasCurrentTriple) {
    const [classRecord, sectionRecord, subjectRecord] = await Promise.all([
      prisma.class.findUnique({ where: { id: homework.classId }, select: { name: true } }),
      prisma.section.findUnique({ where: { id: homework.sectionId }, select: { name: true } }),
      prisma.subject.findUnique({ where: { id: homework.subjectId }, select: { name: true } }),
    ])
    assignments.push({
      classId: homework.classId,
      className: classRecord?.name ?? "",
      sectionId: homework.sectionId,
      sectionName: sectionRecord?.name ?? "",
      subjectId: homework.subjectId,
      subjectName: subjectRecord?.name ?? "",
    })
  }

  return (
    <HomeworkForm
      mode="teacher"
      assignments={assignments}
      categories={categories}
      academicYearId={homework.academicYearId}
      academicYearName={academicYear?.name ?? ""}
      homework={homework}
    />
  )
}

async function AdminEditForm({
  schoolId,
  categories,
  homework,
}: {
  schoolId: string
  categories: { id: string; name: string }[]
  homework: HomeworkFormValue
}) {
  const [classes, sections, subjects, teachers, academicYear] = await Promise.all([
    prisma.class.findMany({ where: { schoolId }, orderBy: { order: "asc" } }),
    prisma.section.findMany({ where: { class: { schoolId } }, orderBy: { name: "asc" } }),
    prisma.subject.findMany({ where: { schoolId }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { schoolId, role: Role.TEACHER, isActive: true }, orderBy: { name: "asc" } }),
    prisma.academicYear.findFirst({ where: { id: homework.academicYearId }, select: { name: true } }),
  ])

  return (
    <HomeworkForm
      mode="admin"
      classes={classes}
      sections={sections}
      subjects={subjects}
      teachers={teachers}
      categories={categories}
      academicYearId={homework.academicYearId}
      academicYearName={academicYear?.name ?? ""}
      homework={homework}
    />
  )
}
