import { getTranslations, getLocale } from "next-intl/server"
import { CalendarDays, Clock, MapPin, User as UserIcon } from "lucide-react"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getRolesForHref } from "@/lib/permissions/nav"
import { pickLocalized } from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { AcademicsSubNav } from "@/components/academics/academics-subnav"
import {
  RoutineEntryDialog,
  type RoutineClassSubject,
  type RoutineTeacherAssignment,
} from "@/components/academics/routine-entry-dialog"
import { DeleteRoutineButton } from "@/components/academics/delete-routine-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  ORDERED_DAYS_OF_WEEK,
  getRoutineForClassSection,
} from "@/lib/academics/routine"

export default async function ClassRoutinePage({
  searchParams,
}: {
  searchParams: Promise<{
    academicYearId?: string
    classId?: string
    sectionId?: string
  }>
}) {
  const user = await requireRole(...getRolesForHref("/academics/routine"))
  const t = await getTranslations("routine")
  const tAcademics = await getTranslations("academics")
  const locale = await getLocale()
  const { academicYearId, classId, sectionId } = await searchParams

  const [academicYears, classes, sections] = await Promise.all([
    prisma.academicYear.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { name: "desc" },
      select: { id: true, name: true, isActive: true },
    }),
    prisma.class.findMany({
      where: { schoolId: user.schoolId, isActive: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
    prisma.section.findMany({
      where: { class: { schoolId: user.schoolId }, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, classId: true, name: true },
    }),
  ])

  const selectedYearId =
    academicYearId ??
    academicYears.find((y) => y.isActive)?.id ??
    academicYears[0]?.id ??
    ""

  const selectedClassId = classId ?? classes[0]?.id ?? ""

  const availableSections = sections.filter((s) => s.classId === selectedClassId)
  const selectedSectionId =
    sectionId && availableSections.some((s) => s.id === sectionId)
      ? sectionId
      : availableSections[0]?.id ?? ""

  const selectedClass = classes.find((c) => c.id === selectedClassId)
  const selectedSection = availableSections.find((s) => s.id === selectedSectionId)

  // Fetch class subjects and teacher assignments for the selected class/section
  const [classSubjectRows, assignmentRows, routineEntries] = await Promise.all([
    selectedClassId
      ? prisma.classSubject.findMany({
          where: { classId: selectedClassId, class: { schoolId: user.schoolId } },
          include: { subject: true },
          orderBy: { subject: { name: "asc" } },
        })
      : [],
    selectedClassId && selectedSectionId
      ? prisma.teacherAssignment.findMany({
          where: {
            schoolId: user.schoolId,
            classId: selectedClassId,
            sectionId: selectedSectionId,
            ...(selectedYearId && {
              OR: [{ academicYearId: selectedYearId }, { academicYearId: null }],
            }),
          },
          include: { teacher: true, subject: true },
        })
      : [],
    selectedYearId && selectedClassId && selectedSectionId
      ? getRoutineForClassSection({
          schoolId: user.schoolId,
          academicYearId: selectedYearId,
          classId: selectedClassId,
          sectionId: selectedSectionId,
        })
      : [],
  ])

  const classSubjects: RoutineClassSubject[] = classSubjectRows.map((cs) => ({
    subjectId: cs.subject.id,
    subjectName: pickLocalized(cs.subject.name, cs.subject.nameBn, locale),
  }))

  const teacherAssignments: RoutineTeacherAssignment[] = assignmentRows.map((a) => ({
    subjectId: a.subject.id,
    teacherId: a.teacher.id,
    teacherName: a.teacher.name,
  }))

  // Distinct periods present
  const allPeriods = Array.from(
    new Set(routineEntries.map((e) => e.periodNumber))
  ).sort((a, b) => a - b)
  const periodsToDisplay = allPeriods.length > 0 ? allPeriods : [1, 2, 3, 4, 5, 6]

  // Map of [day][period] -> routine entry
  const entryMatrix = new Map<string, typeof routineEntries[0]>()
  routineEntries.forEach((entry) => {
    entryMatrix.set(`${entry.dayOfWeek}_${entry.periodNumber}`, entry)
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={
          selectedClass && selectedSection
            ? `${selectedClass.name} — ${selectedSection.name}`
            : t("description")
        }
        actions={
          selectedYearId &&
          selectedClassId &&
          selectedSectionId &&
          classSubjects.length > 0 &&
          teacherAssignments.length > 0 ? (
            <RoutineEntryDialog
              academicYearId={selectedYearId}
              classId={selectedClassId}
              sectionId={selectedSectionId}
              classSubjects={classSubjects}
              teacherAssignments={teacherAssignments}
            />
          ) : null
        }
      />
      <AcademicsSubNav />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-2xs">
        <form className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto" method="GET">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              {t("selectYear")}:
            </span>
            <NativeSelect name="academicYearId" defaultValue={selectedYearId} className="h-9">
              {academicYears.map((y) => (
                <NativeSelectOption key={y.id} value={y.id}>
                  {y.name} {y.isActive ? "(Active)" : ""}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              {t("selectClass")}:
            </span>
            <NativeSelect name="classId" defaultValue={selectedClassId} className="h-9">
              {classes.map((c) => (
                <NativeSelectOption key={c.id} value={c.id}>
                  {c.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              {t("selectSection")}:
            </span>
            <NativeSelect name="sectionId" defaultValue={selectedSectionId} className="h-9">
              {availableSections.map((s) => (
                <NativeSelectOption key={s.id} value={s.id}>
                  {s.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <Button type="submit" variant="outline" size="sm" className="h-9">
            {tAcademics("classDetail.addSubject", { fallback: "Filter" })}
          </Button>
        </form>
      </div>

      {/* Empty State */}
      {routineEntries.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t("noRoutineFound")}
          description={
            classSubjects.length === 0
              ? tAcademics("assignments.noSubjectsForClass")
              : teacherAssignments.length === 0
              ? tAcademics("assignments.empty")
              : undefined
          }
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
                      className="p-3 text-xs font-bold text-brand-navy uppercase tracking-wider min-w-[150px]"
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
                          <td key={day} className="p-2 align-top text-xs text-muted-foreground/40">
                            <span className="inline-block p-2 text-[11px]">—</span>
                          </td>
                        )
                      }
                      return (
                        <td key={day} className="p-2 align-top">
                          <div className="group relative flex flex-col gap-1 rounded-lg border border-border/80 bg-background p-2.5 shadow-2xs hover:border-brand-navy/30 transition-all">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-brand-navy truncate">
                                {pickLocalized(entry.subject.name, entry.subject.nameBn, locale)}
                              </span>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                <RoutineEntryDialog
                                  academicYearId={selectedYearId}
                                  classId={selectedClassId}
                                  sectionId={selectedSectionId}
                                  classSubjects={classSubjects}
                                  teacherAssignments={teacherAssignments}
                                  entry={{
                                    id: entry.id,
                                    dayOfWeek: entry.dayOfWeek,
                                    periodNumber: entry.periodNumber,
                                    startTime: entry.startTime,
                                    endTime: entry.endTime,
                                    subjectId: entry.subjectId,
                                    teacherId: entry.teacherId,
                                    room: entry.room,
                                  }}
                                  trigger={
                                    <button
                                      type="button"
                                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                                      title={t("editEntry")}
                                    >
                                      <Clock className="size-3" />
                                    </button>
                                  }
                                />
                                <DeleteRoutineButton id={entry.id} />
                              </div>
                            </div>
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
          <div className="block md:hidden space-y-4">
            {ORDERED_DAYS_OF_WEEK.map((day) => {
              const dayEntries = routineEntries.filter((e) => e.dayOfWeek === day)
              if (dayEntries.length === 0) return null

              return (
                <div
                  key={day}
                  className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="text-sm font-bold text-brand-navy">{t(`days.${day}`)}</h3>
                    <Badge variant="outline" className="text-[10px]">
                      {dayEntries.length} {dayEntries.length === 1 ? "Class" : "Classes"}
                    </Badge>
                  </div>

                  <div className="divide-y divide-border">
                    {dayEntries.map((entry) => (
                      <div key={entry.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-brand-navy">
                            {t("periodNumber", { number: entry.periodNumber })}:{" "}
                            {pickLocalized(entry.subject.name, entry.subject.nameBn, locale)}
                          </span>
                          <div className="flex items-center gap-1">
                            <RoutineEntryDialog
                              academicYearId={selectedYearId}
                              classId={selectedClassId}
                              sectionId={selectedSectionId}
                              classSubjects={classSubjects}
                              teacherAssignments={teacherAssignments}
                              entry={{
                                id: entry.id,
                                dayOfWeek: entry.dayOfWeek,
                                periodNumber: entry.periodNumber,
                                startTime: entry.startTime,
                                endTime: entry.endTime,
                                subjectId: entry.subjectId,
                                teacherId: entry.teacherId,
                                room: entry.room,
                              }}
                              trigger={
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                  {t("editEntry")}
                                </Button>
                              }
                            />
                            <DeleteRoutineButton id={entry.id} />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            <span className="font-mono">
                              {entry.startTime} – {entry.endTime}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <UserIcon className="size-3" />
                            <span>{entry.teacher.name}</span>
                          </span>
                          {entry.room && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3" />
                              <span>{entry.room}</span>
                            </span>
                          )}
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
