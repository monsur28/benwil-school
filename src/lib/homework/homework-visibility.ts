import "server-only"
import { prisma } from "@/lib/db/client"
import type { HomeworkListItem } from "@/lib/homework/get-homework"

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
} as const

// Portal visibility - students and their guardians. A student and their
// guardian see the exact same homework for that student (published, same
// school + academic year + class + section), so this one pair of functions
// serves both /portal/student/homework and the guardian's per-child
// /portal/guardian/children/[studentId]/homework - there is no separate
// "guardian" audience concept for homework the way Notices has GUARDIANS
// vs STUDENTS, since homework is always tied to one student's actual class
// placement, not a broadcast audience type.
export async function getVisibleHomeworkForStudent(args: {
  schoolId: string
  academicYearId: string
  classId: string
  sectionId: string
  subjectId?: string
  skip?: number
  take?: number
}): Promise<{ homework: HomeworkListItem[]; total: number }> {
  const where = {
    schoolId: args.schoolId,
    academicYearId: args.academicYearId,
    classId: args.classId,
    sectionId: args.sectionId,
    status: "PUBLISHED" as const,
    ...(args.subjectId && { subjectId: args.subjectId }),
  }

  const [homework, total] = await Promise.all([
    prisma.homework.findMany({
      where,
      select: HOMEWORK_SELECT,
      orderBy: { dueDate: "asc" },
      skip: args.skip,
      take: args.take,
    }),
    prisma.homework.count({ where }),
  ])

  return { homework: homework as HomeworkListItem[], total }
}

// Detail-page guard: returns null on any mismatch (school, academic year,
// class, section, or not yet/no longer published) so the calling page can
// do one `if (!homework) notFound()` and never rely on the list having
// already filtered correctly - the same posture as getNoticeForStudent.
export async function getHomeworkDetailForStudent(args: {
  schoolId: string
  homeworkId: string
  academicYearId: string
  classId: string
  sectionId: string
}): Promise<HomeworkListItem | null> {
  const homework = await prisma.homework.findFirst({
    where: {
      id: args.homeworkId,
      schoolId: args.schoolId,
      academicYearId: args.academicYearId,
      classId: args.classId,
      sectionId: args.sectionId,
      status: "PUBLISHED",
    },
    select: HOMEWORK_SELECT,
  })
  return homework as HomeworkListItem | null
}
