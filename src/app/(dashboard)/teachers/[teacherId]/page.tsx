import Link from "next/link"
import { Role } from "@prisma/client"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { formatDate } from "@/lib/format"
import { EMPLOYMENT_TYPE_OPTIONS, type EmploymentTypeOption } from "@/lib/teachers/options"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TeacherActiveToggle } from "@/components/teachers/teacher-active-toggle"
import { BookOpen, Briefcase, Mail, Pencil, Phone, Users } from "lucide-react"

const MANAGERS: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]
const VIEWERS = [...MANAGERS, Role.HR]

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ teacherId: string }>
}) {
  const [user, t, locale] = await Promise.all([
    requireRole(...VIEWERS),
    getTranslations("teachers"),
    getLocale(),
  ])
  const { teacherId } = await params

  const teacher = await prisma.user.findFirst({
    where: { id: teacherId, schoolId: user.schoolId, role: Role.TEACHER },
    include: {
      teacherAssignments: {
        include: { academicYear: true, class: true, section: true, subject: true },
        orderBy: [{ class: { order: "asc" } }, { section: { name: "asc" } }],
      },
    },
  })
  if (!teacher) notFound()

  const subjects = new Set(teacher.teacherAssignments.map((item) => item.subject.name))
  const sections = new Set(teacher.teacherAssignments.map((item) => `${item.class.name} ${item.section.name}`))
  const canManage = MANAGERS.includes(user.role)

  // employmentType stays a plain string column (see schema.prisma) rather
  // than a Prisma enum, so a value outside today's four options - legacy
  // data, or a direct DB edit - is shown as-is instead of silently
  // disappearing.
  const employmentTypeLabel = teacher.employmentType
    ? EMPLOYMENT_TYPE_OPTIONS.includes(teacher.employmentType as EmploymentTypeOption)
      ? t(`employmentType.${teacher.employmentType as EmploymentTypeOption}`)
      : teacher.employmentType
    : "—"

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-2xl bg-brand-navy text-xl font-bold text-white">
              {teacher.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-navy">{teacher.name}</h1>
              <p className="text-sm text-muted-foreground">
                {teacher.designation ?? t("fields.teacher")} · {teacher.employeeId ?? t("profile.noEmployeeId")}
              </p>
              <Badge variant={teacher.isActive ? "default" : "secondary"} className="mt-2">
                {teacher.isActive ? t("status.active") : t("status.inactive")}
              </Badge>
            </div>
          </div>
          {canManage && (
            <div className="flex flex-wrap gap-2">
              <Button nativeButton={false} variant="outline" render={<Link href={`/teachers/${teacher.id}/edit`} />}>
                <Pencil />
                {t("actions.edit")}
              </Button>
              <Button nativeButton={false} render={<Link href={`/academics/assignments?teacherId=${teacher.id}`} />}>
                {t("actions.manageAssignments")}
              </Button>
              <TeacherActiveToggle teacherId={teacher.id} isActive={teacher.isActive} />
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            [t("profile.assignedClasses"), sections.size, Users],
            [t("profile.assignedSubjects"), subjects.size, BookOpen],
            [t("profile.totalAssignments"), teacher.teacherAssignments.length, Briefcase],
            [t("profile.employment"), employmentTypeLabel, Briefcase],
          ] as const
        ).map(([label, value, Icon]) => (
          <div key={String(label)} className="panel p-4">
            <Icon className="size-5 text-brand-navy" />
            <p className="mt-4 text-2xl font-bold text-brand-navy">{String(value)}</p>
            <p className="text-xs text-muted-foreground">{String(label)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-bold text-brand-navy">{t("sections.basic")}</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p className="flex gap-2">
              <Mail className="size-4 text-muted-foreground" />
              {teacher.email}
            </p>
            <p className="flex gap-2">
              <Phone className="size-4 text-muted-foreground" />
              {teacher.phone ?? t("profile.noPhone")}
            </p>
            <p>
              <b>{t("fields.gender")}:</b> {teacher.gender ? t(`gender.${teacher.gender}`) : "—"}
            </p>
            <p>
              <b>{t("fields.dateOfBirth")}:</b> {teacher.dateOfBirth ? formatDate(teacher.dateOfBirth, locale) : "—"}
            </p>
            <p>
              <b>{t("profile.department")}:</b> {teacher.department ?? "—"}
            </p>
            <p>
              <b>{t("profile.qualifications")}:</b> {teacher.qualifications ?? "—"}
            </p>
            <p>
              <b>{t("profile.specialization")}:</b> {teacher.specialization ?? "—"}
            </p>
            <p>
              <b>{t("fields.experience")}:</b> {teacher.experience ?? "—"}
            </p>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="font-bold text-brand-navy">{t("fields.assignments")}</h2>
          <div className="mt-4 space-y-2">
            {teacher.teacherAssignments.length ? (
              teacher.teacherAssignments.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span>
                    <b>{item.subject.name}</b>
                    <span className="block text-xs text-muted-foreground">
                      {item.class.name} · {item.section.name} · {item.academicYear?.name ?? t("profile.legacy")}
                    </span>
                  </span>
                  {item.isClassTeacher && <span className="text-xs font-semibold text-brand-red">{t("profile.classTeacher")}</span>}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{t("profile.noAssignments")}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
