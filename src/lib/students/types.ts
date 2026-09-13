import type { Prisma } from "@prisma/client"

export type StudentWithRelations = Prisma.StudentGetPayload<{
  include: {
    class: true
    section: true
    academicYear: true
    guardians: { include: { guardian: true } }
    documents: true
  }
}>
