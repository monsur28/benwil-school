import { Role } from "@prisma/client"
import { formatDistanceToNow } from "date-fns"
import { bn as bnLocale } from "date-fns/locale"
import { getLocale, getTranslations } from "next-intl/server"
import { requireAuth } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getSchoolIdentity } from "@/lib/settings/school-settings"
import { formatCurrency, formatNumber, formatDate, pickLocalized } from "@/lib/format"
import { getFeeDashboardSummary, getMonthlyCollections } from "@/lib/fees/get-fees"
import { DashboardHero } from "@/components/dashboard/dashboard-hero"
import { KpiGrid, type KpiData } from "@/components/dashboard/kpi-grid"
import { AttendanceTrendChart, type AttendanceDataPoint } from "@/components/dashboard/attendance-trend-chart"
import { FeeAnalyticsCard, type MonthlyCollection } from "@/components/dashboard/fee-analytics-card"
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
    identity,
    activeAcademicYear,
    totalStudents,
    activeStudents,
    teacherCount,
    staffCount,
    classCount,
    todayAttendanceCount,
    attendanceByStatus,
  ] = await Promise.all([
    getSchoolIdentity(schoolId),
    prisma.academicYear.findFirst({ where: { schoolId, isActive: true }, select: { name: true } }),
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
  ])

  const [
    recentAttendances,
    recentPayments,
    totalFeesAgg,
    recentStudents,
    feeDashboardSummary,
    monthlyCollections,
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

  // 3. Fee figures
  const realTotalFees = totalFeesAgg._sum?.amount ? Number(totalFeesAgg._sum.amount) : 0
  const totalAssigned = realTotalFees + feeDashboardSummary.totalOutstanding
  const collectionRate = totalAssigned > 0 ? Math.round((realTotalFees / totalAssigned) * 1000) / 10 : 0
  const monthlyData: MonthlyCollection[] = monthlyCollections.map((point) => ({
    month: point.month,
    amount: point.amountLakhs,
  }))

  // 4. Upcoming milestones
  const upcomingEvents: EventItem[] | undefined =
    upcomingExams.length > 0
      ? upcomingExams.map((exam) => ({
          id: exam.id,
          dateMonth: exam.startDate.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", { month: "short" }).toUpperCase(),
          dateDay: exam.startDate.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", { day: "2-digit" }),
          title: exam.name,
          description: exam.examType.name,
          badgeText: t("milestones.badgeAcademic", { fallback: "Academic" }),
          colorTheme: "amber",
          href: "/exams",
        }))
      : undefined

  // 5. Recent published notices
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

  // 6. Live Activity Stream
  const activities: ActivityItem[] = []
  for (const s of recentStudents) {
    activities.push({
      id: `std-${s.id}`,
      title: t("activity.studentAdmitted", { fallback: "New Student Admitted" }),
      description: `${s.name} - ${s.class.name} (${s.section.name}) - Roll #${formatNumber(s.roll, locale)}`,
      timestamp: formatDistanceToNow(s.createdAt, { addSuffix: true, locale: locale === "bn" ? bnLocale : undefined }),
      type: "admission",
      href: `/students/${s.id}`,
    })
  }
  for (const p of recentPayments) {
    activities.push({
      id: `pay-${p.id}`,
      title: t("activity.feeReceived", { fallback: "Fee Payment Received" }),
      description: `${formatCurrency(Number(p.amount), locale)} - ${p.student.name}`,
      timestamp: formatDistanceToNow(p.createdAt, { addSuffix: true, locale: locale === "bn" ? bnLocale : undefined }),
      type: "payment",
      href: "/fees",
    })
  }
  activities.sort((a, b) => a.id.localeCompare(b.id))

  // 7. KPI Data Object
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
    /*
     * Dashboard composition, top to bottom — ordered by the questions a head
     * teacher asks on arriving, not by widget type:
     *
     *   1. Where am I, and what is today?        → greeting band (no chrome)
     *   2. What are the four headline numbers?   → one divided metric band
     *   3. What can I start right now?           → quiet shortcut chips
     *   4. How is attendance, what is announced? → chart + notice board
     *   5. What is the money doing?              → full-width finance panel
     *   6. What just happened, and how are we?   → schedule / activity / health
     *
     * Deliberately varied: a plain section, a divided band, a chip row, and
     * panels of three different internal structures (chart, list, timeline).
     */
    <div className="space-y-10 pb-4">
      <DashboardHero
        userName={user.name}
        schoolName={identity.schoolName}
        sessionYear={activeAcademicYear?.name ?? ""}
      />

      <div className="space-y-6">
        <KpiGrid data={kpiData} />
        <CompactQuickActions />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          <AttendanceTrendChart initialData={attendanceTrendData} />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <NoticesWidget notices={recentNoticeItems} />
        </div>
      </div>

      <FeeAnalyticsCard
        totalCollected={realTotalFees}
        targetAmount={totalAssigned}
        pendingAmount={feeDashboardSummary.totalOutstanding}
        collectionRate={collectionRate}
        monthlyData={monthlyData}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <UpcomingEventsCard events={upcomingEvents} />
        <RecentActivityFeed activities={activities} />
        <SchoolHealthCard
          metrics={{
            attendanceRate,
            feeCollectionRate: collectionRate,
            examCompletionRate: 87.0,
            teacherActivityRate: 98.0,
          }}
        />
      </div>
    </div>
  )
}
