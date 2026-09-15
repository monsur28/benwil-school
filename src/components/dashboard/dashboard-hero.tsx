import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"
import { UserPlus, Sparkles, ArrowRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/format"

interface DashboardHeroProps {
  userName: string
  schoolName: string
  sessionYear?: string
}

export async function DashboardHero({
  userName,
  schoolName,
  sessionYear = "2026",
}: DashboardHeroProps) {
  const [t, locale] = await Promise.all([
    getTranslations("dashboard.admin.hero"),
    getLocale(),
  ])

  const now = new Date()
  const hours = now.getHours()
  const greeting =
    hours < 12
      ? t("greetingMorning")
      : hours < 18
        ? t("greetingAfternoon")
        : t("greetingEvening")

  const dateFormatted = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(now)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-card via-card to-muted/30 p-6 shadow-xs">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {greeting}, {userName} <span className="inline-block animate-wave">👋</span>
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success-light px-2.5 py-0.5 text-[11px] font-semibold text-success">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              {t("liveCampus")}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            {t("subtitle", { schoolName, date: dateFormatted })}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-brand-navy" />
              {t("academicSession", { year: formatNumber(sessionYear, locale) })}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Sparkles className="size-3 text-dashboard-yellow" />
              {t("allSystemsNominal")}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 rounded-xl text-xs font-medium"
            render={<Link href="/students" />}
          >
            <span>{t("directory")}</span>
            <ArrowRight className="size-3 text-muted-foreground" />
          </Button>

          <Button
            nativeButton={false}
            size="sm"
            className="h-9 gap-2 rounded-xl font-semibold shadow-xs transition-all"
            render={<Link href="/students/new" />}
          >
            <UserPlus className="size-3.5" />
            <span>{t("addStudent")}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

