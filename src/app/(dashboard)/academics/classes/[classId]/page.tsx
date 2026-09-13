import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ArrowLeft } from "lucide-react"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getRolesForHref } from "@/lib/permissions/nav"
import { PageHeader } from "@/components/shared/page-header"
import { ActiveBadge } from "@/components/academics/active-badge"
import { SectionDialog } from "@/components/academics/section-dialog"
import { AssignSubjectForm } from "@/components/academics/assign-subject-form"
import { RemoveClassSubjectButton } from "@/components/academics/remove-class-subject-button"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>
}) {
  const user = await requireRole(...getRolesForHref("/academics"))
  const t = await getTranslations("academics")
  const { classId } = await params

  const klass = await prisma.class.findFirst({
    where: { id: classId, schoolId: user.schoolId },
    include: {
      sections: { orderBy: { name: "asc" } },
      classSubjects: { include: { subject: true }, orderBy: { subject: { name: "asc" } } },
      _count: { select: { students: true } },
    },
  })
  if (!klass) notFound()

  const [allSubjects, teacherAssignments] = await Promise.all([
    prisma.subject.findMany({ where: { schoolId: user.schoolId, isActive: true }, orderBy: { name: "asc" } }),
    prisma.teacherAssignment.findMany({
      where: { classId },
      include: { teacher: true, section: true, subject: true },
      orderBy: { section: { name: "asc" } },
    }),
  ])

  const assignedSubjectIds = new Set(klass.classSubjects.map((cs) => cs.subjectId))
  const availableSubjects = allSubjects.filter((subject) => !assignedSubjectIds.has(subject.id))

  return (
    <div className="space-y-6">
      <PageHeader
        title={klass.name}
        actions={
          <Button variant="outline" render={<Link href="/academics/classes" />} nativeButton={false}>
            <ArrowLeft />
            {t("classDetail.backToClasses")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("classDetail.students")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{klass._count.students}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("fields.status")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ActiveBadge
              isActive={klass.isActive}
              activeLabel={t("status.active")}
              inactiveLabel={t("status.inactive")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("sections.title")}</CardTitle>
            <CardAction>
              <SectionDialog classId={klass.id} />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-2">
            {klass.sections.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("classDetail.noSections")}</p>
            )}
            {klass.sections.map((section) => (
              <div key={section.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{section.name}</span>
                <div className="flex items-center gap-2">
                  <ActiveBadge
                    isActive={section.isActive}
                    activeLabel={t("status.active")}
                    inactiveLabel={t("status.inactive")}
                  />
                  <SectionDialog classId={klass.id} section={section} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("subjects.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {klass.classSubjects.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("classDetail.noSubjects")}</p>
              )}
              {klass.classSubjects.map((cs) => (
                <Badge key={cs.id} variant="secondary" className="gap-1 pr-1">
                  {cs.subject.name}
                  <RemoveClassSubjectButton classId={klass.id} subjectId={cs.subjectId} />
                </Badge>
              ))}
            </div>
            <AssignSubjectForm
              classId={klass.id}
              availableSubjects={availableSubjects}
              hasAnySubjects={allSubjects.length > 0}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("assignments.title")}</CardTitle>
          <CardAction>
            <Button size="sm" variant="outline" render={<Link href="/academics/assignments" />} nativeButton={false}>
              {t("classDetail.manageAssignments")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {teacherAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("classDetail.noAssignments")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fields.teacher")}</TableHead>
                  <TableHead>{t("fields.section")}</TableHead>
                  <TableHead>{t("fields.subject")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.teacher.name}</TableCell>
                    <TableCell>{assignment.section.name}</TableCell>
                    <TableCell>{assignment.subject.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
