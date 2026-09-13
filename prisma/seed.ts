import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const DEV_PASSWORD = "Passw0rd!"

const SEED_USERS: { name: string; email: string; role: Role }[] = [
  { name: "Super Admin", email: "super.admin@benwil.test", role: Role.SUPER_ADMIN },
  { name: "School Admin", email: "school.admin@benwil.test", role: Role.SCHOOL_ADMIN },
  { name: "Principal", email: "principal@benwil.test", role: Role.PRINCIPAL },
  { name: "Teacher", email: "teacher@benwil.test", role: Role.TEACHER },
  { name: "Accountant", email: "accountant@benwil.test", role: Role.ACCOUNTANT },
  { name: "Librarian", email: "librarian@benwil.test", role: Role.LIBRARIAN },
  { name: "HR", email: "hr@benwil.test", role: Role.HR },
  { name: "Student", email: "student@benwil.test", role: Role.STUDENT },
  { name: "Guardian", email: "guardian@benwil.test", role: Role.GUARDIAN },
]

async function main() {
  const school = await prisma.school.upsert({
    where: { id: "seed-school" },
    update: {},
    create: { id: "seed-school", name: "Benwil Model School" },
  })

  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12)

  for (const user of SEED_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, schoolId: school.id, passwordHash },
    })
  }

  // Minimum academic structure so the student admission form has real
  // classes/sections to assign to. Managing these is a later phase; for now
  // they only exist so Student records have something to point at.
  const academicYear = await prisma.academicYear.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "2026" } },
    update: {},
    create: { schoolId: school.id, name: "2026", isActive: true },
  })

  for (let order = 1; order <= 10; order += 1) {
    const klass = await prisma.class.upsert({
      where: { schoolId_name: { schoolId: school.id, name: `Class ${order}` } },
      update: {},
      create: { schoolId: school.id, name: `Class ${order}`, order },
    })

    await prisma.section.upsert({
      where: { classId_name: { classId: klass.id, name: "A" } },
      update: {},
      create: { classId: klass.id, name: "A" },
    })
  }

  console.log(`Seeded ${SEED_USERS.length} users for "${school.name}".`)
  console.log(`All seeded users share the password: ${DEV_PASSWORD}`)
  console.log(`Seeded academic year "${academicYear.name}" with Class 1-10, each with Section A.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
