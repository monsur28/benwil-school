import "server-only"
import { prisma } from "@/lib/db/client"

/**
 * Server-side reads for the leadership dashboard's two newest jobs: telling a
 * principal *what needs action* and giving the attendance chart a real series
 * for every range it offers.
 *
 * Everything here is scoped by the caller's own schoolId and the school's
 * active academic year — the dashboard never takes an id from the client, so
 * these take resolved values and never a request parameter.
 *
 * The hard rule for this module: if the data model cannot answer a question,
 * it returns nothing rather than a plausible-looking number. A dashboard that
 * invents a trend is worse than one that admits it has no history yet.
 */

/** Midnight today, in the same shape Attendance.date (@db.Date) is stored. */
function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

// ---------------------------------------------------------------------------
// Needs attention
// ---------------------------------------------------------------------------

export type AttentionSignals = {
  /** Sections that hold active students but have no register for today. */
  register: { pendingSections: number; totalSections: number }
  /** Exams whose last paper is behind us but whose results are still DRAFT. */
  unpublishedResults: number
  /** Students carrying an unpaid or partly paid fee, and the total owed. */
  dues: { students: number; amount: number }
  /** Notices written but never published — invisible to every portal. */
  draftNotices: number
}

/**
 * The fee totals and the unpublished-results count are passed in rather than
 * read again here: the dashboard already needs both for its own panels, and
 * re-reading them would be the same fact fetched twice in one render.
 */
export async function getAttentionSignals(params: {
  schoolId: string
  academicYearId: string | null
  totalOutstanding: number
  studentsWithOutstandingCount: number
  unpublishedResults: number
}): Promise<AttentionSignals> {
  const {
    schoolId,
    academicYearId,
    totalOutstanding,
    studentsWithOutstandingCount,
    unpublishedResults,
  } = params
  const today = startOfDay(new Date())

  const [sections, sectionsWithRegister, draftNotices] = await Promise.all([
    // Only sections that actually hold students can have a register owing.
    prisma.section.findMany({
      where: {
        isActive: true,
        class: { schoolId },
        students: {
          some: {
            schoolId,
            status: "ACTIVE",
            ...(academicYearId ? { academicYearId } : {}),
          },
        },
      },
      select: { id: true },
    }),
    prisma.attendance.findMany({
      where: { schoolId, date: today },
      distinct: ["sectionId"],
      select: { sectionId: true },
    }),
    prisma.notice.count({ where: { schoolId, status: "DRAFT" } }),
  ])

  const recorded = new Set(sectionsWithRegister.map((row) => row.sectionId))

  return {
    register: {
      totalSections: sections.length,
      pendingSections: sections.filter((section) => !recorded.has(section.id)).length,
    },
    unpublishedResults,
    dues: { students: studentsWithOutstandingCount, amount: totalOutstanding },
    draftNotices,
  }
}

// ---------------------------------------------------------------------------
// Attendance history
// ---------------------------------------------------------------------------

export type AttendanceBucket = {
  /** First day covered by the bucket — the label is formatted by the caller,
      which is the layer that knows the request's locale. */
  start: Date
  end: Date
  present: number
  late: number
  absent: number
  total: number
}

export type AttendanceSeries = {
  sevenDay: AttendanceBucket[]
  thirtyDay: AttendanceBucket[]
  term: AttendanceBucket[]
}

type DayTotals = { present: number; late: number; absent: number; total: number }

const EMPTY_SERIES: AttendanceSeries = { sevenDay: [], thirtyDay: [], term: [] }

/**
 * One grouped read of the school's register history, bucketed three ways for
 * the chart's three ranges. Capped at 180 days: enough for a full term view,
 * short enough that this stays a single small aggregate rather than a scan of
 * every register the school has ever taken.
 *
 * A bucket is only emitted when a register was actually taken inside it, so a
 * quiet week is a gap in the series rather than a run of fake zeroes.
 */
export async function getAttendanceSeries(params: {
  schoolId: string
  academicYearId: string | null
}): Promise<AttendanceSeries> {
  const { schoolId, academicYearId } = params
  const today = startOfDay(new Date())
  const windowStart = addDays(today, -179)

  const rows = await prisma.attendance.groupBy({
    by: ["date", "status"],
    where: {
      schoolId,
      date: { gte: windowStart, lte: today },
      ...(academicYearId ? { academicYearId } : {}),
    },
    _count: true,
  })

  if (rows.length === 0) return EMPTY_SERIES

  const byDay = new Map<number, DayTotals>()
  for (const row of rows) {
    const key = startOfDay(row.date).getTime()
    const totals = byDay.get(key) ?? { present: 0, late: 0, absent: 0, total: 0 }
    if (row.status === "PRESENT") totals.present += row._count
    else if (row.status === "LATE") totals.late += row._count
    else if (row.status === "ABSENT") totals.absent += row._count
    totals.total += row._count
    byDay.set(key, totals)
  }

  const days = Array.from(byDay.entries())
    .sort(([a], [b]) => a - b)
    .map(([time, totals]) => ({ date: new Date(time), ...totals }))

  const merge = (group: typeof days): AttendanceBucket => ({
    start: group[0].date,
    end: group[group.length - 1].date,
    present: group.reduce((sum, day) => sum + day.present, 0),
    late: group.reduce((sum, day) => sum + day.late, 0),
    absent: group.reduce((sum, day) => sum + day.absent, 0),
    total: group.reduce((sum, day) => sum + day.total, 0),
  })

  const groupBy = (keyOf: (date: Date) => string, source: typeof days): AttendanceBucket[] => {
    const groups = new Map<string, typeof days>()
    for (const day of source) {
      const key = keyOf(day.date)
      const group = groups.get(key)
      if (group) group.push(day)
      else groups.set(key, [day])
    }
    return Array.from(groups.values()).map(merge)
  }

  const since = (cutoff: Date) => days.filter((day) => day.date >= cutoff)

  // Week key: the Sunday that starts the day's week, so buckets line up with
  // how a school actually reads a timetable.
  const weekKey = (date: Date) => addDays(date, -date.getUTCDay()).toISOString().slice(0, 10)
  const monthKey = (date: Date) => `${date.getUTCFullYear()}-${date.getUTCMonth()}`

  return {
    sevenDay: since(addDays(today, -6)).map((day) => merge([day])),
    thirtyDay: groupBy(weekKey, since(addDays(today, -29))),
    term: groupBy(monthKey, days),
  }
}

/**
 * Turns a bucket into the percentages the chart plots. A bucket with no
 * register returns null rather than 0% — "nobody came" and "nobody counted"
 * are different facts and must never render the same.
 */
export function bucketRates(bucket: AttendanceBucket): { present: number; late: number; absent: number } | null {
  if (bucket.total === 0) return null
  const round = (value: number) => Math.round((value / bucket.total) * 1000) / 10
  return { present: round(bucket.present), late: round(bucket.late), absent: round(bucket.absent) }
}
