import { getLocale, getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { Calendar } from "lucide-react"
import { requireAuth } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getSchoolIdentity } from "@/lib/settings/school-settings"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard"
import { GenericDashboard } from "@/components/dashboard/generic-dashboard"

// STUDENT/GUARDIAN never reach this page - the (dashboard) layout redirects
// them to /portal before this renders.
function DashboardContent({ role }: { role: Role }) {
  switch (role) {
    case Role.SUPER_ADMIN:
    case Role.SCHOOL_ADMIN:
    case Role.PRINCIPAL:
      return <AdminDashboard />
    case Role.TEACHER:
      return <TeacherDashboard />
    default:
      return <GenericDashboard />
  }
}

export default async function DashboardPage() {
  const user = await requireAuth()
  const [t, tRoles, locale] = await Promise.all([
    getTranslations("common"),
    getTranslations("roles"),
    getLocale(),
  ])

  const todayFormatted = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date())

  const ADMIN_ROLES: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]
  const isAdmin = ADMIN_ROLES.includes(user.role)

  if (isAdmin) {
    return <AdminDashboard />
  }

  const [identity, activeAcademicYear] = await Promise.all([
    getSchoolIdentity(user.schoolId),
    prisma.academicYear.findFirst({ where: { schoolId: user.schoolId, isActive: true }, select: { name: true } }),
  ])

  return (
    <div className="space-y-8">
      {/* Greeting band for non-admin faculty and staff roles. Matches the
          admin dashboard's opener: context line, name, then a fading rule —
          no card, so the page starts with the person, not with chrome. */}
      <header className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {todayFormatted}
              </span>
              <span aria-hidden="true" className="text-border-strong">/</span>
              <span>{tRoles(user.role)}</span>
            </p>
            <h1 className="mt-3 font-heading text-[2rem] font-bold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-[2.5rem]">
              {t("welcomeBack")}, {user.name}
            </h1>
            <p className="mt-3 text-[15px] text-muted-foreground">
              {activeAcademicYear
                ? `${identity.schoolName} · ${t("academicSession", { year: activeAcademicYear.name })}`
                : identity.schoolName}
            </p>
          </div>
        </div>
        <div className="rule-fade h-px w-full" aria-hidden="true" />
      </header>

      <DashboardContent role={user.role} />
    </div>
  )
}
