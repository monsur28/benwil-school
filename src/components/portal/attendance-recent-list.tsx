import { getLocale, getTranslations } from "next-intl/server"
import type { AttendanceStatus } from "@prisma/client"
import { CalendarCheck } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { Badge } from "@/components/ui/badge"

// Status colour is part of the reading here: a family scanning this list
// should see a run of green with the odd red day, without reading labels.
const STATUS_BADGE_VARIANT: Record<AttendanceStatus, "success" | "destructive" | "warning" | "muted"> = {
  PRESENT: "success",
  ABSENT: "destructive",
  LATE: "warning",
  LEAVE: "muted",
}

export async function AttendanceRecentList({
  records,
}: {
  records: { date: Date; status: AttendanceStatus }[]
}) {
  const [t, tAttendance, locale] = await Promise.all([
    getTranslations("portal"),
    getTranslations("attendance"),
    getLocale(),
  ])

  if (records.length === 0) {
    return <EmptyState icon={CalendarCheck} title={t("empty.noAttendance")} />
  }

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" })

  return (
    <Panel>
      <PanelHeader title={t("cards.attendance")} />
      <ul className="divide-y divide-border-light">
        {records.map((record) => (
          <li
            key={record.date.toISOString()}
            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
          >
            <span className="text-[13px] tabular-nums text-foreground">
              {dateFormatter.format(record.date)}
            </span>
            <Badge variant={STATUS_BADGE_VARIANT[record.status]}>
              {tAttendance(`status.${record.status}`)}
            </Badge>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
