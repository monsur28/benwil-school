import { getLocale, getTranslations } from "next-intl/server"
import type { AttendanceStatus } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { CalendarCheck } from "lucide-react"

const STATUS_BADGE_VARIANT: Record<AttendanceStatus, "default" | "destructive" | "secondary" | "outline"> = {
  PRESENT: "default",
  ABSENT: "destructive",
  LATE: "secondary",
  LEAVE: "outline",
}

export async function AttendanceTab({ studentId }: { studentId: string }) {
  const [t, locale] = await Promise.all([getTranslations("attendance"), getLocale()])

  const [grouped, recent] = await Promise.all([
    prisma.attendance.groupBy({ by: ["status"], where: { studentId }, _count: { _all: true } }),
    prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
      take: 10,
      select: { date: true, status: true },
    }),
  ])

  const counts: Record<AttendanceStatus, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 }
  for (const group of grouped) counts[group.status] = group._count._all
  const total = counts.PRESENT + counts.ABSENT + counts.LATE + counts.LEAVE
  const percentage = total > 0 ? Math.round((counts.PRESENT / total) * 100) : null

  if (total === 0) {
    return <EmptyState icon={CalendarCheck} title={t("empty.noRecords")} />
  }

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" })

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-8">
          <div>
            <p className="text-3xl font-semibold tracking-tight">{percentage}%</p>
            <p className="text-sm text-muted-foreground">{t("attendancePercentage")}</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span>
              <span className="text-muted-foreground">{t("status.PRESENT")}: </span>
              <span className="font-semibold">{counts.PRESENT}</span>
            </span>
            <span>
              <span className="text-muted-foreground">{t("status.ABSENT")}: </span>
              <span className="font-semibold">{counts.ABSENT}</span>
            </span>
            <span>
              <span className="text-muted-foreground">{t("status.LATE")}: </span>
              <span className="font-semibold">{counts.LATE}</span>
            </span>
            <span>
              <span className="text-muted-foreground">{t("status.LEAVE")}: </span>
              <span className="font-semibold">{counts.LEAVE}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("recentAttendance")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.date")}</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((record) => (
                <TableRow key={record.date.toISOString()}>
                  <TableCell>{dateFormatter.format(record.date)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[record.status]}>
                      {t(`status.${record.status}`)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
