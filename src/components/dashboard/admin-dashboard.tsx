import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import {
  Users,
  ClipboardCheck,
  Wallet,
  CalendarClock,
  Megaphone,
  UserPlus,
  BookOpen,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import { requireAuth } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StudentAvatar } from "@/components/students/student-avatar"
import { StudentStatusBadge } from "@/components/students/student-status-badge"
import { QuickAction } from "@/components/dashboard/quick-action"

export async function AdminDashboard() {
  const user = await requireAuth()
  const schoolId = user.schoolId
  const today = new Date(new Date().toISOString().slice(0, 10))

  const [
    t,
    tStudents,
    totalStudents,
    activeStudents,
    teacherCount,
    staffCount,
    classCount,
    sectionCount,
    todayAttendanceCount,
    attendanceByStatus,
    recentStudents,
  ] = await Promise.all([
    getTranslations("dashboard.admin"),
    getTranslations("students"),
    prisma.student.count({ where: { schoolId } }),
    prisma.student.count({ where: { schoolId, status: "ACTIVE" } }),
    prisma.user.count({ where: { schoolId, role: Role.TEACHER } }),
    prisma.user.count({
      where: {
        schoolId,
        role: {
          in: [
            Role.SUPER_ADMIN,
            Role.SCHOOL_ADMIN,
            Role.PRINCIPAL,
            Role.ACCOUNTANT,
            Role.LIBRARIAN,
            Role.HR,
          ],
        },
      },
    }),
    prisma.class.count({ where: { schoolId } }),
    prisma.section.count({ where: { class: { schoolId } } }),
    prisma.attendance.count({ where: { schoolId, date: today } }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { schoolId, date: today },
      _count: true,
    }),
    prisma.student.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        class: true,
        section: true,
      },
    }),
  ])

  const attendanceCounts = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 }
  for (const row of attendanceByStatus) {
    attendanceCounts[row.status] = row._count
  }
  const presentPct = todayAttendanceCount > 0
    ? Math.round(((attendanceCounts.PRESENT + attendanceCounts.LATE) / todayAttendanceCount) * 1000) / 10
    : 0
  const pct = (count: number) =>
    todayAttendanceCount > 0 ? Math.round((count / todayAttendanceCount) * 100) : 0

  const quickActions = [
    { href: "/students/new", icon: UserPlus, label: t("addStudent"), description: "Admit student to roster", kbd: "N" },
    { href: "/attendance", icon: ClipboardCheck, label: t("takeAttendance"), description: "Daily roll call entry", kbd: "A" },
    { href: "/academics", icon: BookOpen, label: t("manageCurriculum"), description: "Class & subject structure", kbd: "C" },
    { href: "/exams", icon: CalendarClock, label: t("createExam"), description: "Assessment routines", kbd: "E" },
    { href: "/fees", icon: Wallet, label: t("collectFee"), description: "Accounts & student dues", kbd: "F" },
    { href: "/notices", icon: Megaphone, label: t("createNotice"), description: "Institutional bulletins", kbd: "P" },
  ]

  return (
    <div className="space-y-6">
      {/* ── Top Bento Row: Core Institutional Telemetry ────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
        {/* Card 1: Student Enrollment & Capacity (Span 4) */}
        <Card className="flex flex-col justify-between border-border/80 transition-colors hover:border-neutral-300 dark:hover:border-neutral-700 sm:col-span-2 lg:col-span-4">
          <CardContent className="flex flex-col justify-between gap-4 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("enrolledStudents")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#EDF3EC] bg-[#EDF3EC] px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-[#346538] uppercase">
                <span className="size-1.5 rounded-full bg-[#346538]" />
                {t("activeRoster")}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {totalStudents}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {activeStudents} active
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("acrossClasses", { count: classCount })}
              </p>
            </div>

            {/* Proportional Wing Distribution */}
            <div className="space-y-2 pt-1">
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-foreground" style={{ width: "65%" }} />
                <div className="h-full bg-foreground/40" style={{ width: "35%" }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-foreground" />
                  Primary (1-5): 65%
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-foreground/40" />
                  Secondary (6-10): 35%
                </span>
              </div>
            </div>

            <div className="border-t border-border/60 pt-3">
              <Link
                href="/students"
                className="group flex items-center justify-between text-xs font-medium text-foreground hover:underline"
              >
                <span>{t("viewDirectory")}</span>
                <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Today's Attendance Health (Span 4) */}
        <Card className="flex flex-col justify-between border-border/80 transition-colors hover:border-neutral-300 dark:hover:border-neutral-700 sm:col-span-1 lg:col-span-4">
          <CardContent className="flex flex-col justify-between gap-4 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("todaysAttendance")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#E1F3FE] bg-[#E1F3FE] px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-[#1F6C9F] uppercase">
                <span className="size-1.5 animate-pulse rounded-full bg-[#1F6C9F]" />
                {todayAttendanceCount > 0
                  ? t("recordedToday", { count: todayAttendanceCount })
                  : t("rollCallPending")}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {todayAttendanceCount > 0 ? `${presentPct}%` : "Open"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {todayAttendanceCount > 0 ? "overall presence" : "daily register"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
            </div>

            {/* Attendance Status Pills */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
              <div className="rounded-md border border-[#EDF3EC] bg-[#EDF3EC]/70 py-1 text-[11px]">
                <p className="font-mono font-semibold text-[#346538]">{pct(attendanceCounts.PRESENT)}%</p>
                <p className="text-[10px] text-[#346538]/80">{t("present")}</p>
              </div>
              <div className="rounded-md border border-[#FBF3DB] bg-[#FBF3DB]/70 py-1 text-[11px]">
                <p className="font-mono font-semibold text-[#956400]">{pct(attendanceCounts.LATE)}%</p>
                <p className="text-[10px] text-[#956400]/80">{t("late")}</p>
              </div>
              <div className="rounded-md border border-[#FDEBEC] bg-[#FDEBEC]/70 py-1 text-[11px]">
                <p className="font-mono font-semibold text-[#9F2F2D]">{pct(attendanceCounts.ABSENT)}%</p>
                <p className="text-[10px] text-[#9F2F2D]/80">{t("absent")}</p>
              </div>
            </div>

            <div className="border-t border-border/60 pt-3">
              <Link
                href="/attendance"
                className="group flex items-center justify-between text-xs font-medium text-foreground hover:underline"
              >
                <span>{t("openRegister")}</span>
                <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Faculty & Academic Operations (Span 4) */}
        <Card className="flex flex-col justify-between border-border/80 transition-colors hover:border-neutral-300 dark:hover:border-neutral-700 sm:col-span-1 lg:col-span-4">
          <CardContent className="flex flex-col justify-between gap-4 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("teachers")} & {t("staff")}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#E1F3FE] bg-[#E1F3FE] px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-[#1F6C9F] uppercase">
                {t("ratioBadge")}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {teacherCount + staffCount}
                </span>
                <span className="text-xs text-muted-foreground">
                  staff members
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {teacherCount} {t("certifiedTeachers")} • {staffCount} {t("supportStaff")}
              </p>
            </div>

            <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>{t("classesAndSections", { classes: classCount, sections: sectionCount })}</span>
                <span className="font-mono font-medium text-foreground">100% Active</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>Curriculum Delivery</span>
                <span className="font-mono text-foreground">Standard NC</span>
              </div>
            </div>

            <div className="border-t border-border/60 pt-3">
              <Link
                href="/academics"
                className="group flex items-center justify-between text-xs font-medium text-foreground hover:underline"
              >
                <span>{t("manageCurriculum")}</span>
                <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Mid Bento Row: Live Admissions & Academic Roadmap ──────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Card 4: Live Recent Admissions Roster (Span 7) */}
        <Card className="border-border/80 lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-5 py-4">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
                {t("recentAdmissions")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("showingRecent", { count: totalStudents })}
              </CardDescription>
            </div>
            <Button
              nativeButton={false}
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              render={<Link href="/students/new" />}
            >
              <UserPlus className="size-3.5" />
              <span>{t("quickAdmit")}</span>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Users className="mb-2 size-8 stroke-1 text-muted-foreground/50" />
                <p className="text-sm font-medium">{tStudents("empty.title")}</p>
                <p className="text-xs">{tStudents("empty.description")}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <StudentAvatar name={student.name} size="sm" />
                      <div className="min-w-0">
                        <Link
                          href={`/students/${student.id}`}
                          className="truncate text-xs font-semibold text-foreground hover:underline sm:text-sm"
                        >
                          {student.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="font-mono text-muted-foreground/80">{student.studentUid}</span>
                          <span>•</span>
                          <span>
                            {student.class.name} ({student.section.name})
                          </span>
                          <span>•</span>
                          <span>Roll #{student.roll}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2.5">
                      <StudentStatusBadge
                        status={student.status}
                        label={tStudents(`status.${student.status}`)}
                      />
                      <Button
                        nativeButton={false}
                        variant="ghost"
                        size="sm"
                        className="hidden h-7 px-2 text-xs sm:inline-flex"
                        render={<Link href={`/students/${student.id}`} />}
                      >
                        {t("viewProfile")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-border/60 p-3 text-center">
              <Link
                href="/students"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {tStudents("title")} →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Academic Term Roadmap & Milestone Tracker (Span 5) */}
        <Card className="flex flex-col justify-between border-border/80 lg:col-span-5">
          <div>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
                  {t("calendarMilestones")}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-xs">
                  {t("termRoadmap")}
                  <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/40 px-1.5 py-0.5 text-[10px] font-medium normal-case text-muted-foreground">
                    <Sparkles className="size-2.5" />
                    {t("previewData")}
                  </span>
                </CardDescription>
              </div>
              <span className="rounded-full border border-[#FBF3DB] bg-[#FBF3DB] px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-[#956400] uppercase">
                {t("termOne")}
              </span>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {/* Term Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Session Progress</span>
                  <span className="font-mono font-medium text-foreground">53%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-foreground" style={{ width: "53%" }} />
                </div>
                <p className="text-[11px] text-muted-foreground">{t("dayProgress")}</p>
              </div>

              {/* Milestone Timeline */}
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs">
                  <div className="mt-0.5 rounded border border-[#FBF3DB] bg-[#FBF3DB] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#956400]">
                    OCT 15
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">Mid-Term Assessment Window</p>
                    <p className="text-[11px] text-muted-foreground">Written & Practical examinations across Classes 1-10</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs">
                  <div className="mt-0.5 rounded border border-[#E1F3FE] bg-[#E1F3FE] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#1F6C9F]">
                    NOV 02
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">Parent-Teacher Progress Reviews</p>
                    <p className="text-[11px] text-muted-foreground">Comprehensive academic evaluation distribution</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs">
                  <div className="mt-0.5 rounded border border-[#EDF3EC] bg-[#EDF3EC] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#346538]">
                    NOV 24
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">Annual Science & Culture Fair</p>
                    <p className="text-[11px] text-muted-foreground">Inter-house exhibits and innovation showcases</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>

          <div className="border-t border-border/60 p-4">
            <Link
              href="/exams"
              className="group flex items-center justify-between text-xs font-medium text-foreground hover:underline"
            >
              <span>{t("viewExams")}</span>
              <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* ── Lower Bento Row: Financial Ledger & Official Bulletins ─────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Card 6: Fee Collection Ledger Snapshot (Span 6) */}
        <Card className="flex flex-col justify-between border-border/80 lg:col-span-6">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-5 py-4">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
                {t("feeLedger")}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 text-xs">
                {t("collectionEfficiency")}
                <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/40 px-1.5 py-0.5 text-[10px] font-medium normal-case text-muted-foreground">
                  <Sparkles className="size-2.5" />
                  {t("previewData")}
                </span>
              </CardDescription>
            </div>
            <span className="rounded-full border border-[#FBF3DB] bg-[#FBF3DB] px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-[#956400] uppercase">
              {t("fiscalYear")}
            </span>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("todaysReceipts")}
                </p>
                <p className="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  ৳ 48,500
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#346538]">
                  <CheckCircle2 className="size-3" />
                  {t("reconciled")}
                </span>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("pendingDues")}
                </p>
                <p className="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  ৳ 14,200
                </p>
                <span className="text-[11px] text-[#956400]">
                  {t("pendingCount", { count: 3 })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Collection Health: <span className="font-mono font-medium text-foreground">94.8% on target</span></span>
              <span className="font-mono">FY 2026</span>
            </div>
          </CardContent>
          <div className="border-t border-border/60 p-4">
            <Link
              href="/fees"
              className="group flex items-center justify-between text-xs font-medium text-foreground hover:underline"
            >
              <span>{t("launchCounter")}</span>
              <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </Card>

        {/* Card 7: Campus Bulletins & Announcements (Span 6) */}
        <Card className="flex flex-col justify-between border-border/80 lg:col-span-6">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-5 py-4">
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
                {t("bulletins")}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 text-xs">
                Official institutional communications
                <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/40 px-1.5 py-0.5 text-[10px] font-medium normal-case text-muted-foreground">
                  <Sparkles className="size-2.5" />
                  {t("previewData")}
                </span>
              </CardDescription>
            </div>
            <span className="rounded-full border border-[#E1F3FE] bg-[#E1F3FE] px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-[#1F6C9F] uppercase">
              3 Active
            </span>
          </CardHeader>
          <CardContent className="space-y-2.5 p-5">
            <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3 text-xs transition-colors hover:bg-muted/20">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Digital Attendance Sheet Deployment</p>
                <p className="text-[11px] text-muted-foreground">Teachers are requested to verify daily section registers</p>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">Today</span>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3 text-xs transition-colors hover:bg-muted/20">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">First Term Examination Routine Finalized</p>
                <p className="text-[11px] text-muted-foreground">Approved syllabus and seating arrangement released</p>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">Yesterday</span>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3 text-xs transition-colors hover:bg-muted/20">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Campus ICT & Network Maintenance</p>
                <p className="text-[11px] text-muted-foreground">Scheduled routine maintenance window this Friday</p>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">Sep 11</span>
            </div>
          </CardContent>
          <div className="border-t border-border/60 p-4">
            <Link
              href="/notices"
              className="group flex items-center justify-between text-xs font-medium text-foreground hover:underline"
            >
              <span>{t("postNotice")}</span>
              <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* ── Bottom Section: Keyboard-Accelerated Quick Actions ──────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {t("quickActionsTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("quickActionsSubtitle")}
            </p>
          </div>
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {t("allSystemsNominal")}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <QuickAction key={action.label} {...action} />
          ))}
        </div>
      </div>
    </div>
  )
}
