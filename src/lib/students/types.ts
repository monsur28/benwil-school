import type { Prisma } from "@prisma/client"

export type StudentWithRelations = Prisma.StudentGetPayload<{
  include: {
    class: true
    section: true
    academicYear: true
    guardians: { include: { guardian: { include: { user: true } } } }
    documents: true
    user: true
  }
}>
