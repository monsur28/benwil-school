import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"
import {
  GraduationCap,
  Users,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Droplet,
  IdCard,
  Hash,
} from "lucide-react"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getSchoolIdentity } from "@/lib/settings/school-settings"
import { prisma } from "@/lib/db/client"
import { StudentAvatar } from "@/components/students/student-avatar"
import { IconBadge } from "@/components/ui/icon-badge"

function calculateAge(dob: Date): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export default async function StudentProfilePage() {
  const { student, user } = await requireStudentIdentity()
  const [t, locale] = await Promise.all([getTranslations("students"), getLocale()])
  const identity = await getSchoolIdentity(user.schoolId)

  const guardians = await prisma.studentGuardian.findMany({
    where: { studentId: student.id },
    include: { guardian: true },
    orderBy: { isPrimary: "desc" },
  })

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const age = calculateAge(student.dateOfBirth)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-10">
      {/* ------------------------------------------------------------------- */}
      {/* Top Student Digital ID & Profile Hero Banner                         */}
      {/* ------------------------------------------------------------------- */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-[#f7f7f2] p-6 shadow-xs sm:p-7">
        {/* Subtle background radial & mesh accents */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-[radial-gradient(circle,#e2ebd8_0%,transparent_70%)] opacity-80"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-1/4 h-32 w-64 rounded-t-full bg-[radial-gradient(circle,#edf2ea_0%,transparent_70%)] opacity-60"
        />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          {/* Left: Avatar + Identification info */}
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="relative shrink-0">
              <StudentAvatar
                name={student.name}
                photoUrl={student.photoUrl}
                size="lg"
                className="size-20 ring-4 ring-white shadow-md sm:size-24"
                fallbackClassName="text-xl sm:text-2xl font-bold text-primary"
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full bg-emerald-600 text-white ring-2 ring-white shadow-xs"
                title="Verified Student"
              >
                <CheckCircle2 className="size-3.5 stroke-[2.5]" />
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="eyebrow text-xs text-muted-foreground">
                  {identity.schoolName || "Student Profile"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  {t(`status.${student.status}`)}
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">
                {student.name}
              </h1>

              {student.nameBn && (
                <p className="text-sm font-medium text-muted-foreground">
                  {student.nameBn}
                </p>
              )}

              {/* Quick Info Badges */}
              <div className="mt-2 flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200/70 bg-blue-50/80 px-2.5 py-1 font-semibold text-blue-800">
                  <GraduationCap className="size-3.5 text-blue-600" />
                  {student.class.name} · {t("fields.section")} {student.section.name}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200/70 bg-purple-50/80 px-2.5 py-1 font-semibold text-purple-800">
                  <Hash className="size-3.5 text-purple-600" />
                  {t("fields.roll")}: {student.roll}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/70 bg-amber-50/80 px-2.5 py-1 font-semibold text-amber-800">
                  <CalendarDays className="size-3.5 text-amber-600" />
                  {student.academicYear.name}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Digital Student ID Pill Card */}
          <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-white/90 p-4 shadow-2xs backdrop-blur-xs sm:min-w-[260px]">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <IdCard className="size-3.5 text-blue-600" />
                Digital Student ID
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <span className="block text-[10px] text-muted-foreground">
                  {t("profile.studentIdLabel")}
                </span>
                <span className="font-mono font-bold text-brand-navy">
                  {student.studentUid}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-muted-foreground">
                  {t("profile.admissionNoLabel")}
                </span>
                <span className="font-mono font-bold text-brand-navy">
                  {student.admissionNumber}
                </span>
              </div>
            </div>

            <div className="mt-1 border-t border-border/50 pt-2 text-[10px] text-muted-foreground flex items-center justify-between">
              <span>{identity.schoolName}</span>
              <span className="font-mono">Class of {student.academicYear.name}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 4 Quick Stat Summary Cards                                           */}
      {/* ------------------------------------------------------------------- */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <IconBadge name="academic" tone="blue" size="sm" />
          <div className="min-w-0">
            <span className="block truncate text-[11px] text-muted-foreground">
              {t("fields.class")} & {t("fields.section")}
            </span>
            <b className="block truncate text-sm text-brand-navy">
              {student.class.name} · {student.section.name}
            </b>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <IconBadge name="homework" tone="rose" size="sm" />
          <div className="min-w-0">
            <span className="block truncate text-[11px] text-muted-foreground">
              {t("fields.roll")}
            </span>
            <b className="block truncate text-sm text-brand-navy">
              #{student.roll}
            </b>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <IconBadge name="document" tone="purple" size="sm" />
          <div className="min-w-0">
            <span className="block truncate text-[11px] text-muted-foreground">
              {t("profile.studentIdLabel")}
            </span>
            <b className="block truncate font-mono text-sm text-brand-navy">
              {student.studentUid}
            </b>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <IconBadge name="health" tone="green" size="sm" />
          <div className="min-w-0">
            <span className="block truncate text-[11px] text-muted-foreground">
              {t("fields.bloodGroup")}
            </span>
            <b className="block truncate text-sm text-brand-navy">
              {student.bloodGroup ? t(`bloodGroup.${student.bloodGroup}`) : "—"}
            </b>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* Main Details 2-Column Bento Grid                                    */}
      {/* ------------------------------------------------------------------- */}
      <section className="grid gap-5 lg:grid-cols-2">
        {/* Left Card: Academic & Enrollment Information */}
        <div className="flex flex-col rounded-xl border border-border bg-card shadow-2xs">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <IconBadge name="academic" tone="blue" size="sm" />
            <div>
              <h2 className="text-sm font-bold text-brand-navy">
                {t("profile.academic")} & {t("profile.admissionInformation")}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Official enrollment, class, and registration records
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60 p-5 pt-2 text-sm">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">{t("fields.class")}</span>
              <span className="font-semibold text-brand-navy">{student.class.name}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">{t("fields.section")}</span>
              <span className="font-semibold text-brand-navy">{student.section.name}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">{t("fields.roll")}</span>
              <span className="font-semibold text-brand-navy">#{student.roll}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">{t("fields.academicYear")}</span>
              <span className="font-semibold text-brand-navy">{student.academicYear.name}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">{t("profile.studentIdLabel")}</span>
              <span className="font-mono font-bold text-blue-700">{student.studentUid}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">{t("profile.admissionNoLabel")}</span>
              <span className="font-mono font-bold text-brand-navy">{student.admissionNumber}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">{t("fields.admissionDate")}</span>
              <span className="font-medium text-brand-navy">
                {dateFormatter.format(student.admissionDate)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">{t("fields.status")}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                {t(`status.${student.status}`)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: Personal & Identification Details */}
        <div className="flex flex-col rounded-xl border border-border bg-card shadow-2xs">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <IconBadge name="student" tone="purple" size="sm" />
            <div>
              <h2 className="text-sm font-bold text-brand-navy">
                {t("profile.basicInformation")}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Personal identity and demographic records
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60 p-5 pt-2 text-sm">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">{t("fields.name")}</span>
              <span className="font-semibold text-brand-navy">{student.name}</span>
            </div>
            {student.nameBn && (
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-muted-foreground">{t("fields.nameBn")}</span>
                <span className="font-medium text-brand-navy">{student.nameBn}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">{t("fields.gender")}</span>
              <span className="font-semibold text-brand-navy">
                {t(`gender.${student.gender}`)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">{t("fields.dateOfBirth")}</span>
              <span className="font-medium text-brand-navy">
                {dateFormatter.format(student.dateOfBirth)}
                {age !== null && (
                  <span className="ml-1.5 text-xs text-muted-foreground">({age} yrs)</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">{t("fields.bloodGroup")}</span>
              {student.bloodGroup ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                  <Droplet className="size-3 fill-rose-500 text-rose-500" />
                  {t(`bloodGroup.${student.bloodGroup}`)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">{t("fields.nationality")}</span>
              <span className="font-medium text-brand-navy">
                {student.nationality || "Bangladeshi"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">{t("fields.religion")}</span>
              <span className="font-medium text-brand-navy">{student.religion || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted-foreground">
                {t("fields.birthCertificateNumber")}
              </span>
              <span className="font-mono text-xs text-brand-navy">
                {student.birthCertificateNumber || "—"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* Guardian & Emergency Contacts Section                               */}
      {/* ------------------------------------------------------------------- */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <IconBadge name="students" tone="green" size="sm" />
            <div>
              <h2 className="text-sm font-bold text-brand-navy">
                {t("profile.guardianInformation")}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Registered parent and emergency contacts linked to this student
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {guardians.length} {guardians.length === 1 ? "Guardian" : "Guardians"}
          </span>
        </div>

        {guardians.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="mx-auto size-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">{t("profile.noGuardians")}</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {guardians.map((link) => (
              <div
                key={link.id}
                className="flex flex-col justify-between rounded-xl border border-border/80 bg-[#fafaf8] p-4 transition-all hover:border-border hover:bg-card hover:shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-brand-navy">
                        {link.guardian.name}
                      </h3>
                      {link.guardian.nameBn && (
                        <p className="text-xs text-muted-foreground">{link.guardian.nameBn}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md border border-border bg-white px-2 py-0.5 text-[10px] font-semibold text-brand-navy">
                        {t(`relation.${link.relation}`)}
                      </span>
                      {link.isPrimary && (
                        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                          {t("profile.primaryGuardian")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    {link.guardian.phone && (
                      <a
                        href={`tel:${link.guardian.phone}`}
                        className="flex items-center gap-2 text-brand-navy hover:text-blue-600 transition-colors"
                      >
                        <Phone className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="font-mono">{link.guardian.phone}</span>
                      </a>
                    )}

                    {link.guardian.email && (
                      <a
                        href={`mailto:${link.guardian.email}`}
                        className="flex items-center gap-2 text-brand-navy hover:text-blue-600 transition-colors"
                      >
                        <Mail className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{link.guardian.email}</span>
                      </a>
                    )}

                    {link.guardian.occupation && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="size-3.5 text-muted-foreground shrink-0" />
                        <span>{link.guardian.occupation}</span>
                      </div>
                    )}

                    {link.guardian.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{link.guardian.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* Quick Portal Navigation Links                                        */}
      {/* ------------------------------------------------------------------- */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-sm font-bold text-brand-navy">Student Portal Shortcuts</h2>
          <span className="text-xs text-muted-foreground">Quick access</span>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Link
            href="/portal/student/attendance"
            className="group flex flex-col justify-between rounded-xl border border-border/70 bg-[#fafaf8] p-3.5 transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-xs"
          >
            <IconBadge name="attendance" tone="blue" size="md" />
            <div className="mt-3">
              <b className="block text-xs text-brand-navy group-hover:text-primary">
                {t("profile.attendance")}
              </b>
              <span className="block text-[10px] text-muted-foreground">
                View attendance record
              </span>
            </div>
          </Link>

          <Link
            href="/portal/student/results"
            className="group flex flex-col justify-between rounded-xl border border-border/70 bg-[#fafaf8] p-3.5 transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-xs"
          >
            <IconBadge name="results" tone="green" size="md" />
            <div className="mt-3">
              <b className="block text-xs text-brand-navy group-hover:text-primary">
                {t("profile.results")}
              </b>
              <span className="block text-[10px] text-muted-foreground">
                Exam marksheets & cards
              </span>
            </div>
          </Link>

          <Link
            href="/portal/student/homework"
            className="group flex flex-col justify-between rounded-xl border border-border/70 bg-[#fafaf8] p-3.5 transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-xs"
          >
            <IconBadge name="homework" tone="rose" size="md" />
            <div className="mt-3">
              <b className="block text-xs text-brand-navy group-hover:text-primary">
                {t("profile.homework")}
              </b>
              <span className="block text-[10px] text-muted-foreground">
                Class tasks & deadlines
              </span>
            </div>
          </Link>

          <Link
            href="/portal/student/fees"
            className="group flex flex-col justify-between rounded-xl border border-border/70 bg-[#fafaf8] p-3.5 transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-xs"
          >
            <IconBadge name="fees" tone="orange" size="md" />
            <div className="mt-3">
              <b className="block text-xs text-brand-navy group-hover:text-primary">
                {t("profile.fees")}
              </b>
              <span className="block text-[10px] text-muted-foreground">
                Invoices & payments
              </span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}
