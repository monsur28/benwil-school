import { getTranslations } from "next-intl/server"
import { Users2 } from "lucide-react"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getRolesForHref } from "@/lib/permissions/nav"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { AcademicsSubNav } from "@/components/academics/academics-subnav"
import { TeacherAssignmentDialog } from "@/components/academics/teacher-assignment-dialog"
import { RemoveAssignmentButton } from "@/components/academics/remove-assignment-button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

export default async function TeacherAssignmentsPage() {
  const user = await requireRole(...getRolesForHref("/academics"))
  const t = await getTranslations("academics")

  const [assignments, teachers, classes, sections, classSubjects] = await Promise.all([
    prisma.teacherAssignment.findMany({
      where: { schoolId: user.schoolId },
      include: { teacher: true, class: true, section: true, subject: true },
      orderBy: [{ class: { order: "asc" } }, { section: { name: "asc" } }],
    }),
    prisma.user.findMany({
      where: { schoolId: user.schoolId, role: Role.TEACHER, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.class.findMany({
      where: { schoolId: user.schoolId, isActive: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
    prisma.section.findMany({
      where: { class: { schoolId: user.schoolId }, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, classId: true, name: true },
    }),
    prisma.classSubject.findMany({
      where: { class: { schoolId: user.schoolId } },
      include: { subject: true },
    }),
  ])

  const classSubjectOptions = classSubjects.map((cs) => ({
    classId: cs.classId,
    subjectId: cs.subjectId,
    subjectName: cs.subject.name,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          teachers.length > 0 &&
          classes.length > 0 && (
            <TeacherAssignmentDialog
              teachers={teachers}
              classes={classes}
              sections={sections}
              classSubjects={classSubjectOptions}
            />
          )
        }
      />
      <AcademicsSubNav />

      {assignments.length === 0 ? (
        <EmptyState icon={Users2} title={t("assignments.empty")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.teacher")}</TableHead>
              <TableHead>{t("fields.class")}</TableHead>
              <TableHead>{t("fields.section")}</TableHead>
              <TableHead>{t("fields.subject")}</TableHead>
              <TableHead className="text-right">{t("actions.title")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell className="font-medium text-foreground">{assignment.teacher.name}</TableCell>
                <TableCell>{assignment.class.name}</TableCell>
                <TableCell>{assignment.section.name}</TableCell>
                <TableCell>{assignment.subject.name}</TableCell>
                <TableCell className="text-right">
                  <RemoveAssignmentButton id={assignment.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
