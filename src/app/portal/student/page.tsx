import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"
import { Award, CalendarDays, CreditCard, Megaphone, NotebookPen, Target, Users, Wallet, GraduationCap } from "lucide-react"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getSchoolIdentity } from "@/lib/settings/school-settings"
import { getTodaysStudentSchedule } from "@/lib/academics/routine"
import { getVisibleHomeworkForStudent } from "@/lib/homework/homework-visibility"
import { getStudentResultSummaries } from "@/lib/results/get-results"
import { getVisibleNoticesForStudent } from "@/lib/notices/notice-visibility"
import { getStudentFeeOverview } from "@/lib/fees/get-fees"
import { formatDate, pickLocalized } from "@/lib/format"

// Purely decorative alternating colors for list rows - not tied to any real
// category, just visual rhythm matching the dashboard's existing style.
const HOMEWORK_TONES = ["bg-blue-600", "bg-rose-500", "bg-emerald-600", "bg-amber-500"] as const
const NOTICE_TONES = [
  "bg-amber-100 text-amber-600",
  "bg-blue-100 text-blue-600",
  "bg-rose-100 text-rose-600",
  "bg-sky-100 text-sky-600",
] as const

export default async function StudentDashboardPage() {
  const { student, user } = await requireStudentIdentity()
  const [
    identity,
    locale,
    tRoutine,
    tPortal,
    tResults,
    tHomework,
    tFees,
    todaySchedule,
    { homework },
    results,
    notices,
    feeOverview,
  ] = await Promise.all([
    getSchoolIdentity(user.schoolId),
    getLocale(),
    getTranslations("routine"),
    getTranslations("portal"),
    getTranslations("results"),
    getTranslations("homework"),
    getTranslations("fees"),
    getTodaysStudentSchedule({
      schoolId: user.schoolId,
      studentId: student.id,
    }),
    getVisibleHomeworkForStudent({
      schoolId: user.schoolId,
      academicYearId: student.academicYearId,
      classId: student.classId,
      sectionId: student.sectionId,
      take: 4,
    }),
    getStudentResultSummaries({
      schoolId: user.schoolId,
      studentId: student.id,
      classId: student.classId,
      finalizedOnly: true,
    }),
    getVisibleNoticesForStudent({
      schoolId: user.schoolId,
      classId: student.classId,
      sectionId: student.sectionId,
      take: 4,
    }),
    getStudentFeeOverview({
      schoolId: user.schoolId,
      studentId: student.id,
    }),
  ])

  const firstName = student.name.split(" ")[0] || student.name
  const quickActions = [
    ["/portal/student/routine", tRoutine("viewSchedule"), "bg-blue-50 text-blue-700", CalendarDays],
    ["/portal/student/homework", "Submit Homework", "bg-amber-50 text-amber-700", NotebookPen],
    ["/portal/student/results", "Download Result Slip", "bg-sky-50 text-sky-700", Award],
    ["/portal/student/fees", "Pay Fees Online", "bg-emerald-50 text-emerald-700", CreditCard],
  ] as const

  const latestResult = results[0] ?? null
  const overallStatusLabel = latestResult
    ? latestResult.overallStatus === "PASS"
      ? tResults("status.pass")
      : latestResult.overallStatus === "FAIL"
        ? tResults("status.fail")
        : latestResult.overallStatus === "INCOMPLETE"
          ? tResults("status.incomplete")
          : tResults("status.noResult")
    : null

  const lastPayment = feeOverview.payments.find((payment) => payment.status === "COMPLETED") ?? null
  const nextDueFee =
    feeOverview.fees
      .filter((fee) => (fee.status === "UNPAID" || fee.status === "PARTIAL") && fee.dueDate)
      .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())[0] ?? null

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 pb-6 sm:space-y-4">
      <section className="grid gap-3 lg:grid-cols-12">
        <div className="relative min-h-[250px] overflow-hidden rounded-xl border border-border bg-[#f7f7f2] p-6 lg:col-span-9 sm:p-7">
          <div className="absolute inset-y-0 right-0 hidden w-[48%] overflow-hidden bg-[radial-gradient(circle_at_40%_30%,#dce7d5_0,transparent_25%),radial-gradient(circle_at_70%_45%,#bacfac_0,transparent_26%),linear-gradient(120deg,transparent_18%,#dfe8df_18%,#eaf0e8_100%)] lg:block" />
          <div className="absolute bottom-0 right-8 hidden h-40 w-72 rounded-t-[90px] border-x-[12px] border-t-[12px] border-[#d1d6cf] bg-[#e8eee6] shadow-[inset_0_24px_0_#f4f6f2] lg:block"><div className="absolute -top-16 left-12 h-32 w-32 rounded-full bg-[#6e9d5e] opacity-90 blur-[1px]" /><div className="absolute -top-10 right-4 h-24 w-24 rounded-full bg-[#83ad6e]" /><div className="absolute right-12 top-2 h-20 w-1 bg-[#345a3c]" /><div className="absolute right-[49px] top-2 h-10 w-12 bg-[#166a47]" /></div>
          <div className="relative z-10 max-w-[52%] min-w-[300px]"><p className="text-sm font-bold text-brand-navy">Good morning,</p><h1 className="mt-0.5 text-4xl font-bold tracking-tight text-brand-navy sm:text-5xl">{firstName}<span className="text-amber-500">.</span></h1><p className="mt-3 text-sm font-medium text-brand-navy/75">Small steps today, brighter tomorrows.</p></div>
          <div className="relative z-10 mt-11 flex flex-wrap gap-x-7 gap-y-3 text-xs text-brand-navy sm:text-sm">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-5" />
              <div>
                <b>{student.class.name}</b>
                <p className="text-[10px] font-normal text-muted-foreground">{student.academicYear.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-5" />
              <div>
                <b>Roll {student.roll}</b>
                <p className="text-[10px] font-normal text-muted-foreground">{student.section.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="size-5" />
              <div>
                <b>Keep going!</b>
                <p className="text-[10px] font-normal text-muted-foreground">You&apos;re 75% through this term</p>
              </div>
            </div>
          </div>
        </div>
        <aside className="rounded-xl border border-border bg-card p-4 lg:col-span-3"><div className="flex items-center justify-between"><h2 className="text-sm font-bold text-brand-navy">Quick Actions</h2><Link href="/portal/student" className="text-[11px] font-semibold text-blue-600">See all</Link></div><div className="mt-3 grid grid-cols-2 gap-2">{quickActions.map(([href, label, tone, Icon]) => <Link key={label} href={href} className={`min-h-20 rounded-lg p-3 transition-transform hover:-translate-y-0.5 ${tone}`}><Icon className="size-5" /><p className="mt-2 text-[11px] font-bold leading-3">{label}</p></Link>)}</div></aside>
      </section>

      <section className="grid gap-3 lg:grid-cols-12">
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-5 min-w-0">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-brand-navy">{tRoutine("todaysSchedule")}</h2>
            <span className="text-[11px] text-muted-foreground">
              {formatDate(new Date(), locale)}
            </span>
          </div>
          {!todaySchedule || todaySchedule.entries.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {tRoutine("noClassesToday")}
            </div>
          ) : (
            <div className="mt-2">
              {todaySchedule.entries.map((entry, index) => (
                <div key={entry.id} className="grid grid-cols-[76px_15px_1fr_auto] items-center gap-2 py-2">
                  <span className="text-[10px] font-semibold text-brand-navy font-mono">
                    {entry.startTime}
                  </span>
                  <span
                    className={`relative size-2.5 rounded-full bg-blue-600 ${
                      index < todaySchedule.entries.length - 1
                        ? "after:absolute after:left-1 after:top-2 after:h-8 after:w-px after:bg-border"
                        : ""
                    }`}
                  />
                  <div>
                    <p className="text-xs font-bold text-brand-navy">
                      {pickLocalized(entry.subject.name, entry.subject.nameBn, locale)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{entry.teacher.name}</p>
                  </div>
                  {entry.room && (
                    <span className="text-[10px] text-muted-foreground">{entry.room}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-4 min-w-0"><div className="flex items-center justify-between"><h2 className="text-sm font-bold text-brand-navy">Attendance</h2><button className="rounded border border-border px-2 py-1 text-[10px] text-muted-foreground">This Month</button></div><div className="mt-4 flex items-center justify-center gap-6"><div className="grid size-32 place-items-center rounded-full bg-[conic-gradient(#20a66a_0_92%,#e9a23b_92%_96%,#e7ebf0_96%)] p-3"><div className="grid size-full place-items-center rounded-full bg-card text-center"><b className="text-3xl text-brand-navy">92%</b><span className="-mt-2 text-[10px] text-muted-foreground">Present</span></div></div><div className="space-y-3 text-[11px]"><p className="flex items-center gap-2"><i className="size-2 rounded-full bg-emerald-500" />Present <b className="ml-auto">22 days</b></p><p className="flex items-center gap-2"><i className="size-2 rounded-full bg-slate-300" />Absent <b className="ml-auto">1 day</b></p><p className="flex items-center gap-2"><i className="size-2 rounded-full bg-amber-400" />Late <b className="ml-auto">1 day</b></p></div></div><div className="mt-4 flex gap-2 rounded-lg bg-blue-50 p-3"><CalendarDays className="size-5 text-blue-600" /><p className="text-[11px] text-blue-700"><b>Great consistency!</b><br />You&apos;ve maintained 92% attendance this month.</p></div></div>
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-3 min-w-0">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-brand-navy">{tPortal("cards.homework")}</h2>
            <Link href="/portal/student/homework" className="text-[11px] font-semibold text-blue-600">{tPortal("actions.seeAll")}</Link>
          </div>
          {homework.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">{tPortal("empty.noHomework")}</div>
          ) : (
            <div>
              {homework.map((item, index) => (
                <Link href={`/portal/student/homework/${item.id}`} key={item.id} className="flex gap-2 border-b border-border py-3 last:border-0">
                  <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-white ${HOMEWORK_TONES[index % HOMEWORK_TONES.length]}`}>
                    <NotebookPen className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-[11px] text-brand-navy">{pickLocalized(item.subject.name, item.subject.nameBn, locale)}</b>
                    <span className="block truncate text-[10px] text-muted-foreground">{item.title}</span>
                  </span>
                  <span className="text-right text-[10px] text-muted-foreground">
                    {tHomework("portal.dueLabel")}<br />
                    <b className="text-brand-navy">{formatDate(item.dueDate, locale)}</b>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-12">
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-4 min-w-0">
          <div className="flex justify-between">
            <div>
              <h2 className="text-sm font-bold text-brand-navy">{tPortal("cards.latestResult")}</h2>
              {latestResult && (
                <>
                  <p className="mt-2 text-sm font-semibold text-brand-navy">{latestResult.examName}</p>
                  <p className="text-[10px] text-muted-foreground">{latestResult.examTypeName}</p>
                </>
              )}
            </div>
            <Link href="/portal/student/results" className="text-[11px] font-semibold text-blue-600">{tPortal("actions.seeAll")}</Link>
          </div>
          {!latestResult ? (
            <div className="py-8 text-center text-xs text-muted-foreground">{tPortal("empty.noResults")}</div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 divide-x divide-border text-center">
                <div>
                  <p className="text-[9px] text-muted-foreground">{tResults("fields.percentage")}</p>
                  <b className="text-lg text-brand-navy">
                    {latestResult.overallPercentage !== null ? `${latestResult.overallPercentage}%` : "—"}
                  </b>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground">{tResults("fields.gpa")}</p>
                  <b className="text-lg text-brand-navy">
                    {latestResult.gpa !== null ? latestResult.gpa.toFixed(2) : "—"}
                  </b>
                </div>
              </div>
              <div className="mt-4 flex gap-2 rounded-lg bg-blue-50 p-3">
                <Award className="size-5 text-blue-600" />
                <p className="text-[11px] font-semibold text-blue-700">{overallStatusLabel}</p>
              </div>
            </>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-4 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-brand-navy">{tPortal("cards.fees")}</h2>
            <Link href="/portal/student/fees" className="text-[11px] font-semibold text-blue-600">{tPortal("actions.viewDetails")}</Link>
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-4">
            <div className="flex items-center gap-3">
              <span className={`grid size-11 shrink-0 place-items-center rounded-lg ${feeOverview.summary.totalOutstanding > 0 ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600"}`}>
                <Wallet className="size-5" />
              </span>
              <div>
                <b className="block text-2xl text-brand-navy">{`৳`} {feeOverview.summary.totalOutstanding.toLocaleString()}</b>
                <p className={`text-[10px] ${feeOverview.summary.totalOutstanding > 0 ? "text-rose-500" : "text-emerald-600"}`}>
                  {feeOverview.summary.totalOutstanding > 0 ? tFees("fields.outstandingBalance") : tPortal("fields.allFeesCleared")}
                </p>
              </div>
            </div>
            {nextDueFee && (
              <div className="border-l border-border pl-4 text-right text-[10px] text-muted-foreground">
                <p>{tFees("fields.dueDate")}</p>
                <b className="text-brand-navy">{formatDate(nextDueFee.dueDate!, locale)}</b>
              </div>
            )}
          </div>
          {lastPayment && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">
                <b className="text-brand-navy">{tPortal("fields.lastPayment")}</b>
                <br />
                {`৳`} {lastPayment.amount.toLocaleString()} · {formatDate(lastPayment.paidAt, locale)}
              </p>
              <span className="rounded bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-700">
                {tFees("status.PAID")}
              </span>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-4 min-w-0">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-brand-navy">{tPortal("cards.notices")}</h2>
            <Link href="/portal/student/notices" className="text-[11px] font-semibold text-blue-600">{tPortal("actions.seeAll")}</Link>
          </div>
          {notices.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">{tPortal("empty.noNotices")}</div>
          ) : (
            notices.map((notice, index) => (
              <Link href={`/portal/student/notices/${notice.id}`} key={notice.id} className="flex gap-2 border-b border-border py-2.5 last:border-0">
                <span className={`grid size-7 shrink-0 place-items-center rounded-full ${NOTICE_TONES[index % NOTICE_TONES.length]}`}>
                  <Megaphone className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <b className="block truncate text-[10px] text-brand-navy">{pickLocalized(notice.title, notice.titleBn, locale)}</b>
                  <span className="block truncate text-[9px] text-muted-foreground">{pickLocalized(notice.category.name, notice.category.nameBn, locale)}</span>
                </span>
                <span className="ml-auto shrink-0 text-[9px] text-muted-foreground">{formatDate(notice.publishAt, locale)}</span>
              </Link>
            ))
          )}
        </div>
      </section>
      <footer className="flex flex-col gap-2 border-t border-border pt-3 text-[10px] text-muted-foreground sm:flex-row sm:justify-between"><span>{`©`} {new Date().getFullYear()} {identity.schoolName}. All rights reserved.</span><span>Privacy &nbsp; | &nbsp; Terms &nbsp; | &nbsp; Help</span></footer>
    </div>
  )
}
