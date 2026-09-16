import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"
import { ArrowRight, CalendarDays, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardHeroProps {
  userName: string
  schoolName: string
  sessionYear?: string
}

export async function DashboardHero({ userName, schoolName, sessionYear = "2026" }: DashboardHeroProps) {
  const [t, locale] = await Promise.all([getTranslations("dashboard.admin.hero"), getLocale()])
  const hour = new Date().getHours()
  const greeting = hour < 12 ? t("greetingMorning") : hour < 18 ? t("greetingAfternoon") : t("greetingEvening")
  const date = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date())

  return (
    <section className="grid gap-6 border-b border-border/80 pb-6 pt-1 xl:grid-cols-[minmax(0,1fr)_minmax(240px,0.55fr)_auto] xl:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <span>{date}</span>
          <span className="inline-flex items-center gap-1.5 text-success">
            <span className="size-1.5 rounded-full bg-success" />
            {t("liveCampus")}
          </span>
        </div>
        <h1 className="mt-2 font-serif text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-brand-navy sm:text-5xl">
          {greeting}, {userName}.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-6 text-muted-foreground">
          {t("subtitle", { schoolName, date })}
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy">
          <CalendarDays className="size-3.5" />
          {t("academicSession", { year: sessionYear })}
        </p>
      </div>

      <blockquote className="hidden border-l border-brand-red/40 pl-5 font-serif text-xl leading-snug text-brand-navy/80 xl:block">
        &quot;Small moments of care build an extraordinary school.&quot;
      </blockquote>

      <div className="flex items-center gap-2 xl:justify-end">
        <Button nativeButton={false} variant="outline" size="sm" className="h-10 rounded-lg border-border bg-card px-4 text-brand-navy hover:bg-muted" render={<Link href="/students" />}>
          {t("directory")}
          <ArrowRight className="size-3.5" />
        </Button>
        <Button nativeButton={false} size="sm" className="h-10 rounded-lg bg-brand-red px-4 text-white shadow-[0_8px_18px_rgba(192,37,45,0.18)] hover:bg-brand-red-dark" render={<Link href="/students/new" />}>
          <UserPlus className="size-3.5" />
          {t("addStudent")}
        </Button>
      </div>
    </section>
  )
}
