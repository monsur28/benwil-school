import { Role } from "@prisma/client"
import { getLocale, getTranslations } from "next-intl/server"
import { requireAuth } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getSchoolIdentity } from "@/lib/settings/school-settings"
import { formatCurrency, formatNumber, formatDate, pickLocalized } from "@/lib/format"
import { getFeeDashboardSummary, getMonthlyCollections } from "@/lib/fees/get-fees"
import {
  bucketRates,
  getAttendanceSeries,
  getAttentionSignals,
  type AttendanceBucket,
} from "@/lib/dashboard/get-dashboard-signals"
import { DashboardHero } from "@/components/dashboard/dashboard-hero"
import { AttentionPanel } from "@/components/dashboard/attention-panel"
import { KpiGrid, type KpiData } from "@/components/dashboard/kpi-grid"
import {
  AttendanceTrendChart,
  type AttendanceDataPoint,
  type AttendanceTodaySummary,
} from "@/components/dashboard/attendance-trend-chart"
import { FeeAnalyticsCard, type MonthlyCollection } from "@/components/dashboard/fee-analytics-card"
import { RecentActivityFeed, type ActivityGroup, type ActivityItem } from "@/components/dashboard/recent-activity-feed"
import { UpcomingEventsCard, type EventItem } from "@/components/dashboard/upcoming-events-card"
import { SchoolHealthCard } from "@/components/dashboard/school-health-card"
import { NoticesWidget, type NoticeItem } from "@/components/dashboard/notices-widget"

const DAY_MS = 86_400_000

export async function AdminDashboard() {
  const [user, t, tNotices, locale] = await Promise.all([
    requireAuth(),
    getTranslations("dashboard.admin"),
    getTranslations("notices"),
    getLocale(),
  ])
  const schoolId = user.schoolId
  const intlLocale = locale === "bn" ? "bn-BD" : "en-US"
  const today = new Date(new Date().toISOString().slice(0, 10))

  const activeAcademicYear = await prisma.academicYear.findFirst({
    where: { schoolId, isActive: true },
    select: { id: true, name: true },
  })
  const academicYearId = activeAcademicYear?.id ?? null

  const [
    identity,
    totalStudents,
    activeStudents,
    teacherCount,
    staffCount,
    classCount,
    attendanceByStatus,
    attendanceSeries,
    feeDashboardSummary,
    finishedExamsByStatus,
  ] = await Promise.all([
    getSchoolIdentity(schoolId),
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
    prisma.attendance.groupBy({ by: ["status"], where: { schoolId, date: today }, _count: true }),
    getAttendanceSeries({ schoolId, academicYearId }),
    getFeeDashboardSummary(schoolId),
    // One grouped read answers both questions the page asks about finished
    // exams: how many are published (the health reading) and how many are not
    // (the attention row).
    prisma.exam.groupBy({
      by: ["resultStatus"],
      where: {
        schoolId,
        isActive: true,
        endDate: { lt: today },
        ...(academicYearId ? { academicYearId } : {}),
      },
      _count: true,
    }),
  ])

  const finishedExamCount = finishedExamsByStatus.reduce((sum, row) => sum + row._count, 0)
  const publishedExamCount =
    finishedExamsByStatus.find((row) => row.resultStatus === "FINALIZED")?._count ?? 0
  const unpublishedExamCount = finishedExamCount - publishedExamCount

  const [
    recentPayments,
    totalFeesAgg,
    recentStudents,
    monthlyCollections,
    upcomingExams,
    recentNotices,
    attentionSignals,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: { schoolId, status: "COMPLETED" },
      orderBy: { paidAt: "desc" },
      take: 5,
      include: { student: { select: { id: true, name: true } } },
    }),
    prisma.payment.aggregate({
      where: { schoolId, status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.student.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { class: { select: { name: true } }, section: { select: { name: true } } },
    }),
    getMonthlyCollections(schoolId),
    prisma.exam.findMany({
      where: { schoolId, isActive: true, startDate: { gte: today } },
      orderBy: { startDate: "asc" },
      take: 4,
      include: { examType: { select: { name: true } } },
    }),
    prisma.notice.findMany({
      where: { schoolId, status: "PUBLISHED", publishAt: { lte: new Date() } },
      orderBy: { publishAt: "desc" },
      take: 4,
      include: { class: { select: { name: true } }, section: { select: { name: true } } },
    }),
    // Reuses the fee summary resolved above rather than re-reading it: the
    // outstanding totals are the expensive part of that query.
    getAttentionSignals({
      schoolId,
      academicYearId,
      totalOutstanding: feeDashboardSummary.totalOutstanding,
      studentsWithOutstandingCount: feeDashboardSummary.studentsWithOutstandingCount,
      unpublishedResults: unpublishedExamCount,
    }),
  ])

  // ---- 1. Today's attendance ------------------------------------------------
  // A school with no register yet shows "Open", never a fabricated rate.
  const attendanceCounts = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 }
  for (const row of attendanceByStatus) attendanceCounts[row.status] = row._count
  const todayRecorded =
    attendanceCounts.PRESENT + attendanceCounts.ABSENT + attendanceCounts.LATE + attendanceCounts.LEAVE
  const totalCheckedIn = attendanceCounts.PRESENT + attendanceCounts.LATE
  const rate = (part: number) =>
    todayRecorded > 0 ? Math.round((part / todayRecorded) * 1000) / 10 : 0
  const attendanceRate = rate(totalCheckedIn)

  const todaySummary: AttendanceTodaySummary | null =
    todayRecorded > 0
      ? {
          rate: attendanceRate,
          present: rate(attendanceCounts.PRESENT),
          late: rate(attendanceCounts.LATE),
          absent: rate(attendanceCounts.ABSENT),
        }
      : null

  // ---- 2. Attendance trend --------------------------------------------------
  const weekday = (date: Date) => new Intl.DateTimeFormat(intlLocale, { weekday: "short" }).format(date)
  const dayMonth = (date: Date) =>
    new Intl.DateTimeFormat(intlLocale, { month: "short", day: "numeric" }).format(date)
  const monthLabel = (date: Date) => new Intl.DateTimeFormat(intlLocale, { month: "short" }).format(date)

  const toPoints = (
    buckets: AttendanceBucket[],
    label: (bucket: AttendanceBucket) => { day: string; date: string }
  ): AttendanceDataPoint[] =>
    buckets.flatMap((bucket) => {
      const rates = bucketRates(bucket)
      if (!rates) return []
      return [{ ...label(bucket), ...rates }]
    })

  const attendanceChartSeries = {
    sevenDay: toPoints(attendanceSeries.sevenDay, (b) => ({
      day: weekday(b.start),
      date: dayMonth(b.start),
    })),
    thirtyDay: toPoints(attendanceSeries.thirtyDay, (b) => ({
      day: dayMonth(b.start),
      date: `${dayMonth(b.start)} – ${dayMonth(b.end)}`,
    })),
    term: toPoints(attendanceSeries.term, (b) => ({
      day: monthLabel(b.start),
      date: new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(b.start),
    })),
  }

  // The delta compares today with the previous day a register was actually
  // taken — not "yesterday", which may have been a holiday.
  const recordedDays = attendanceSeries.sevenDay.filter((bucket) => bucket.total > 0)
  const latest = recordedDays.at(-1)
  const previous = recordedDays.at(-2)
  const latestIsToday = latest ? latest.start.getTime() === today.getTime() : false
  const latestRates = latest && bucketRates(latest)
  const previousRates = previous && bucketRates(previous)
  const attendanceDelta =
    latestIsToday && latestRates && previousRates && previous
      ? {
          points: Math.round((latestRates.present + latestRates.late - previousRates.present - previousRates.late) * 10) / 10,
          sinceLabel: weekday(previous.start),
        }
      : null

  // ---- 3. Fees --------------------------------------------------------------
  const realTotalFees = totalFeesAgg._sum?.amount ? Number(totalFeesAgg._sum.amount) : 0
  const totalAssigned = realTotalFees + feeDashboardSummary.totalOutstanding
  const collectionRate = totalAssigned > 0 ? Math.round((realTotalFees / totalAssigned) * 1000) / 10 : 0

  const monthlyData: MonthlyCollection[] = monthlyCollections.map((point) => ({
    month: monthLabel(point.monthStart),
    amount: point.amountLakhs,
  }))
  const monthsRangeLabel =
    monthlyCollections.length > 0
      ? `${monthLabel(monthlyCollections[0].monthStart)} – ${monthLabel(monthlyCollections.at(-1)!.monthStart)}`
      : ""

  // Month-on-month needs a base month that actually took money; without one
  // there is no percentage to state, so the tile shows the raw figure instead.
  const thisMonth = monthlyCollections.at(-1)?.amount ?? 0
  const lastMonth = monthlyCollections.at(-2)?.amount ?? 0
  const feeMonthDelta =
    lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 1000) / 10 : null

  // ---- 4. Upcoming milestones ----------------------------------------------
  const THEMES = ["amber", "blue", "emerald", "purple"] as const
  const upcomingEvents: EventItem[] = upcomingExams.map((exam, index) => ({
    id: exam.id,
    dateMonth: new Intl.DateTimeFormat(intlLocale, { month: "short" }).format(exam.startDate).toUpperCase(),
    dateDay: new Intl.DateTimeFormat(intlLocale, { day: "2-digit" }).format(exam.startDate),
    title: pickLocalized(exam.name, exam.nameBn, locale),
    description: exam.examType.name,
    badgeText: t("milestones.badgeAcademic"),
    colorTheme: THEMES[index % THEMES.length],
    href: "/exams",
    daysAway: Math.round((exam.startDate.getTime() - today.getTime()) / DAY_MS),
  }))

  // ---- 5. Recent notices ----------------------------------------------------
  const recentNoticeItems: NoticeItem[] = recentNotices.map((notice) => ({
    id: notice.id,
    title: pickLocalized(notice.title, notice.titleBn, locale),
    scope: notice.class
      ? `${notice.class.name}${notice.section ? ` ${notice.section.name}` : ""}`
      : tNotices(`audience.${notice.audienceType}`),
    date: formatDate(notice.publishAt, locale),
    priority: "normal",
    // The category indicator is the notice's own audience, not a guess.
    audience: notice.audienceType,
  }))

  // ---- 6. Activity stream ---------------------------------------------------
  const clock = new Intl.DateTimeFormat(intlLocale, { hour: "numeric", minute: "2-digit" })
  const groupOf = (at: Date): ActivityGroup => {
    const day = new Date(at.toISOString().slice(0, 10)).getTime()
    const diff = Math.round((today.getTime() - day) / DAY_MS)
    return diff <= 0 ? "today" : diff === 1 ? "yesterday" : "earlier"
  }

  const activityRecords: (ActivityItem & { at: Date })[] = [
    ...recentStudents.map((student) => ({
      id: `std-${student.id}`,
      at: student.createdAt,
      title: t("activity.studentAdmitted"),
      description: `${student.name} · ${student.class.name} (${student.section.name}) · ${t("activity.roll", { roll: formatNumber(student.roll, locale) })}`,
      time: clock.format(student.createdAt),
      group: groupOf(student.createdAt),
      type: "admission" as const,
      href: `/students/${student.id}`,
    })),
    ...recentPayments.map((payment) => ({
      id: `pay-${payment.id}`,
      at: payment.paidAt,
      title: t("activity.feeReceived"),
      description: `${formatCurrency(Number(payment.amount), locale)} · ${payment.student.name}`,
      time: clock.format(payment.paidAt),
      group: groupOf(payment.paidAt),
      type: "payment" as const,
      href: `/fees/student/${payment.student.id}`,
    })),
    ...recentNotices.map((notice) => ({
      id: `not-${notice.id}`,
      at: notice.publishAt,
      title: t("activity.noticePublished"),
      description: pickLocalized(notice.title, notice.titleBn, locale),
      time: clock.format(notice.publishAt),
      group: groupOf(notice.publishAt),
      type: "notice" as const,
      href: "/notices",
    })),
  ]

  const activities: ActivityItem[] = activityRecords
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 7)
    .map((record) => ({
      id: record.id,
      title: record.title,
      description: record.description,
      time: record.time,
      group: record.group,
      type: record.type,
      href: record.href,
    }))

  // ---- 7. KPI + health ------------------------------------------------------
  const kpiData: KpiData = {
    totalStudents,
    activeStudents,
    classCount,
    attendanceRecorded: todayRecorded > 0,
    attendanceRate,
    totalCheckedIn,
    sectionsRecorded: attentionSignals.register.totalSections - attentionSignals.register.pendingSections,
    totalSections: attentionSignals.register.totalSections,
    attendanceDelta,
    teacherCount,
    staffCount,
    totalFeesCollected: realTotalFees,
    feeTargetPercent: collectionRate,
    feeMonthDelta,
    collectedThisMonth: feeDashboardSummary.paymentsThisMonthAmount,
  }

  return (
    /*
     * Composition, top to bottom — ordered by the questions a head teacher
     * asks on arriving, not by widget type:
     *
     *   1. Where am I, and what is today?        → greeting band (no chrome)
     *   2. What needs me?                        → needs attention (P0)
     *   3. What are the headline numbers?        → one divided metric band
     *   4. What can I start right now?           → shortcut tiles
     *   5. Is attendance healthy, what's posted? → chart + notice board
     *   6. Are we on track financially?          → full-width finance panel
     *   7. What just happened, is anything off?  → calendar / activity / health
     *
     * Attention sits above the metrics deliberately: a number tells a
     * principal how the school is, an action tells them what to do about it.
     */
    <div className="space-y-8 pb-4">
      <DashboardHero
        userName={user.name}
        schoolName={identity.schoolName}
        sessionYear={activeAcademicYear?.name ?? ""}
        totalStudents={totalStudents}
        classCount={classCount}
        teacherCount={teacherCount + staffCount}
        attendanceRate={todayRecorded > 0 ? attendanceRate : null}
      />

      <div className="space-y-6">
        <AttentionPanel
          signals={attentionSignals}
          currencyAmount={formatCurrency(attentionSignals.dues.amount, locale)}
        />
        <KpiGrid data={kpiData} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          <AttendanceTrendChart
            series={attendanceChartSeries}
            today={todaySummary}
            delta={attendanceDelta}
          />
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
        monthsRangeLabel={monthsRangeLabel}
        monthDelta={feeMonthDelta}
      />

      {/* items-start: a panel holding one exam takes the height of one exam.
          Padding it out to match its neighbours would buy alignment with a
          screenful of nothing. */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <UpcomingEventsCard events={upcomingEvents} />
        <RecentActivityFeed activities={activities} />
        <SchoolHealthCard
          metrics={{
            attendanceRate: todayRecorded > 0 ? attendanceRate : null,
            feeCollectionRate: collectionRate,
            resultPublicationRate:
              finishedExamCount > 0
                ? Math.round((publishedExamCount / finishedExamCount) * 1000) / 10
                : null,
            activeEnrolmentRate:
              totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 1000) / 10 : 0,
          }}
        />
      </div>
    </div>
  )
}
