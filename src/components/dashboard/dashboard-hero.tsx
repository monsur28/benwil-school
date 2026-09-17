import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"
import { Award, BookOpen, CalendarDays, ClipboardCheck, CreditCard, GraduationCap, NotebookPen, Target, Users } from "lucide-react"
import { IconBadge } from "@/components/ui/icon-badge"

interface DashboardHeroProps {
  userName: string
  schoolName: string
  sessionYear?: string
  totalStudents?: number
  classCount?: number
  teacherCount?: number
  attendanceRate?: number | null
}

/**
 * The Admin Dashboard Opener — crafted to match the aesthetic of Photo 2
 * with reusable squircle icon badges from Photo 1:
 *
 * 1. Left Card: Warm cream background (#f7f7f2), geometric architectural
 *    shapes, bold greeting with an amber accent dot, school subtitle, and
 *    3 bottom indicator stats using reusable IconBadge squircle icons.
 *
 * 2. Right Card: Dedicated "Quick Actions" panel with "See all" link and a 2x2
 *    grid of shortcut tiles powered by the vibrant solid squircle IconBadge (Photo 1).
 */
export async function DashboardHero({
  userName,
  schoolName,
  sessionYear = "2026",
  totalStudents = 10,
  classCount = 10,
  teacherCount = 8,
  attendanceRate = null,
}: DashboardHeroProps) {
  const [tHero, tQuick, locale] = await Promise.all([
    getTranslations("dashboard.admin.hero"),
    getTranslations("dashboard.admin.quickActions"),
    getLocale(),
  ])

  const hour = new Date().getHours()
  const greeting =
    hour < 12
      ? tHero("greetingMorning")
      : hour < 18
      ? tHero("greetingAfternoon")
      : tHero("greetingEvening")

  const date = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date())

  // 4 key actions for the admin matching the exact 4 squircle icons from Photo 1:
  // 1. Blue with File/Register
  // 2. Pink/Rose with Notebook/Pen
  // 3. Green with Target/Results
  // 4. Orange with Book/Ledger
  const quickActions = [
    {
      href: "/attendance",
      label: tQuick("takeAttendance"),
      tone: "blue" as const,
      Icon: ClipboardCheck,
    },
    {
      href: "/students/new",
      label: tQuick("addStudent"),
      tone: "rose" as const,
      Icon: NotebookPen,
    },
    {
      href: "/results",
      label: tQuick("reviewResults"),
      tone: "green" as const,
      Icon: Target,
    },
    {
      href: "/fees/payments/new",
      label: tQuick("collectFee"),
      tone: "orange" as const,
      Icon: BookOpen,
    },
  ] as const

  return (
    <section className="grid gap-3 lg:grid-cols-12">
      {/* Left Card: Welcome Banner with Abstract Geometric Accent */}
      <div className="relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-xl border border-border bg-[#f7f7f2] p-6 sm:p-7 lg:col-span-8 xl:col-span-9">
        {/* School Vector Campus Illustration on the right */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] select-none overflow-hidden sm:block"
        >
          {/* Soft gradient fade so the illustration merges seamlessly into the card */}
          <div className="absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-[#f7f7f2] via-[#f7f7f2]/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-[#f7f7f2]/60 to-transparent" />
          <img
            src="/images/school_vector_hero.jpg"
            alt=""
            className="size-full object-cover object-right-bottom mix-blend-multiply opacity-90 transition-opacity"
          />
        </div>

        {/* Greeting & Subtitle */}
        <div className="relative z-10 max-w-[62%] min-w-[280px]">
          <p className="text-sm font-bold text-brand-navy">{greeting},</p>
          <h1 className="mt-0.5 text-4xl font-bold tracking-tight text-brand-navy sm:text-5xl">
            {userName}
            <span className="text-amber-500">.</span>
          </h1>
          <p className="mt-3 text-sm font-medium text-brand-navy/75">
            {tHero("subtitle", { schoolName, date })}
          </p>
        </div>

        {/* Bottom Three Operational Indicators with Reusable IconBadges */}
        <div className="relative z-10 mt-8 flex flex-wrap gap-2.5 text-xs text-brand-navy sm:text-sm">
          <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-white/75 px-3 py-1.5 shadow-2xs backdrop-blur-xs">
            <IconBadge icon={GraduationCap} tone="blue" size="sm" />
            <div>
              <b>{sessionYear ? tHero("academicSession", { year: sessionYear }) : "Session 2026"}</b>
              <p className="text-[10px] font-normal text-muted-foreground">{schoolName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-white/75 px-3 py-1.5 shadow-2xs backdrop-blur-xs">
            <IconBadge icon={Users} tone="purple" size="sm" />
            <div>
              <b>{totalStudents} Students</b>
              <p className="text-[10px] font-normal text-muted-foreground">
                {classCount} Classes · {teacherCount} Faculty
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-white/75 px-3 py-1.5 shadow-2xs backdrop-blur-xs">
            <IconBadge icon={Target} tone="green" size="sm" />
            <div>
              <b>
                {attendanceRate !== null && attendanceRate !== undefined
                  ? `${attendanceRate}% Present`
                  : tHero("allSystemsNominal")}
              </b>
              <p className="text-[10px] font-normal text-muted-foreground">{date}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Card: Quick Actions 2x2 Grid with Solid Squircle Badges */}
      <aside className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 sm:p-5 lg:col-span-4 xl:col-span-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-brand-navy">{tQuick("title")}</h2>
          <Link
            href="/students"
            className="text-[11px] font-semibold text-blue-600 transition-colors hover:text-blue-800"
          >
            {locale === "bn" ? "সব দেখুন" : "See all"}
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {quickActions.map(({ href, label, tone, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex min-h-[96px] flex-col justify-between rounded-xl border border-border/70 bg-[#fafaf8] p-3 transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-xs"
            >
              <IconBadge icon={Icon} tone={tone} size="md" />
              <p className="mt-2 text-[11px] font-bold leading-tight text-brand-navy group-hover:text-primary">
                {label}
              </p>
            </Link>
          ))}
        </div>
      </aside>
    </section>
  )
}
