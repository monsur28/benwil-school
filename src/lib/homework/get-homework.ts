import "server-only"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/client"

const HOMEWORK_SELECT = {
  id: true,
  schoolId: true,
  academicYearId: true,
  teacherId: true,
  subjectId: true,
  classId: true,
  sectionId: true,
  categoryId: true,
  title: true,
  instructions: true,
  assignedDate: true,
  dueDate: true,
  maxMarks: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  teacher: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true, nameBn: true } },
  class: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
} satisfies Prisma.HomeworkSelect

export type HomeworkListItem = Prisma.HomeworkGetPayload<{ select: typeof HOMEWORK_SELECT }>

// School-scoped list with optional filters - the foundation the future
// admin/teacher list pages will call. No audience/visibility filtering here
// (that's a portal-phase concern, not built yet); this is purely
// school-ownership-scoped, matching the admin-side pattern in
// src/lib/notices/notice-visibility.ts's getAdminNoticeList.
export async function getHomeworkList(args: {
  schoolId: string
  q?: string
  teacherId?: string
  classId?: string
  sectionId?: string
  subjectId?: string
  status?: "DRAFT" | "PUBLISHED"
  skip?: number
  take?: number
}): Promise<{ homework: HomeworkListItem[]; total: number }> {
  const where: Prisma.HomeworkWhereInput = {
    schoolId: args.schoolId,
    ...(args.teacherId && { teacherId: args.teacherId }),
    ...(args.classId && { classId: args.classId }),
    ...(args.sectionId && { sectionId: args.sectionId }),
    ...(args.subjectId && { subjectId: args.subjectId }),
    ...(args.status && { status: args.status }),
    ...(args.q && { title: { contains: args.q, mode: "insensitive" } }),
  }

  const [homework, total] = await Promise.all([
    prisma.homework.findMany({
      where,
      select: HOMEWORK_SELECT,
      orderBy: { dueDate: "desc" },
      skip: args.skip,
      take: args.take,
    }),
    prisma.homework.count({ where }),
  ])

  return { homework, total }
}

// Enforces school ownership by construction: a homeworkId from another
// school simply doesn't match this where clause and returns null, exactly
// like getAdminNotice/getStudentFeeOverview do for their own records.
export async function getHomeworkById(args: { schoolId: string; homeworkId: string }): Promise<HomeworkListItem | null> {
  return prisma.homework.findFirst({
    where: { id: args.homeworkId, schoolId: args.schoolId },
    select: HOMEWORK_SELECT,
  })
}
