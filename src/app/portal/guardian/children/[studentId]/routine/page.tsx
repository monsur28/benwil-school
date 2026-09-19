import { notFound } from "next/navigation"
import { getTranslations, getLocale } from "next-intl/server"
import { CalendarDays, Clock, User as UserIcon } from "lucide-react"
import { requireGuardianIdentity, requireGuardianChild } from "@/lib/portal/identity"
import { pickLocalized } from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { ORDERED_DAYS_OF_WEEK, getGuardianChildRoutine } from "@/lib/academics/routine"

export default async function GuardianChildRoutinePage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { user, guardian } = await requireGuardianIdentity()
  const { studentId } = await params
  await requireGuardianChild(guardian.id, studentId, user.schoolId)
  const [t, locale] = await Promise.all([getTranslations("routine"), getLocale()])

  const result = await getGuardianChildRoutine({
    guardianId: guardian.id,
    studentId,
    schoolId: user.schoolId,
  })

  if (!result) {
    notFound()
  }

  const { student, entries } = result

  // Group entries by day
  const entriesByDay = new Map<string, typeof entries>()
  for (const day of ORDERED_DAYS_OF_WEEK) {
    entriesByDay.set(
      day,
      entries.filter((e) => e.dayOfWeek === day)
    )
  }

  const allPeriods = Array.from(new Set(entries.map((e) => e.periodNumber))).sort((a, b) => a - b)
  const periodsToDisplay = allPeriods.length > 0 ? allPeriods : [1, 2, 3, 4, 5, 6]

  const entryMatrix = new Map<string, typeof entries[0]>()
  entries.forEach((e) => {
    entryMatrix.set(`${e.dayOfWeek}_${e.periodNumber}`, e)
  })

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("title")}
        description={`${student.name} — ${student.class.name} (${student.section.name}), Roll ${student.roll}`}
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t("noRoutineFound")}
          description={t("noClassesToday")}
        />
      ) : (
        <>
          {/* Desktop Weekly Grid (hidden below md) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider w-24">
                    {t("period")}
                  </th>
                  {ORDERED_DAYS_OF_WEEK.map((day) => (
                    <th
                      key={day}
                      className="p-3 text-xs font-bold text-brand-navy uppercase tracking-wider min-w-[140px]"
                    >
                      {t(`days.${day}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {periodsToDisplay.map((period) => (
                  <tr key={period} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-semibold text-brand-navy bg-muted/20 align-top">
                      <div className="text-xs font-bold">{t("periodNumber", { number: period })}</div>
                    </td>
                    {ORDERED_DAYS_OF_WEEK.map((day) => {
                      const entry = entryMatrix.get(`${day}_${period}`)
                      if (!entry) {
                        return (
                          <td key={day} className="p-2 align-top text-xs text-muted-foreground/30">
                            <span className="inline-block p-2 text-[11px]">—</span>
                          </td>
                        )
                      }
                      return (
                        <td key={day} className="p-2 align-top">
                          <div className="flex flex-col gap-1 rounded-lg border border-border/80 bg-background p-2.5 shadow-2xs hover:border-brand-navy/30 transition-all">
                            <span className="font-bold text-xs text-brand-navy truncate">
                              {pickLocalized(entry.subject.name, entry.subject.nameBn, locale)}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <UserIcon className="size-3 shrink-0" />
                              <span className="truncate">{entry.teacher.name}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                              <span className="font-mono font-medium">
                                {entry.startTime} – {entry.endTime}
                              </span>
                              {entry.room && (
                                <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
                                  {entry.room}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View (displayed on < md, perfect for 390px screens) */}
          <div className="block md:hidden space-y-3">
            {ORDERED_DAYS_OF_WEEK.map((day) => {
              const dayEntries = entriesByDay.get(day) ?? []
              if (dayEntries.length === 0) return null

              return (
                <div
                  key={day}
                  className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="text-sm font-bold text-brand-navy">{t(`days.${day}`)}</h3>
                    <Badge variant="outline" className="text-[10px]">
                      {dayEntries.length} {dayEntries.length === 1 ? "Class" : "Classes"}
                    </Badge>
                  </div>

                  <div className="divide-y divide-border">
                    {dayEntries.map((entry) => (
                      <div key={entry.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-brand-navy">
                            {t("periodNumber", { number: entry.periodNumber })}:{" "}
                            {pickLocalized(entry.subject.name, entry.subject.nameBn, locale)}
                          </span>
                          {entry.room && (
                            <Badge variant="secondary" className="text-[9px]">
                              {entry.room}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            <span className="font-mono text-[11px]">
                              {entry.startTime} – {entry.endTime}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <UserIcon className="size-3" />
                            <span className="text-[11px]">{entry.teacher.name}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
