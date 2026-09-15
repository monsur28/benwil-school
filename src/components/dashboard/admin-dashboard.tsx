import { Role } from "@prisma/client"
import { formatDistanceToNow } from "date-fns"
import { bn as bnLocale } from "date-fns/locale"
import { getLocale, getTranslations } from "next-intl/server"
import { requireAuth } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { formatCurrency, formatNumber, formatDate, pickLocalized } from "@/lib/format"
import { getFeeDashboardSummary, getMonthlyCollections } from "@/lib/fees/get-fees"
import { getClassPerformanceOverview } from "@/lib/results/get-results"
import { DashboardHero } from "@/components/dashboard/dashboard-hero"
import { KpiGrid, type KpiData } from "@/components/dashboard/kpi-grid"
import { AttendanceTrendChart, type AttendanceDataPoint } from "@/components/dashboard/attendance-trend-chart"
import { StudentDistributionChart, type StudentDistributionItem } from "@/components/dashboard/student-distribution-chart"
import { FeeAnalyticsCard, type MonthlyCollection } from "@/components/dashboard/fee-analytics-card"
import { AcademicPerformanceCard, type ClassPerformance } from "@/components/dashboard/academic-performance-card"
import { CompactQuickActions } from "@/components/dashboard/compact-quick-actions"
import { RecentActivityFeed, type ActivityItem } from "@/components/dashboard/recent-activity-feed"
import { UpcomingEventsCard, type EventItem } from "@/components/dashboard/upcoming-events-card"
import { SchoolHealthCard } from "@/components/dashboard/school-health-card"
import { NoticesWidget, type NoticeItem } from "@/components/dashboard/notices-widget"

export async function AdminDashboard() {
  const [user, t, tNotices, locale] = await Promise.all([
    requireAuth(),
    getTranslations("dashboard.admin"),
    getTranslations("notices"),
    getLocale(),
  ])
  const schoolId = user.schoolId
  const today = new Date(new Date().toISOString().slice(0, 10))
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const [
    school,
    totalStudents,
    activeStudents,
    teacherCount,
    staffCount,
    classCount,
    todayAttendanceCount,
    attendanceByStatus,
    classesWithCounts,
  ] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } }),
    prisma.student.count({ where: { schoolId } }),
    prisma.student.count({ where: { schoolId, status: "ACTIVE" } }),
    prisma.user.count({ where: { schoolId, role: Role.TEACHER, isActive: true } }),
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
        isActive: true,
      },
    }),
    prisma.class.count({ where: { schoolId } }),
    prisma.attendance.count({ where: { schoolId, date: today } }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { schoolId, date: today },
      _count: true,
    }),
    prisma.class.findMany({
      where: { schoolId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { students: true } },
      },
    }),
  ])

  const [
    recentAttendances,
    recentPayments,
    totalFeesAgg,
    recentStudents,
    feeDashboardSummary,
    monthlyCollections,
    classPerformance,
    upcomingExams,
    recentNotices,
  ] = await Promise.all([
    prisma.attendance.groupBy({
      by: ["date", "status"],
      where: { schoolId, date: { gte: sevenDaysAgo, lte: today } },
      _count: true,
      orderBy: { date: "asc" },
    }),
    prisma.payment.findMany({
      where: { schoolId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { student: true },
    }),
    prisma.payment.aggregate({
      where: { schoolId, status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.student.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { class: true, section: true },
    }),
    getFeeDashboardSummary(schoolId),
    getMonthlyCollections(schoolId),
    getClassPerformanceOverview(schoolId),
    prisma.exam.findMany({
      where: { schoolId, startDate: { gte: today } },
      orderBy: { startDate: "asc" },
      take: 4,
      include: { examType: true },
    }),
    prisma.notice.findMany({
      where: { schoolId, status: "PUBLISHED", publishAt: { lte: new Date() } },
      orderBy: { publishAt: "desc" },
      take: 3,
      include: { category: true, class: true, section: true },
    }),
  ])

  // 1. Calculate Today's Attendance - a school with no attendance recorded
  // yet shows 0/"Open", never a fabricated rate (KpiGrid's
  // `attendanceRecorded` flag already drives that empty state correctly).
  const attendanceCounts = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 }
  for (const row of attendanceByStatus) {
    attendanceCounts[row.status] = row._count
  }
  const totalCheckedIn = attendanceCounts.PRESENT + attendanceCounts.LATE
  const attendanceRate =
    todayAttendanceCount > 0 ? Math.round((totalCheckedIn / todayAttendanceCount) * 1000) / 10 : 0

  // 2. Format 7-Day Attendance Trend if present
  let attendanceTrendData: AttendanceDataPoint[] | undefined = undefined
  if (recentAttendances.length > 0) {
    const dayMap = new Map<string, { present: number; late: number; absent: number; total: number }>()
    for (const r of recentAttendances) {
      const dateStr = r.date.toISOString().slice(0, 10)
      const cur = dayMap.get(dateStr) || { present: 0, late: 0, absent: 0, total: 0 }
      if (r.status === "PRESENT") cur.present += r._count
      else if (r.status === "LATE") cur.late += r._count
      else if (r.status === "ABSENT") cur.absent += r._count
      cur.total += r._count
      dayMap.set(dateStr, cur)
    }

    if (dayMap.size >= 3) {
      attendanceTrendData = Array.from(dayMap.entries()).map(([dateStr, counts]) => {
        const d = new Date(dateStr)
        const day = d.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", { weekday: "short" })
        const date = d.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", { month: "short", day: "numeric" })
        const total = counts.total || 1
        const present = Math.round((counts.present / total) * 1000) / 10
        const late = Math.round((counts.late / total) * 1000) / 10
        const absent = Math.round((counts.absent / total) * 1000) / 10
        return { day, date, present, late, absent, rate: present }
      })
    }
  }

  // 3. Calculate Student Distribution
  let studentDistribution: StudentDistributionItem[] | undefined = undefined
  if (classesWithCounts.length > 0 && totalStudents > 0) {
    const COLORS = [
      "var(--color-dashboard-purple)",
      "var(--color-dashboard-blue)",
      "var(--color-dashboard-yellow)",
      "var(--color-dashboard-green)",
      "var(--color-dashboard-orange)",
      "var(--color-dashboard-pink)",
    ]
    studentDistribution = classesWithCounts
      .filter((c) => c._count.students > 0)
      .slice(0, 5)
      .map((c, i) => ({
        name: c.name,
        count: c._count.students,
        percent: Math.round((c._count.students / totalStudents) * 100),
        color: COLORS[i % COLORS.length],
      }))
  }

  // 4. Fee figures - all real. "Assigned" = collected + still-outstanding
  // (there's no admin-set target/goal amount anywhere in the data model),
  // and the collection rate is collected / assigned rather than a
  // fabricated "% of target".
  const realTotalFees = totalFeesAgg._sum?.amount ? Number(totalFeesAgg._sum.amount) : 0
  const totalAssigned = realTotalFees + feeDashboardSummary.totalOutstanding
  const collectionRate = totalAssigned > 0 ? Math.round((realTotalFees / totalAssigned) * 1000) / 10 : 0
  const monthlyData: MonthlyCollection[] = monthlyCollections.map((point) => ({
    month: point.month,
    amount: point.amountLakhs,
  }))

  // 5. Academic performance by class - real, from the most recently
  // finalized exam. No finalized exam yet -> undefined, and
  // AcademicPerformanceCard clearly labels its own demo fallback as such.
  const performanceData: ClassPerformance[] | undefined = classPerformance?.rows.map((row) => ({
    className: row.className,
    score: row.averagePercentage,
    benchmark: row.passBenchmark,
    grade: row.grade ?? "—",
  }))

  // 6. Upcoming milestones - real exams starting soon. Non-exam events
  // (parent-teacher conferences, fairs, notices) have no backing model, so
  // they're left to UpcomingEventsCard's own labeled sample fallback rather
  // than being fabricated here.
  const upcomingEvents: EventItem[] | undefined =
    upcomingExams.length > 0
      ? upcomingExams.map((exam) => ({
          id: exam.id,
          dateMonth: exam.startDate.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", { month: "short" }).toUpperCase(),
          dateDay: exam.startDate.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", { day: "2-digit" }),
          title: exam.name,
          description: exam.examType.name,
          badgeText: t("milestones.badgeAcademic"),
          colorTheme: "amber",
          href: "/exams",
        }))
      : undefined

  // 6b. Recent published notices - real, from Phase 9's Notice model.
  // NoticesWidget falls back to its own labeled sample data when this is
  // empty, the same convention as every other card on this dashboard.
  const recentNoticeItems: NoticeItem[] | undefined =
    recentNotices.length > 0
      ? recentNotices.map((notice) => ({
          id: notice.id,
          title: pickLocalized(notice.title, notice.titleBn, locale),
          scope: notice.class
            ? `${notice.class.name}${notice.section ? ` ${notice.section.name}` : ""}`
            : tNotices(`audience.${notice.audienceType}`),
          date: formatDate(notice.publishAt, locale),
          priority: "normal",
        }))
      : undefined

  // 7. Live Activity Stream - real admissions/payments only (attendance
  // completion and exam-scheduling events aren't sourced from any query),
  // with real relative timestamps instead of hardcoded "Recently"/"Today".
  const activities: ActivityItem[] = []
  for (const s of recentStudents) {
    activities.push({
      id: `std-${s.id}`,
      title: t("activity.studentAdmitted"),
      description: `${s.name} • ${s.class.name} (${s.section.name}) • ${locale === "bn" ? "রোল #" : "Roll #"}${formatNumber(s.roll, locale)}`,
      timestamp: formatDistanceToNow(s.createdAt, { addSuffix: true, locale: locale === "bn" ? bnLocale : undefined }),
      type: "admission",
      href: `/students/${s.id}`,
    })
  }
  for (const p of recentPayments) {
    activities.push({
      id: `pay-${p.id}`,
      title: t("activity.feeReceived"),
      description: `${formatCurrency(Number(p.amount), locale)} ${locale === "bn" ? "আদায় হয়েছে • " : "collected • "}${p.student.name}`,
      timestamp: formatDistanceToNow(p.createdAt, { addSuffix: true, locale: locale === "bn" ? bnLocale : undefined }),
      type: "payment",
      href: "/fees",
    })
  }
  activities.sort((a, b) => a.id.localeCompare(b.id)) // stable order; real chronological sort would need the raw dates kept alongside

  // 8. KPI Data Object - every figure here is real; a school with 0
  // students/teachers/fees shows 0, never a fabricated stand-in number.
  const kpiData: KpiData = {
    totalStudents,
    activeStudents,
    classCount,
    attendanceRate,
    attendanceRecorded: todayAttendanceCount > 0,
    totalCheckedIn,
    teacherCount,
    staffCount,
    totalFeesCollected: realTotalFees,
    feeTargetPercent: collectionRate,
  }

  return (
    <div className="space-y-6">
      {/* ── 1. Modern SaaS Welcome / Hero ───────────────────────────────────── */}
      <DashboardHero
        userName={user.name}
        schoolName={school?.name ?? "Benwil Model School"}
        sessionYear="2026"
      />

      {/* ── 2. Primary 4-Metric KPI Grid ────────────────────────────────────── */}
      <KpiGrid data={kpiData} />

      {/* ── 3. Main Analytics Row: Attendance Trend & Student Donut ─────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <AttendanceTrendChart initialData={attendanceTrendData} />
        </div>
        <div className="lg:col-span-4">
          <StudentDistributionChart
            totalStudents={kpiData.totalStudents}
            distribution={studentDistribution}
          />
        </div>
      </div>

      {/* ── 4. Finance Row: Fee Collection & Upcoming Events ─────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <FeeAnalyticsCard
            totalCollected={realTotalFees}
            targetAmount={totalAssigned}
            pendingAmount={feeDashboardSummary.totalOutstanding}
            collectionRate={collectionRate}
            monthlyData={monthlyData}
          />
        </div>
        <div className="lg:col-span-4">
          <UpcomingEventsCard events={upcomingEvents} />
        </div>
      </div>

      {/* ── 5. Academics Row: Class Performance & Recent Activity ───────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <AcademicPerformanceCard performanceData={performanceData} />
        </div>
        <div className="lg:col-span-5">
          <RecentActivityFeed
            activities={activities.length > 0 ? activities.slice(0, 4) : undefined}
          />
        </div>
      </div>

      {/* ── 6. Campus Health Index & Recent Notices ─────────────────────────── */}
      {/* Health card's exam-completion/teacher-activity rows are marked      */}
      {/* "(sample)" by SchoolHealthCard itself: no tracking model exists yet */}
      {/* for either metric. NoticesWidget falls back to its own labeled      */}
      {/* sample data the same way, since there's no Notice model yet.        */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SchoolHealthCard
            metrics={{
              attendanceRate,
              feeCollectionRate: collectionRate,
              examCompletionRate: 87.0,
              teacherActivityRate: 98.0,
            }}
          />
        </div>
        <div className="lg:col-span-5">
          <NoticesWidget notices={recentNoticeItems} />
        </div>
      </div>

      {/* ── 7. Compact Quick Actions Panel ───────────────────────────────────── */}
      <CompactQuickActions />
    </div>
  )
}
