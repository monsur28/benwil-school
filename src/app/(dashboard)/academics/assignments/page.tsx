import Link from "next/link"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

export default async function TeacherAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ teacherId?: string; filterYearId?: string }>
}) {
  const user = await requireRole(...getRolesForHref("/academics"))
  const t = await getTranslations("academics")
  const tTeachers = await getTranslations("teachers")
  const { teacherId, filterYearId } = await searchParams

  const [assignments, teachers, classes, sections, academicYears, classSubjects, filteredTeacher] = await Promise.all([
    prisma.teacherAssignment.findMany({
      where: { schoolId: user.schoolId, ...(teacherId && { teacherId }), ...(filterYearId && { academicYearId: filterYearId }) },
      include: { teacher: true, class: true, section: true, subject: true, academicYear: true },
      orderBy: [{ academicYear: { name: "desc" } }, { class: { order: "asc" } }, { section: { name: "asc" } }],
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
    // Every year the school has ever had, not just the active one - an
    // admin must be able to create/view assignments for a past or upcoming
    // year (spec: "Admin can view/manage assignments across academic years
    // where permitted"), not only the currently active one.
    prisma.academicYear.findMany({ where: { schoolId: user.schoolId }, orderBy: { name: "desc" }, select: { id: true, name: true, isActive: true } }),
    prisma.classSubject.findMany({
      where: { class: { schoolId: user.schoolId } },
      include: { subject: true },
    }),
    teacherId
      ? prisma.user.findFirst({ where: { id: teacherId, schoolId: user.schoolId, role: Role.TEACHER }, select: { id: true, name: true } })
      : Promise.resolve(null),
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
        description={filteredTeacher ? `${tTeachers("fields.teacher")}: ${filteredTeacher.name}` : undefined}
        actions={
          teachers.length > 0 &&
          classes.length > 0 && (
            <TeacherAssignmentDialog
              teachers={teachers}
              classes={classes}
              sections={sections}
              classSubjects={classSubjectOptions}
              academicYears={academicYears}
              defaultTeacherId={teacherId}
            />
          )
        }
      />
      <AcademicsSubNav />

      <div className="flex flex-wrap items-center gap-2">
        {filteredTeacher && (
          <Button nativeButton={false} variant="outline" size="sm" render={<Link href="/academics/assignments" />}>
            {t("assignments.viewAll", { fallback: "View all assignments" })}
          </Button>
        )}
        <form className="flex items-center gap-2">
          {teacherId && <input type="hidden" name="teacherId" value={teacherId} />}
          <NativeSelect name="filterYearId" defaultValue={filterYearId ?? ""} className="h-9">
            <NativeSelectOption value="">{t("assignments.allYears", { fallback: "All academic years" })}</NativeSelectOption>
            {academicYears.map((year) => (
              <NativeSelectOption key={year.id} value={year.id}>
                {year.name}
                {year.isActive ? ` (${tTeachers("status.active")})` : ""}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button type="submit" variant="outline" size="sm">
            {tTeachers("filters.filter")}
          </Button>
        </form>
      </div>

      {assignments.length === 0 ? (
        <EmptyState icon={Users2} title={t("assignments.empty")} />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.academicYear", { fallback: "Academic Year" })}</TableHead>
                <TableHead>{t("fields.teacher")}</TableHead>
                <TableHead>{t("fields.class")}</TableHead>
                <TableHead>{t("fields.section")}</TableHead>
                <TableHead>{t("fields.subject")}</TableHead>
                <TableHead>{tTeachers("fields.status")}</TableHead>
                <TableHead className="text-right">{t("actions.title")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    {assignment.academicYear ? (
                      assignment.academicYear.name
                    ) : (
                      <span className="text-xs text-muted-foreground">{tTeachers("profile.legacy")}</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{assignment.teacher.name}</TableCell>
                  <TableCell>{assignment.class.name}</TableCell>
                  <TableCell>{assignment.section.name}</TableCell>
                  <TableCell>{assignment.subject.name}</TableCell>
                  <TableCell>
                    {assignment.isClassTeacher && (
                      <Badge variant="outline" className="border-brand-red/30 text-brand-red">
                        {tTeachers("profile.classTeacher")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <RemoveAssignmentButton id={assignment.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
