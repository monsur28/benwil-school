import "server-only"
import { cache } from "react"
import { notFound } from "next/navigation"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"

// Every portal page resolves "who am I" from the session, never from a
// route/query param - session.userId is the only trustworthy identity
// input. A STUDENT/GUARDIAN user with no linked record yet (an account
// created but never attached to a Student/Guardian row) has nothing to
// show, which is a data problem, not a routing one - notFound() rather
// than pretending an empty dashboard is normal.

// Memoized per request: the layout and the page both need this, and
// without caching that would be two identical round trips per request.
export const requireStudentIdentity = cache(async () => {
  const user = await requireRole(Role.STUDENT)

  const student = await prisma.student.findFirst({
    where: { userId: user.userId, schoolId: user.schoolId },
    include: { class: true, section: true, academicYear: true },
  })
  if (!student) notFound()

  return { user, student }
})

export type GuardianChild = {
  id: string
  name: string
  studentUid: string
  className: string
  sectionName: string
}

export const requireGuardianIdentity = cache(async () => {
  const user = await requireRole(Role.GUARDIAN)

  const guardian = await prisma.guardian.findFirst({
    where: { userId: user.userId, schoolId: user.schoolId },
  })
  if (!guardian) notFound()

  const links = await prisma.studentGuardian.findMany({
    where: { guardianId: guardian.id },
    include: { student: { include: { class: true, section: true } } },
    orderBy: { student: { name: "asc" } },
  })
  // Defense in depth: a linked student must still belong to the guardian's
  // own school (schoolId is already implied by the guardian record itself,
  // but this keeps the filter explicit rather than assumed).
  const children: GuardianChild[] = links
    .filter((link) => link.student.schoolId === guardian.schoolId)
    .map((link) => ({
      id: link.student.id,
      name: link.student.name,
      studentUid: link.student.studentUid,
      className: link.student.class.name,
      sectionName: link.student.section.name,
    }))

  return { user, guardian, children }
})

// The server-side check the spec calls "critical": a guardian must never
// reach another family's student by editing the URL. Every guardian portal
// route for a specific child must go through this, not just check that
// *some* child is selected.
export const requireGuardianChild = cache(
  async (guardianId: string, studentId: string, schoolId: string) => {
    const link = await prisma.studentGuardian.findFirst({
      where: { guardianId, studentId, student: { schoolId } },
      include: { student: { include: { class: true, section: true, academicYear: true } } },
    })
    if (!link) notFound()

    return link.student
  }
)
