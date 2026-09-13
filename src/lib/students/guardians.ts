import "server-only"
import type { Prisma } from "@prisma/client"
import type { GuardianInput } from "@/lib/validations/student"

// Replaces a student's guardian links. Guardians are upserted by
// (schoolId, phone) so the same parent isn't duplicated across siblings —
// editing one child's guardian info updates the shared guardian record,
// which is correct since it's the same person.
export async function syncStudentGuardians(
  tx: Prisma.TransactionClient,
  schoolId: string,
  studentId: string,
  guardians: GuardianInput[]
) {
  const primaryIndex = Math.max(
    guardians.findIndex((guardian) => guardian.isPrimary),
    0
  )

  await tx.studentGuardian.deleteMany({ where: { studentId } })

  for (const [index, guardian] of guardians.entries()) {
    const record = await tx.guardian.upsert({
      where: { schoolId_phone: { schoolId, phone: guardian.phone } },
      update: {
        name: guardian.name,
        nameBn: guardian.nameBn || null,
        email: guardian.email || null,
        occupation: guardian.occupation || null,
        address: guardian.address || null,
      },
      create: {
        schoolId,
        name: guardian.name,
        nameBn: guardian.nameBn || null,
        phone: guardian.phone,
        email: guardian.email || null,
        occupation: guardian.occupation || null,
        address: guardian.address || null,
      },
    })

    await tx.studentGuardian.create({
      data: {
        studentId,
        guardianId: record.id,
        relation: guardian.relation,
        isPrimary: index === primaryIndex,
      },
    })
  }
}
