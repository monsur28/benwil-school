import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { getTeacherAssignmentTriples } from "@/lib/academics/teacher-assignments"
import { checkScheduleAccess } from "@/lib/exams/schedule-access"
import { getScheduleCompletion } from "@/lib/exams/completion"
import { PageHeader } from "@/components/shared/page-header"
import { ExamsSubNav } from "@/components/exams/exams-subnav"
import { MarksEntryControls } from "@/components/exams/marks-entry-controls"
import { MarksEntryForm } from "@/components/exams/marks-entry-form"

const ADMIN_ROLES: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export default async function MarksEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireRole(...getRolesForHref("/exams"))
  const { examId } = await params
  const query = await searchParams
  const t = await getTranslations("exams")

  const exam = await prisma.exam.findFirst({ where: { id: examId, schoolId: user.schoolId } })
  if (!exam) {
    notFound()
  }

  const allSchedules = await prisma.examSchedule.findMany({
    where: { examId, schoolId: user.schoolId },
    include: { class: true, subject: true },
  })

  const isAdmin = ADMIN_ROLES.includes(user.role)
  let allowedSchedules = allSchedules
  let allowedSections: { id: string; name: string; classId: string }[] = []

  if (isAdmin) {
    allowedSections = await prisma.section.findMany({
      where: { class: { schoolId: user.schoolId } },
      select: { id: true, name: true, classId: true },
    })
  } else {
    // Marks entry is scoped to THIS exam's own academic year - a teacher's
    // assignment from a different year must not authorize them here, even
    // if that other year is currently active.
    const triples = await getTeacherAssignmentTriples(user.userId, exam.academicYearId)
    allowedSchedules = allSchedules.filter((schedule) =>
      triples.some((triple) => triple.classId === schedule.classId && triple.subjectId === schedule.subjectId)
    )
    const sectionIds = Array.from(new Set(triples.map((triple) => triple.sectionId)))
    const sections = await prisma.section.findMany({
      where: { id: { in: sectionIds } },
      select: { id: true, name: true, classId: true },
    })
    allowedSections = sections.filter((section) =>
      triples.some((triple) => triple.classId === section.classId && triple.sectionId === section.id)
    )
  }

  const getParam = (key: string) => {
    const value = query[key]
    return typeof value === "string" ? value : undefined
  }

  const classes = Array.from(
    new Map(
      allowedSchedules.map((schedule) => [schedule.classId, { id: schedule.classId, name: schedule.class.name }])
    ).values()
  )

  const requestedClassId = getParam("classId")
  const selectedClassId =
    requestedClassId && classes.some((cls) => cls.id === requestedClassId) ? requestedClassId : classes[0]?.id

  const schedulesForClass = allowedSchedules.filter((schedule) => schedule.classId === selectedClassId)
  const requestedSubjectId = getParam("subjectId")
  const selectedSubjectId =
    requestedSubjectId && schedulesForClass.some((schedule) => schedule.subjectId === requestedSubjectId)
      ? requestedSubjectId
      : schedulesForClass[0]?.subjectId

  const sectionsForClass = allowedSections.filter((section) => section.classId === selectedClassId)
  const requestedSectionId = getParam("sectionId")
  const selectedSectionId =
    requestedSectionId && sectionsForClass.some((section) => section.id === requestedSectionId)
      ? requestedSectionId
      : sectionsForClass[0]?.id

  const resolvedSchedule = schedulesForClass.find((schedule) => schedule.subjectId === selectedSubjectId)

  const controls = (
    <MarksEntryControls
      classes={classes}
      sections={sectionsForClass}
      subjects={schedulesForClass.map((schedule) => ({ id: schedule.subjectId, name: schedule.subject.name }))}
      selectedClassId={selectedClassId}
      selectedSectionId={selectedSectionId}
      selectedSubjectId={selectedSubjectId}
    />
  )

  if (!resolvedSchedule || !selectedSectionId) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("detail.enterMarks")} />
        <ExamsSubNav />
        {controls}
        <p className="text-sm text-muted-foreground">{t("marks.noScheduleSelected")}</p>
      </div>
    )
  }

  // Re-validate server-side regardless of how classId/sectionId/subjectId
  // ended up selected above (dropdown, default, or a tampered URL) — this is
  // the actual authorization gate, not the dropdown filtering.
  const access = await checkScheduleAccess(user, resolvedSchedule.id, selectedSectionId)
  if (!access.ok) {
    if (access.reason === "unauthorized") {
      redirect("/unauthorized")
    }
    notFound()
  }

  const students = await prisma.student.findMany({
    where: {
      schoolId: user.schoolId,
      classId: access.schedule.classId,
      sectionId: access.section.id,
      academicYearId: access.schedule.academicYearId,
      status: "ACTIVE",
    },
    orderBy: { roll: "asc" },
  })
  const existingMarks = await prisma.examMark.findMany({
    where: { examScheduleId: access.schedule.id, studentId: { in: students.map((student) => student.id) } },
  })
  const markByStudent = new Map(existingMarks.map((mark) => [mark.studentId, mark]))

  const roster = students.map((student) => {
    const mark = markByStudent.get(student.id)
    return {
      studentId: student.id,
      roll: student.roll,
      admissionNumber: student.admissionNumber,
      name: student.name,
      marks: mark?.marks ?? null,
      isAbsent: mark?.isAbsent ?? false,
    }
  })

  const completion = await getScheduleCompletion({
    examScheduleId: access.schedule.id,
    schoolId: user.schoolId,
    classId: access.schedule.classId,
    academicYearId: access.schedule.academicYearId,
    sectionId: access.section.id,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("detail.enterMarks")}
        description={t("detail.completion", {
          entered: completion.entered,
          absent: completion.absent,
          pending: completion.pending,
          total: completion.totalStudents,
        })}
      />
      <ExamsSubNav />
      {controls}
      <MarksEntryForm
        // Force a fresh mount whenever the resolved schedule+section changes
        // (switching class/section/subject in the controls above) — without
        // this key, React preserves the component instance and its internal
        // roster state across the prop change, showing the previous
        // section's students until a full page reload.
        key={`${access.schedule.id}:${access.section.id}`}
        examScheduleId={access.schedule.id}
        sectionId={access.section.id}
        fullMarks={access.schedule.fullMarks}
        homeworkMaxMarks={access.schedule.homeworkMaxMarks}
        roster={roster}
      />
    </div>
  )
}
