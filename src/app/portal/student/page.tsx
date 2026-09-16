import Link from "next/link"
import { Award, BookOpen, CalendarDays, CreditCard, FileText, GraduationCap, Megaphone, NotebookPen, Target, Users, Wallet } from "lucide-react"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getSchoolIdentity } from "@/lib/settings/school-settings"

const schedule = [
  ["08:00 AM", "Bangla", "Ms. Farzana Rahman", "Room 201", "bg-blue-600"],
  ["09:00 AM", "Mathematics", "Mr. Tanvir Ahmed", "Room 202", "bg-slate-400"],
  ["10:00 AM", "English", "Ms. Arifa Khan", "Room 203", "bg-slate-400"],
  ["11:00 AM", "Break", "School Canteen", "", "bg-amber-400"],
  ["11:30 AM", "Science", "Mr. Rashedul Karim", "Room 204", "bg-slate-400"],
] as const

const homework = [
  ["Mathematics", "Chapter 4: Solve questions 1-10", "Tomorrow", "bg-blue-600", FileText],
  ["English", "Write a paragraph on My Favourite Book", "14 May", "bg-rose-500", NotebookPen],
  ["Science", "Lab report: Photosynthesis", "15 May", "bg-emerald-600", Target],
  ["Bangla", "\u0997\u09A6\u09CD\u09AF\u09BE\u0982\u09B6 \u0985\u09A8\u09C1\u09B6\u09C0\u09B2\u09A8\u09C0", "16 May", "bg-amber-500", BookOpen],
] as const

const notices = [
  ["Summer Vacation Schedule", "School will remain closed from 1 June to 15 June 2025.", "10 May 2025", "bg-amber-100 text-amber-600", Megaphone],
  ["Inter-Class Drawing Competition", "Students from Classes 6-10 are invited to participate.", "08 May 2025", "bg-blue-100 text-blue-600", FileText],
  ["Science Club Registration", "Register by 20 May at the school office.", "05 May 2025", "bg-rose-100 text-rose-600", Users],
  ["New Library Books Arrived", "Check out the latest collection of story books.", "03 May 2025", "bg-sky-100 text-sky-600", BookOpen],
] as const

export default async function StudentDashboardPage() {
  const { student, user } = await requireStudentIdentity()
  const identity = await getSchoolIdentity(user.schoolId)
  const firstName = student.name.split(" ")[0] || student.name
  const quickActions = [
    ["/portal/student", "View Class Schedule", "bg-blue-50 text-blue-700", CalendarDays],
    ["/portal/student/homework", "Submit Homework", "bg-amber-50 text-amber-700", NotebookPen],
    ["/portal/student/results", "Download Result Slip", "bg-sky-50 text-sky-700", Award],
    ["/portal/student/fees", "Pay Fees Online", "bg-emerald-50 text-emerald-700", CreditCard],
  ] as const

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 pb-6 sm:space-y-4">
      <section className="grid gap-3 lg:grid-cols-12">
        <div className="relative min-h-[250px] overflow-hidden rounded-xl border border-border bg-[#f7f7f2] p-6 lg:col-span-9 sm:p-7">
          <div className="absolute inset-y-0 right-0 hidden w-[48%] overflow-hidden bg-[radial-gradient(circle_at_40%_30%,#dce7d5_0,transparent_25%),radial-gradient(circle_at_70%_45%,#bacfac_0,transparent_26%),linear-gradient(120deg,transparent_18%,#dfe8df_18%,#eaf0e8_100%)] lg:block" />
          <div className="absolute bottom-0 right-8 hidden h-40 w-72 rounded-t-[90px] border-x-[12px] border-t-[12px] border-[#d1d6cf] bg-[#e8eee6] shadow-[inset_0_24px_0_#f4f6f2] lg:block"><div className="absolute -top-16 left-12 h-32 w-32 rounded-full bg-[#6e9d5e] opacity-90 blur-[1px]" /><div className="absolute -top-10 right-4 h-24 w-24 rounded-full bg-[#83ad6e]" /><div className="absolute right-12 top-2 h-20 w-1 bg-[#345a3c]" /><div className="absolute right-[49px] top-2 h-10 w-12 bg-[#166a47]" /></div>
          <div className="relative z-10 max-w-[52%] min-w-[300px]"><p className="text-sm font-bold text-brand-navy">Good morning,</p><h1 className="mt-0.5 text-4xl font-bold tracking-tight text-brand-navy sm:text-5xl">{firstName}<span className="text-amber-500">.</span></h1><p className="mt-3 text-sm font-medium text-brand-navy/75">Small steps today, brighter tomorrows.</p></div>
          <div className="relative z-10 mt-11 flex flex-wrap gap-x-7 gap-y-3 text-xs text-brand-navy sm:text-sm"><div className="flex items-center gap-2"><GraduationCap className="size-5" /><div><b>Class 6</b><p className="text-[10px] font-normal text-muted-foreground">Academic Year 2024-25</p></div></div><div className="flex items-center gap-2"><Users className="size-5" /><div><b>Roll 12</b><p className="text-[10px] font-normal text-muted-foreground">Section A</p></div></div><div className="flex items-center gap-2"><Target className="size-5" /><div><b>Keep going!</b><p className="text-[10px] font-normal text-muted-foreground">You&apos;re 75% through this term</p></div></div></div>
        </div>
        <aside className="rounded-xl border border-border bg-card p-4 lg:col-span-3"><div className="flex items-center justify-between"><h2 className="text-sm font-bold text-brand-navy">Quick Actions</h2><Link href="/portal/student" className="text-[11px] font-semibold text-blue-600">See all</Link></div><div className="mt-3 grid grid-cols-2 gap-2">{quickActions.map(([href, label, tone, Icon]) => <Link key={label} href={href} className={`min-h-20 rounded-lg p-3 transition-transform hover:-translate-y-0.5 ${tone}`}><Icon className="size-5" /><p className="mt-2 text-[11px] font-bold leading-3">{label}</p></Link>)}</div></aside>
      </section>

      <section className="grid gap-3 lg:grid-cols-12">
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-5"><div className="flex items-center justify-between border-b border-border pb-3"><h2 className="text-sm font-bold text-brand-navy">Today&apos;s Schedule</h2><span className="text-[11px] text-muted-foreground">Mon, 12 May 2025</span></div><div className="mt-2">{schedule.map(([time, subject, teacher, room, tone], index) => <div key={time} className="grid grid-cols-[76px_15px_1fr_auto] items-center gap-2 py-2"><span className="text-[10px] font-semibold text-brand-navy">{time}</span><span className={`relative size-2.5 rounded-full ${tone} ${index < schedule.length - 1 ? "after:absolute after:left-1 after:top-2 after:h-8 after:w-px after:bg-border" : ""}`} /><div><p className="text-xs font-bold text-brand-navy">{subject}</p><p className="text-[10px] text-muted-foreground">{teacher}</p></div><span className="text-[10px] text-muted-foreground">{room}</span></div>)}</div></div>
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-4"><div className="flex items-center justify-between"><h2 className="text-sm font-bold text-brand-navy">Attendance</h2><button className="rounded border border-border px-2 py-1 text-[10px] text-muted-foreground">This Month</button></div><div className="mt-4 flex items-center justify-center gap-6"><div className="grid size-32 place-items-center rounded-full bg-[conic-gradient(#20a66a_0_92%,#e9a23b_92%_96%,#e7ebf0_96%)] p-3"><div className="grid size-full place-items-center rounded-full bg-card text-center"><b className="text-3xl text-brand-navy">92%</b><span className="-mt-2 text-[10px] text-muted-foreground">Present</span></div></div><div className="space-y-3 text-[11px]"><p className="flex items-center gap-2"><i className="size-2 rounded-full bg-emerald-500" />Present <b className="ml-auto">22 days</b></p><p className="flex items-center gap-2"><i className="size-2 rounded-full bg-slate-300" />Absent <b className="ml-auto">1 day</b></p><p className="flex items-center gap-2"><i className="size-2 rounded-full bg-amber-400" />Late <b className="ml-auto">1 day</b></p></div></div><div className="mt-4 flex gap-2 rounded-lg bg-blue-50 p-3"><CalendarDays className="size-5 text-blue-600" /><p className="text-[11px] text-blue-700"><b>Great consistency!</b><br />You&apos;ve maintained 92% attendance this month.</p></div></div>
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-3"><div className="flex items-center justify-between border-b border-border pb-3"><h2 className="text-sm font-bold text-brand-navy">Upcoming Homework</h2><Link href="/portal/student/homework" className="text-[11px] font-semibold text-blue-600">See all</Link></div><div>{homework.map(([subject, detail, due, tone, Icon]) => <Link href="/portal/student/homework" key={subject} className="flex gap-2 border-b border-border py-3 last:border-0"><span className={`grid size-8 shrink-0 place-items-center rounded-lg text-white ${tone}`}><Icon className="size-4" /></span><span className="min-w-0 flex-1"><b className="block text-[11px] text-brand-navy">{subject}</b><span className="block truncate text-[10px] text-muted-foreground">{detail}</span></span><span className="text-right text-[10px] text-muted-foreground">Due<br /><b className={due === "Tomorrow" ? "text-rose-500" : "text-brand-navy"}>{due}</b></span></Link>)}</div></div>
      </section>

      <section className="grid gap-3 lg:grid-cols-12">
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-4"><div className="flex justify-between"><div><h2 className="text-sm font-bold text-brand-navy">Latest Result</h2><p className="mt-2 text-sm font-semibold text-brand-navy">Term Test 1</p><p className="text-[10px] text-muted-foreground">Held on 20 Apr 2025</p></div><Link href="/portal/student/results" className="text-[11px] font-semibold text-blue-600">View all results</Link></div><div className="mt-4 grid grid-cols-5 divide-x divide-border text-center">{[["Bangla", "85"], ["English", "78"], ["Math", "92"], ["Science", "88"], ["ICT", "90"]].map(([name, mark]) => <div key={name}><p className="text-[9px] text-muted-foreground">{name}</p><b className="text-lg text-brand-navy">{mark}</b><p className="text-[9px] text-muted-foreground">/100</p></div>)}</div><div className="mt-4 flex gap-2 rounded-lg bg-blue-50 p-3"><Award className="size-5 text-blue-600" /><p className="text-[10px] text-blue-700"><b>Well done!</b><br />Your average is 86.6%. Keep up the great work!</p></div></div>
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-4"><div className="flex items-center justify-between"><h2 className="text-sm font-bold text-brand-navy">Fee Balance</h2><Link href="/portal/student/fees" className="text-[11px] font-semibold text-blue-600">View details</Link></div><div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-4"><div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-500"><Wallet className="size-5" /></span><div><b className="block text-2xl text-brand-navy">{`\u09F3`} 3,500</b><p className="text-[10px] text-rose-500">Outstanding</p></div></div><div className="border-l border-border pl-4 text-right text-[10px] text-muted-foreground"><p>Due Date</p><b className="text-brand-navy">31 May 2025</b></div></div><div className="mt-4 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2"><p className="text-[10px] text-muted-foreground"><b className="text-brand-navy">Last payment</b><br />{`\u09F3`} 5,000 · 02 Apr 2025</p><span className="rounded bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-700">Paid</span></div></div>
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-4"><div className="flex items-center justify-between border-b border-border pb-3"><h2 className="text-sm font-bold text-brand-navy">Notices</h2><Link href="/portal/student/notices" className="text-[11px] font-semibold text-blue-600">See all</Link></div>{notices.map(([title, detail, date, tone, Icon]) => <Link href="/portal/student/notices" key={title} className="flex gap-2 border-b border-border py-2.5 last:border-0"><span className={`grid size-7 shrink-0 place-items-center rounded-full ${tone}`}><Icon className="size-3.5" /></span><span className="min-w-0"><b className="block truncate text-[10px] text-brand-navy">{title}</b><span className="block truncate text-[9px] text-muted-foreground">{detail}</span></span><span className="ml-auto shrink-0 text-[9px] text-muted-foreground">{date}</span></Link>)}</div>
      </section>
      <footer className="flex flex-col gap-2 border-t border-border pt-3 text-[10px] text-muted-foreground sm:flex-row sm:justify-between"><span>{`\u00A9`} {new Date().getFullYear()} {identity.schoolName}. All rights reserved.</span><span>Privacy &nbsp; | &nbsp; Terms &nbsp; | &nbsp; Help</span></footer>
    </div>
  )
}
