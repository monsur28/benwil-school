import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"
import { ArrowRight, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardHeroProps {
  userName: string
  schoolName: string
  sessionYear?: string
}

/**
 * The dashboard opener.
 *
 * Deliberately *not* a card: the greeting is the page's own voice, so it sits
 * directly on the canvas and closes with a fading rule. Context (date, live
 * status, session) is compressed into a single eyebrow line above the name,
 * which keeps the greeting itself the largest thing on the screen.
 */
export async function DashboardHero({ userName, schoolName, sessionYear = "" }: DashboardHeroProps) {
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
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            <span>{date}</span>
            <span aria-hidden="true" className="text-border-strong">/</span>
            <span className="inline-flex items-center gap-1.5 text-success">
              <span className="size-1.5 rounded-full bg-success" />
              {t("liveCampus")}
            </span>
            {sessionYear && (
              <>
                <span aria-hidden="true" className="text-border-strong">/</span>
                <span>{t("academicSession", { year: sessionYear })}</span>
              </>
            )}
          </p>

          <h1 className="mt-3 font-heading text-[2rem] font-bold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-[2.5rem]">
            {greeting}, {userName}
          </h1>

          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            {t("subtitle", { schoolName, date })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button nativeButton={false} variant="outline" render={<Link href="/students" />}>
            {t("directory")}
            <ArrowRight className="size-4" />
          </Button>
          <Button nativeButton={false} render={<Link href="/students/new" />}>
            <UserPlus className="size-4" />
            {t("addStudent")}
          </Button>
        </div>
      </div>

      <div className="rule-fade h-px w-full" aria-hidden="true" />
    </section>
  )
}
