import "server-only"
import { prisma } from "@/lib/db/client"

// One teacher can have several TeacherAssignment rows for the same
// class+section (one per subject); this collapses them to the distinct
// class+section pairs a teacher actually has any standing in, which is what
// attendance authorization (a per-section concept, not per-subject) needs.
export async function getTeacherClassSectionPairs(teacherId: string) {
  return prisma.teacherAssignment.findMany({
    where: { teacherId },
    select: { classId: true, sectionId: true },
    distinct: ["classId", "sectionId"],
  })
}

export async function isTeacherAssignedToSection(
  teacherId: string,
  classId: string,
  sectionId: string
) {
  const match = await prisma.teacherAssignment.findFirst({
    where: { teacherId, classId, sectionId },
    select: { id: true },
  })
  return Boolean(match)
}
