import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { UserX, Pencil } from "lucide-react"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getRolesForHref } from "@/lib/permissions/nav"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { ComingSoon } from "@/components/shared/coming-soon"
import { StudentAvatar } from "@/components/students/student-avatar"
import { StudentStatusBadge } from "@/components/students/student-status-badge"
import { StudentSavedToast } from "@/components/students/student-saved-toast"
import { OverviewTab } from "@/components/students/tabs/overview-tab"
import { AcademicTab } from "@/components/students/tabs/academic-tab"
import { AttendanceTab } from "@/components/students/tabs/attendance-tab"
import { ResultsTab } from "@/components/students/tabs/results-tab"
import { DocumentsTab } from "@/components/students/tabs/documents-tab"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const user = await requireRole(...getRolesForHref("/students"))
  const t = await getTranslations("students")
  const { studentId } = await params

  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId: user.schoolId },
    include: {
      class: true,
      section: true,
      academicYear: true,
      guardians: { include: { guardian: true } },
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  })

  if (!student) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState icon={UserX} title={t("notFoundTitle")} description={t("notFoundDescription")} />
      </div>
    )
  }

  const canManage = CAN_MANAGE.includes(user.role)

  return (
    <div className="space-y-6">
      <StudentSavedToast />

      <PageHeader
        title={student.name}
        description={`${student.studentUid} · ${student.admissionNumber}`}
        actions={
          canManage && (
            <Button nativeButton={false} render={<Link href={`/students/${student.id}/edit`} />}>
              <Pencil />
              {t("profile.editStudent")}
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
        <StudentAvatar name={student.name} size="lg" />
        <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span>
            <span className="text-muted-foreground">{t("fields.class")}: </span>
            <span className="font-medium">{student.class.name}</span>
          </span>
          <span>
            <span className="text-muted-foreground">{t("fields.section")}: </span>
            <span className="font-medium">{student.section.name}</span>
          </span>
          <span>
            <span className="text-muted-foreground">{t("fields.roll")}: </span>
            <span className="font-medium">{student.roll}</span>
          </span>
          <StudentStatusBadge status={student.status} label={t(`status.${student.status}`)} />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">{t("profile.overview")}</TabsTrigger>
          <TabsTrigger value="academic">{t("profile.academic")}</TabsTrigger>
          <TabsTrigger value="attendance">{t("profile.attendance")}</TabsTrigger>
          <TabsTrigger value="results">{t("profile.results")}</TabsTrigger>
          <TabsTrigger value="fees">{t("profile.fees")}</TabsTrigger>
          <TabsTrigger value="homework">{t("profile.homework")}</TabsTrigger>
          <TabsTrigger value="documents">{t("profile.documents")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab student={student} />
        </TabsContent>
        <TabsContent value="academic">
          <AcademicTab student={student} />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceTab studentId={student.id} />
        </TabsContent>
        <TabsContent value="results">
          <ResultsTab studentId={student.id} schoolId={student.schoolId} classId={student.classId} />
        </TabsContent>
        <TabsContent value="fees">
          <ComingSoon />
        </TabsContent>
        <TabsContent value="homework">
          <ComingSoon />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab student={student} canManage={canManage} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
