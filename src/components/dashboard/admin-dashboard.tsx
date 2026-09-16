import { Role } from "@prisma/client"
import { formatDistanceToNow } from "date-fns"
import { bn as bnLocale } from "date-fns/locale"
import { getLocale, getTranslations } from "next-intl/server"
import { requireAuth } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getSchoolIdentity } from "@/lib/settings/school-settings"
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
    identity,
    activeAcademicYear,
    totalStudents,
    activeStudents,
    teacherCount,
    staffCount,
    classCount,
    todayAttendanceCount,
    attendanceByStatus,
    classesWithCounts,
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

  // 2. Generate Attention Items (Alerts)
  const attentionItems: AttentionItem[] = []
  
  if (attendanceRate > 0 && attendanceRate < 85) {
    attentionItems.push({
      id: "low-attendance",
      title: t("attention.lowAttendance", { fallback: "Low Attendance Alert" }),
      description: t("attention.lowAttendanceDesc", { rate: attendanceRate, fallback: `Campus attendance is currently at ${attendanceRate}%` }),
      type: "warning",
      href: "/attendance"
    })
  }

  // 3. Fee figures
  const realTotalFees = totalFeesAgg._sum?.amount ? Number(totalFeesAgg._sum.amount) : 0
  const totalAssigned = realTotalFees + feeDashboardSummary.totalOutstanding
  const collectionRate = totalAssigned > 0 ? Math.round((realTotalFees / totalAssigned) * 1000) / 10 : 0

  if (collectionRate > 0 && collectionRate < 60) {
    attentionItems.push({
      id: "low-fees",
      title: t("attention.lowFees", { fallback: "Fee Collection Below Target" }),
      description: t("attention.lowFeesDesc", { rate: collectionRate, fallback: `Only ${collectionRate}% of assigned fees collected.` }),
      type: "warning",
      href: "/fees"
    })
  }

  if (upcomingExams.length > 0) {
    const nextExam = upcomingExams[0]
    const daysUntil = Math.ceil((nextExam.startDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
    if (daysUntil <= 3) {
      attentionItems.push({
        id: "upcoming-exam",
        title: t("attention.upcomingExam", { fallback: "Upcoming Examination" }),
        description: t("attention.upcomingExamDesc", { exam: nextExam.name, days: daysUntil, fallback: `${nextExam.name} starts in ${daysUntil} days.` }),
        type: "info",
        href: "/exams"
      })
    }
  }

  // 4. Attendance Summary for the Attendance component
  const attendanceSummary: AttendanceSummary = {
    present: attendanceCounts.PRESENT,
    absent: attendanceCounts.ABSENT,
    late: attendanceCounts.LATE,
    leave: attendanceCounts.LEAVE,
    total: todayAttendanceCount,
  }

  // 5. Upcoming milestones
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

  // 6. Recent published notices
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

  // 7. Live Activity Stream
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

  // 8. KPI Data Object
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Hero / Welcome Section */}
      <DashboardHero
        userName={user.name}
        schoolName={identity.schoolName}
        sessionYear={activeAcademicYear?.name ?? ""}
      />

      {/* 2. Key Metrics Grid */}
      <KpiGrid data={kpiData} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Alerts, Attendance, Finance, Events */}
        <div className="lg:col-span-8 space-y-6">
          <SchoolHealthCard items={attentionItems} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AttendanceTrendChart data={attendanceSummary} />
            <FeeAnalyticsCard 
              totalCollected={realTotalFees}
              pendingAmount={feeDashboardSummary.totalOutstanding}
              collectionRate={collectionRate}
            />
          </div>
          
          <UpcomingEventsCard events={upcomingEvents} />
        </div>
        
        {/* Right Column: Notices, Activity, Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          <NoticesWidget notices={recentNoticeItems} />
          <RecentActivityFeed activities={activities} />
          <CompactQuickActions />
        </div>
      </div>
    </div>
  )
}
