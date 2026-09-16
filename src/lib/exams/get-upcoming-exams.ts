import "server-only"
import { prisma } from "@/lib/db/client"
import { format } from "date-fns"

export type UpcomingExam = {
  id: string
  subject: string
  date: string
  time: string
  status: "UPCOMING" | "COMPLETED"
}

export async function getUpcomingExamsForStudent({
  schoolId,
  classId,
  limit = 5,
}: {
  schoolId: string
  classId: string
  limit?: number
}): Promise<UpcomingExam[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const schedules = await prisma.examSchedule.findMany({
    where: {
      schoolId,
      classId,
      exam: {
        resultStatus: "DRAFT", // Finalized exams are usually considered completely done.
      },
    },
    include: {
      subject: {
        select: { name: true },
      },
      exam: {
        select: { endDate: true },
      },
    },
    orderBy: {
      examDate: "asc",
    },
    take: limit,
  })

  return schedules.map((schedule) => {
    const isCompleted = schedule.examDate < today

    return {
      id: schedule.id,
      subject: schedule.subject.name,
      date: format(schedule.examDate, "MMM d, yyyy"),
      time: schedule.startTime && schedule.endTime 
        ? `${schedule.startTime} - ${schedule.endTime}` 
        : schedule.startTime || "Time TBA",
      status: isCompleted ? "COMPLETED" : "UPCOMING",
    }
  })
}
