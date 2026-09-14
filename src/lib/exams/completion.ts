import "server-only"
import { prisma } from "@/lib/db/client"

export type ScheduleCompletion = {
  examScheduleId: string
  totalStudents: number
  entered: number
  absent: number
  pending: number
}

export async function getScheduleCompletion(params: {
  examScheduleId: string
  schoolId: string
  classId: string
  academicYearId: string
  sectionId?: string
}): Promise<ScheduleCompletion> {
  const { examScheduleId, schoolId, classId, academicYearId, sectionId } = params

  const [totalStudents, marks] = await Promise.all([
    prisma.student.count({
      where: {
        schoolId,
        classId,
        academicYearId,
        status: "ACTIVE",
        ...(sectionId ? { sectionId } : {}),
      },
    }),
    prisma.examMark.findMany({
      where: {
        examScheduleId,
        ...(sectionId ? { student: { sectionId } } : {}),
      },
      select: { isAbsent: true },
    }),
  ])

  const absent = marks.filter((mark) => mark.isAbsent).length
  const entered = marks.length - absent
  const pending = Math.max(totalStudents - marks.length, 0)

  return { examScheduleId, totalStudents, entered, absent, pending }
}

export type ExamScheduleCompletionRow = ScheduleCompletion & {
  scheduleId: string
  className: string
  subjectName: string
}

export async function getExamCompletion(
  examId: string,
  schoolId: string
): Promise<ExamScheduleCompletionRow[]> {
  const schedules = await prisma.examSchedule.findMany({
    where: { examId, schoolId },
    include: {
      class: { select: { name: true } },
      subject: { select: { name: true } },
      exam: { select: { academicYearId: true } },
    },
    orderBy: [{ class: { order: "asc" } }, { subject: { name: "asc" } }],
  })

  return Promise.all(
    schedules.map(async (schedule) => {
      const completion = await getScheduleCompletion({
        examScheduleId: schedule.id,
        schoolId,
        classId: schedule.classId,
        academicYearId: schedule.exam.academicYearId,
      })
      return {
        ...completion,
        scheduleId: schedule.id,
        className: schedule.class.name,
        subjectName: schedule.subject.name,
      }
    })
  )
}
