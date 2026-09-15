import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { Calendar } from "lucide-react"
import { requireAuth } from "@/lib/auth/dal"
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
  const [t, tRoles] = await Promise.all([
    getTranslations("common"),
    getTranslations("roles"),
  ])

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
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

  return (
    <div className="space-y-6">
      {/* Header for non-admin faculty and staff roles */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-border/50 pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("welcomeBack")}, {user.name}
            </h1>
            <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
              {tRoles(user.role)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Benwil Model School • Academic Session 2026
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-2xs md:flex">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            <Calendar className="size-3.5 text-muted-foreground" />
            <span className="font-mono">{todayFormatted}</span>
          </div>

          <span className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
            Term 1 • 2026
          </span>
        </div>
      </div>

      <DashboardContent role={user.role} />
    </div>
  )
}
