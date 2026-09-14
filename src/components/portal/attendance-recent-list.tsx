import { getLocale, getTranslations } from "next-intl/server"
import type { AttendanceStatus } from "@prisma/client"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { CalendarCheck } from "lucide-react"

const STATUS_BADGE_VARIANT: Record<AttendanceStatus, "default" | "destructive" | "secondary" | "outline"> = {
  PRESENT: "default",
  ABSENT: "destructive",
  LATE: "secondary",
  LEAVE: "outline",
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
    <div className="divide-y rounded-lg border">
      {records.map((record) => (
        <div key={record.date.toISOString()} className="flex items-center justify-between px-4 py-2.5 text-sm">
          <span>{dateFormatter.format(record.date)}</span>
          <Badge variant={STATUS_BADGE_VARIANT[record.status]}>{tAttendance(`status.${record.status}`)}</Badge>
        </div>
      ))}
    </div>
  )
}
