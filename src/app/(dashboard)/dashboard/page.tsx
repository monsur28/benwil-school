import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { requireAuth } from "@/lib/auth/dal"
import { PageHeader } from "@/components/shared/page-header"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"
import { GuardianDashboard } from "@/components/dashboard/guardian-dashboard"
import { GenericDashboard } from "@/components/dashboard/generic-dashboard"

function DashboardContent({ role }: { role: Role }) {
  switch (role) {
    case Role.SUPER_ADMIN:
    case Role.SCHOOL_ADMIN:
    case Role.PRINCIPAL:
      return <AdminDashboard />
    case Role.TEACHER:
      return <TeacherDashboard />
    case Role.STUDENT:
      return <StudentDashboard />
    case Role.GUARDIAN:
      return <GuardianDashboard />
    default:
      return <GenericDashboard />
  }
}

export default async function DashboardPage() {
  const user = await requireAuth()
  const t = await getTranslations("common")

  return (
    <div className="space-y-6">
      <PageHeader title={`${t("welcomeBack")}, ${user.name}`} />
      <DashboardContent role={user.role} />
    </div>
  )
}
