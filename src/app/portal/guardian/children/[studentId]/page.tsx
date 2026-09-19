import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import {
  CalendarCheck,
  Award,
  Megaphone,
  NotebookPen,
  Wallet,
  GraduationCap,
  Users,
  Target,
  CalendarDays,
  ArrowRight,
} from "lucide-react"
import { requireGuardianIdentity, requireGuardianChild } from "@/lib/portal/identity"
import { getStudentAttendanceSummary } from "@/lib/attendance/get-attendance"
import { getStudentResultSummaries } from "@/lib/results/get-results"
import { getVisibleNoticesForGuardian } from "@/lib/notices/notice-visibility"
import { getVisibleHomeworkForStudent } from "@/lib/homework/homework-visibility"
import { getStudentFeeOverview } from "@/lib/fees/get-fees"
import { getSchoolIdentity } from "@/lib/settings/school-settings"
import { IconBadge } from "@/components/ui/icon-badge"
import { Badge } from "@/components/ui/badge"
import { formatDate, pickLocalized } from "@/lib/format"

export default async function GuardianChildDashboardPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { user, guardian, children } = await requireGuardianIdentity()
  const { studentId } = await params
  const { student, relation } = await requireGuardianChild(guardian.id, studentId, user.schoolId)

  const [t, tHero, locale, identity, attendance, results, notices, { homework }, feeOverview] =
    await Promise.all([
      getTranslations("portal"),
      getTranslations("dashboard.admin.hero"),
      getLocale(),
      getSchoolIdentity(user.schoolId),
      getStudentAttendanceSummary({ studentId: student.id }),
      getStudentResultSummaries({
        schoolId: user.schoolId,
        studentId: student.id,
        classId: student.classId,
        finalizedOnly: true,
      }),
      getVisibleNoticesForGuardian({
        schoolId: user.schoolId,
        childClassIds: children.map((child) => child.classId),
        childSectionIds: children.map((child) => child.sectionId),
        take: 4,
      }),
      getVisibleHomeworkForStudent({
        schoolId: user.schoolId,
        academicYearId: student.academicYearId,
        classId: student.classId,
        sectionId: student.sectionId,
        take: 4,
      }),
      getStudentFeeOverview({
        schoolId: user.schoolId,
        studentId: student.id,
      }),
    ])

  const latestResult = results[0] ?? null
  const base = `/portal/guardian/children/${studentId}`

  const hour = new Date().getHours()
  const greeting =
    hour < 12
      ? tHero("greetingMorning")
      : hour < 18
      ? tHero("greetingAfternoon")
      : tHero("greetingEvening")

  // Resolve guardian display name respectfully
  const rawGuardianName =
    pickLocalized(guardian.name, guardian.nameBn, locale) ||
    user.name ||
    ""
  const cleanGuardianName =
    rawGuardianName.replace(/^Portal Test\s*/i, "") ||
    (locale === "bn" ? "সম্মানিত অভিভাবক" : "Guardian")

  // Add honorific prefix based on guardian-student relationship
  const honorific =
    relation === "FATHER"
      ? locale === "bn" ? "জনাব" : "Mr."
      : relation === "MOTHER"
      ? locale === "bn" ? "জনাবা" : "Mrs."
      : ""
  const guardianDisplayName =
    cleanGuardianName.toLowerCase() === "guardian" && locale === "bn"
      ? "সম্মানিত অভিভাবক"
      : honorific
      ? `${honorific} ${cleanGuardianName}`
      : cleanGuardianName

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 pb-8">
      {/* Top Hero Section: Welcome Banner + Quick Actions Grid */}
      <section className="grid gap-3 lg:grid-cols-12">
        {/* Left Hero Card: Cream paper backdrop with campus illustration */}
        <div className="relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-2xl border border-border bg-[#f7f7f2] p-6 shadow-xs sm:p-7 lg:col-span-8 xl:col-span-9 min-w-0">
          {/* School Vector Campus Illustration on the right */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] select-none overflow-hidden sm:block"
          >
            <div className="absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-[#f7f7f2] via-[#f7f7f2]/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-[#f7f7f2]/60 to-transparent" />
            <img
              src="/images/school_vector_hero.jpg"
              alt=""
              className="size-full object-cover object-right-bottom mix-blend-multiply opacity-90 transition-opacity"
            />
          </div>

          {/* Guardian Greeting & Child Context */}
          <div className="relative z-10 max-w-[65%] min-w-[280px]">
            {/* Student Context Tag */}
            <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-white/90 px-3 py-1 text-xs font-semibold text-brand-navy shadow-2xs backdrop-blur-xs">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-muted-foreground">
                {locale === "bn" ? "শিক্ষার্থী:" : "Student:"}
              </span>
              <span className="text-xs font-bold text-brand-navy">{student.name}</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                • {student.class.name.toLowerCase().startsWith("class") ? student.class.name : `Class ${student.class.name}`} {student.section.name} (Roll {student.roll})
              </span>
            </div>

            <p className="text-sm font-bold text-brand-navy">{greeting},</p>
            <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl md:text-5xl">
              {guardianDisplayName}
              <span className="text-amber-500">.</span>
            </h1>
            <p className="mt-2 text-sm font-medium text-brand-navy/75">
              {locale === "bn"
                ? `আপনার সন্তান ${student.name}-এর একাডেমিক অগ্রগতি, দৈনন্দিন উপস্থিতি ও স্কুলের সকল তথ্য।`
                : `Tracking ${student.name}'s academic journey, attendance & school announcements.`}
            </p>
          </div>

          {/* Bottom Three Student Key Indicators */}
          <div className="relative z-10 mt-8 flex flex-wrap gap-2.5 text-xs text-brand-navy sm:text-sm">
            <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-white/80 px-3 py-1.5 shadow-2xs backdrop-blur-xs">
              <IconBadge icon={GraduationCap} tone="blue" size="sm" />
              <div>
                <b className="text-xs font-bold text-brand-navy">
                  {student.class.name.toLowerCase().startsWith("class")
                    ? student.class.name
                    : `Class ${student.class.name}`}{" "}
                  {student.section.name}
                </b>
                <p className="text-[10px] font-normal text-muted-foreground">{student.academicYear.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-white/80 px-3 py-1.5 shadow-2xs backdrop-blur-xs">
              <IconBadge icon={Users} tone="purple" size="sm" />
              <div>
                <b className="text-xs font-bold text-brand-navy">
                  {t("fields.roll")} {student.roll}
                </b>
                <p className="text-[10px] font-normal text-muted-foreground">Section {student.section.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-white/80 px-3 py-1.5 shadow-2xs backdrop-blur-xs">
              <IconBadge
                icon={Target}
                tone={attendance.percentage !== null && attendance.percentage >= 75 ? "green" : "amber"}
                size="sm"
              />
              <div>
                <b className="text-xs font-bold text-brand-navy">
                  {attendance.percentage !== null ? `${attendance.percentage}% Present` : "Enrolled"}
                </b>
                <p className="text-[10px] font-normal text-muted-foreground">
                  {locale === "bn" ? "উপস্থিতির হার" : "Term Rate"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Quick Actions 2x2 Grid with Solid Squircle Badges */}
        <aside className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4.5 shadow-xs sm:p-5 lg:col-span-4 xl:col-span-3 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-brand-navy">
              {locale === "bn" ? "দ্রুত লিঙ্ক" : "Quick Actions"}
            </h2>
            <Link
              href={`${base}/attendance`}
              className="text-[11px] font-semibold text-blue-600 transition-colors hover:text-blue-800"
            >
              {locale === "bn" ? "সব দেখুন" : "See all"}
            </Link>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Link
              href={`${base}/attendance`}
              className="group flex min-h-[96px] flex-col justify-between rounded-xl border border-border/70 bg-[#fafaf8] p-3 transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-xs"
            >
              <IconBadge icon={CalendarCheck} tone="blue" size="md" />
              <p className="mt-2 text-[11px] font-bold leading-tight text-brand-navy group-hover:text-primary">
                {t("nav.attendance")}
              </p>
            </Link>

            <Link
              href={`${base}/results`}
              className="group flex min-h-[96px] flex-col justify-between rounded-xl border border-border/70 bg-[#fafaf8] p-3 transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-xs"
            >
              <IconBadge icon={Award} tone="green" size="md" />
              <p className="mt-2 text-[11px] font-bold leading-tight text-brand-navy group-hover:text-primary">
                {t("nav.results")}
              </p>
            </Link>

            <Link
              href={`${base}/fees`}
              className="group flex min-h-[96px] flex-col justify-between rounded-xl border border-border/70 bg-[#fafaf8] p-3 transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-xs"
            >
              <IconBadge icon={Wallet} tone="rose" size="md" />
              <p className="mt-2 text-[11px] font-bold leading-tight text-brand-navy group-hover:text-primary">
                {t("nav.fees")}
              </p>
            </Link>

            <Link
              href={`${base}/homework`}
              className="group flex min-h-[96px] flex-col justify-between rounded-xl border border-border/70 bg-[#fafaf8] p-3 transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-xs"
            >
              <IconBadge icon={NotebookPen} tone="orange" size="md" />
              <p className="mt-2 text-[11px] font-bold leading-tight text-brand-navy group-hover:text-primary">
                {t("nav.homework")}
              </p>
            </Link>
          </div>
        </aside>
      </section>

      {/* Middle Bento Row: Attendance Performance + Latest Result Slip + Fee Balance */}
      <section className="grid gap-3 lg:grid-cols-12">
        {/* Attendance Performance Gauge */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs lg:col-span-4 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconBadge icon={CalendarCheck} tone="blue" size="xs" />
              <h2 className="text-sm font-bold text-brand-navy">{t("cards.attendance")}</h2>
            </div>
            <span className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {locale === "bn" ? "এই সেশন" : "This Session"}
            </span>
          </div>

          <div className="my-3 flex items-center justify-center gap-5 sm:gap-6">
            <div
              className="grid size-28 shrink-0 place-items-center rounded-full p-2.5"
              style={{
                background: `conic-gradient(#009e60 0% ${attendance.percentage ?? 0}%, #fb2c67 ${
                  attendance.percentage ?? 0
                }% ${Math.min(
                  100,
                  (attendance.percentage ?? 0) + (attendance.percentage !== null ? 100 - attendance.percentage : 0)
                )}%, #e2e8f0 100%)`,
              }}
            >
              <div className="grid size-full place-items-center rounded-full bg-card text-center shadow-xs">
                <b className="text-2xl font-black text-brand-navy">
                  {attendance.percentage !== null ? `${attendance.percentage}%` : "—"}
                </b>
                <span className="-mt-1 text-[9px] font-medium text-muted-foreground">
                  {locale === "bn" ? "উপস্থিত" : "Present"}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-[11px]">
              <p className="flex items-center gap-2">
                <i className="size-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">{locale === "bn" ? "উপস্থিত" : "Present"}</span>
                <b className="ml-auto font-bold text-brand-navy">
                  {attendance.counts.PRESENT} {locale === "bn" ? "দিন" : "days"}
                </b>
              </p>
              <p className="flex items-center gap-2">
                <i className="size-2 rounded-full bg-rose-500" />
                <span className="text-muted-foreground">{locale === "bn" ? "অনুপস্থিত" : "Absent"}</span>
                <b className="ml-auto font-bold text-brand-navy">
                  {attendance.counts.ABSENT} {locale === "bn" ? "দিন" : "days"}
                </b>
              </p>
              <p className="flex items-center gap-2">
                <i className="size-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">{locale === "bn" ? "বিলম্বে" : "Late"}</span>
                <b className="ml-auto font-bold text-brand-navy">
                  {attendance.counts.LATE} {locale === "bn" ? "দিন" : "days"}
                </b>
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-blue-50/70 p-3 text-[11px] text-blue-800">
            <CalendarDays className="size-4 shrink-0 text-blue-600" />
            <span className="line-clamp-1">
              {attendance.percentage !== null && attendance.percentage >= 75
                ? locale === "bn"
                  ? "চমৎকার উপস্থিতি! লক্ষ্যমাত্রার মধ্যে রয়েছে।"
                  : "Great consistency! Attendance is on track."
                : locale === "bn"
                ? "নিয়মিত উপস্থিতি ভালো ফলাফলে সহায়তা করে।"
                : "Regular attendance helps improve grades."}
            </span>
          </div>
        </div>

        {/* Latest Result Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs lg:col-span-4 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconBadge icon={Award} tone="green" size="xs" />
              <h2 className="text-sm font-bold text-brand-navy">{t("cards.latestResult")}</h2>
            </div>
            <Link
              href={`${base}/results`}
              className="text-[11px] font-semibold text-blue-600 transition-colors hover:text-blue-800"
            >
              {locale === "bn" ? "সব ফলাফল" : "View all"}
            </Link>
          </div>

          {!latestResult ? (
            <div className="my-auto py-6 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted/60 text-muted-foreground">
                <Award className="size-6" />
              </div>
              <p className="mt-3 text-xs font-semibold text-foreground">{t("empty.noResultsTitle")}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{t("empty.noResults")}</p>
            </div>
          ) : (
            <div className="my-auto space-y-3.5">
              <div>
                <p className="text-sm font-bold text-brand-navy">{latestResult.examName}</p>
                <p className="text-[11px] text-muted-foreground">{latestResult.examTypeName}</p>
              </div>

              <div className="grid grid-cols-2 divide-x divide-border rounded-xl border border-border/70 bg-[#fafaf8] p-3 text-center">
                <div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {locale === "bn" ? "শতাংশ" : "Percentage"}
                  </span>
                  <b className="mt-0.5 block text-xl font-black text-brand-navy">
                    {latestResult.overallPercentage !== null ? `${latestResult.overallPercentage}%` : "—"}
                  </b>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-muted-foreground">GPA</span>
                  <b className="mt-0.5 block text-xl font-black text-brand-navy">
                    {latestResult.gpa !== null ? latestResult.gpa.toFixed(2) : "—"}
                  </b>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-800">
                <span className="font-semibold">{latestResult.overallStatus ?? "Completed"}</span>
                <Link
                  href={`${base}/results/${latestResult.examId}/report-card`}
                  className="font-bold text-blue-600 underline-offset-4 hover:underline"
                >
                  {locale === "bn" ? "রিপোর্ট কার্ড →" : "Report card →"}
                </Link>
              </div>
            </div>
          )}

          <div className="mt-4 border-t border-border/60 pt-2">
            <Link
              href={`${base}/results`}
              className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <span>{locale === "bn" ? "মার্কশিট ও গ্রেড বিবরণী দেখুন" : "Detailed academic marksheets"}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Fee Balance Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs lg:col-span-4 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconBadge icon={Wallet} tone={feeOverview.summary.totalOutstanding > 0 ? "rose" : "emerald"} size="xs" />
              <h2 className="text-sm font-bold text-brand-navy">{locale === "bn" ? "ফি বিবরণী" : "Fee Status"}</h2>
            </div>
            <Link
              href={`${base}/fees`}
              className="text-[11px] font-semibold text-blue-600 transition-colors hover:text-blue-800"
            >
              {locale === "bn" ? "লেজার" : "View ledger"}
            </Link>
          </div>

          <div className="my-auto space-y-3.5">
            <div className="flex items-center gap-3.5">
              <IconBadge
                icon={Wallet}
                tone={feeOverview.summary.totalOutstanding > 0 ? "rose" : "emerald"}
                size="lg"
              />
              <div>
                <b className="block text-2xl font-black text-brand-navy">
                  ৳ {feeOverview.summary.totalOutstanding.toLocaleString()}
                </b>
                <span
                  className={`text-[11px] font-semibold ${
                    feeOverview.summary.totalOutstanding > 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {feeOverview.summary.totalOutstanding > 0
                    ? locale === "bn"
                      ? "বকেয়া ফি আছে"
                      : "Outstanding Balance"
                    : locale === "bn"
                    ? "সমস্ত ফি পরিশোধিত"
                    : "All Fees Cleared"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-[#fafaf8] px-3.5 py-2.5 text-xs">
              <div>
                <span className="block text-[10px] text-muted-foreground">
                  {locale === "bn" ? "মোট পরিশোধিত" : "Total Paid"}
                </span>
                <b className="text-xs text-brand-navy">৳ {feeOverview.summary.totalPaid.toLocaleString()}</b>
              </div>
              <Badge variant={feeOverview.summary.totalOutstanding > 0 ? "destructive" : "success"}>
                {feeOverview.summary.totalOutstanding > 0
                  ? locale === "bn"
                    ? "বকেয়া"
                    : "Due"
                  : locale === "bn"
                  ? "পরিশোধিত"
                  : "Cleared"}
              </Badge>
            </div>
          </div>

          <div className="mt-4 border-t border-border/60 pt-2">
            <Link
              href={`${base}/fees`}
              className="flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:underline"
            >
              <span>
                {feeOverview.summary.totalOutstanding > 0
                  ? locale === "bn"
                    ? "অনলাইনে পরিশোধ করুন বা রসিদ দেখুন"
                    : "Pay online or view ledger"
                  : locale === "bn"
                  ? "পরিশোধের রসিদসমূহ দেখুন"
                  : "View payment history"}
              </span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom Bento Row: Upcoming Homework + School Announcements */}
      <section className="grid gap-3 lg:grid-cols-12">
        {/* Upcoming Homework */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs lg:col-span-6 min-w-0">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <IconBadge icon={NotebookPen} tone="orange" size="xs" />
              <h2 className="text-sm font-bold text-brand-navy">
                {locale === "bn" ? "আসন্ন হোমওয়ার্ক" : "Upcoming Homework"}
              </h2>
            </div>
            <Link
              href={`${base}/homework`}
              className="text-[11px] font-semibold text-blue-600 transition-colors hover:text-blue-800"
            >
              {locale === "bn" ? "সব দেখুন" : "See all"}
            </Link>
          </div>

          {homework.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-muted/60 text-muted-foreground">
                <NotebookPen className="size-5" />
              </div>
              <p className="mt-2.5 text-xs font-semibold text-foreground">{t("empty.noHomeworkTitle")}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{t("empty.noHomework")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {homework.map((item) => (
                <Link
                  key={item.id}
                  href={`${base}/homework/${item.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-brand-navy">{item.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {pickLocalized(item.subject.name, item.subject.nameBn, locale)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block text-[9px] font-medium text-muted-foreground">
                      {locale === "bn" ? "জমা দেওয়ার তারিখ" : "Due date"}
                    </span>
                    <span className="block text-[11px] font-bold text-brand-navy">
                      {formatDate(item.dueDate, locale)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* School Announcements */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs lg:col-span-6 min-w-0">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <IconBadge icon={Megaphone} tone="blue" size="xs" />
              <h2 className="text-sm font-bold text-brand-navy">
                {locale === "bn" ? "সাম্প্রতিক নোটিশ" : "School Announcements"}
              </h2>
            </div>
            <Link
              href="/portal/guardian/notices"
              className="text-[11px] font-semibold text-blue-600 transition-colors hover:text-blue-800"
            >
              {locale === "bn" ? "সব দেখুন" : "See all"}
            </Link>
          </div>

          {notices.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-muted/60 text-muted-foreground">
                <Megaphone className="size-5" />
              </div>
              <p className="mt-2.5 text-xs font-semibold text-foreground">{t("empty.noNoticesTitle")}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{t("empty.noNotices")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {notices.map((notice) => (
                <Link
                  key={notice.id}
                  href={`/portal/guardian/notices/${notice.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-brand-navy">
                      {pickLocalized(notice.title, notice.titleBn, locale)}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {pickLocalized(notice.category.name, notice.category.nameBn, locale)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block text-[11px] text-muted-foreground">
                      {formatDate(notice.publishAt, locale)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="flex flex-col gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} {identity.schoolName}. All rights reserved.</span>
        <span>Benwil School Guardian Portal</span>
      </footer>
    </div>
  )
}

