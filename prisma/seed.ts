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
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PROD_SEED !== "true") {
    console.error("FATAL: Refusing to run dev seed script against production environment (NODE_ENV=production).")
    console.error("Set ALLOW_PROD_SEED=true if you explicitly intend to seed dummy accounts into this environment.")
    process.exit(1)
  }

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

  // --- Phase 5 fixtures: subjects, class-subjects, and a teacher-assignment ---
  // --- scoped student roster for exam/marks-entry testing.                 ---
  //
  // Note: this school already has real organic data from manual QA (Mathematics/
  // English/Science subjects, a Class 5 Section B, a TeacherAssignment for
  // teacher@benwil.test -> Class 5 / Section A / Mathematics, and a handful of
  // students). Rather than creating a disconnected parallel fixture on Class 7,
  // this extends that existing structure in place: Class 5 already has the
  // exact two-section shape (A + B) the exam authorization tests need, and the
  // existing TeacherAssignment already is the "teacher assigned to one
  // class+section+subject" scenario the spec asks for.
  const subjectDefs = [
    { name: "Mathematics", nameBn: "গণিত", code: "MATH" },
    { name: "English", nameBn: "ইংরেজি", code: "ENG" },
    { name: "Bangla", nameBn: "বাংলা", code: "BAN" },
    { name: "Science", nameBn: "বিজ্ঞান", code: "SCI" },
    { name: "Social Science", nameBn: "সমাজবিজ্ঞান", code: "SST" },
  ]
  const subjects = []
  for (const def of subjectDefs) {
    const subject = await prisma.subject.upsert({
      where: { schoolId_code: { schoolId: school.id, code: def.code } },
      update: {},
      create: { schoolId: school.id, name: def.name, nameBn: def.nameBn, code: def.code },
    })
    subjects.push(subject)
  }

  const allClasses = await prisma.class.findMany({ where: { schoolId: school.id } })
  for (const cls of allClasses) {
    for (const subject of subjects) {
      await prisma.classSubject.upsert({
        where: { classId_subjectId: { classId: cls.id, subjectId: subject.id } },
        update: {},
        create: { classId: cls.id, subjectId: subject.id },
      })
    }
  }

  const class5 = allClasses.find((c) => c.name === "Class 5")!
  const class8 = allClasses.find((c) => c.name === "Class 8")!
  const class5SectionA = await prisma.section.findFirstOrThrow({ where: { classId: class5.id, name: "A" } })
  const class5SectionB = await prisma.section.upsert({
    where: { classId_name: { classId: class5.id, name: "B" } },
    update: {},
    create: { classId: class5.id, name: "B" },
  })
  const class8SectionA = await prisma.section.findFirstOrThrow({ where: { classId: class8.id, name: "A" } })

  const mathSubject = subjects.find((s) => s.code === "MATH")!
  const teacherUser = await prisma.user.findFirstOrThrow({
    where: { schoolId: school.id, email: "teacher@benwil.test" },
  })
  await prisma.teacherAssignment.upsert({
    where: {
      teacherId_classId_sectionId_subjectId: {
        teacherId: teacherUser.id,
        classId: class5.id,
        sectionId: class5SectionA.id,
        subjectId: mathSubject.id,
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      teacherId: teacherUser.id,
      classId: class5.id,
      sectionId: class5SectionA.id,
      subjectId: mathSubject.id,
    },
  })

  // Top up the roster to 5 students in Section A and 2 in Section B (some of
  // these already exist from manual QA; upsert keeps that data untouched and
  // only adds what's missing).
  const studentDefs = [
    { uid: "STU-0501", adm: "ADM-0501", name: "Nusrat Jahan", section: class5SectionA, roll: 90 },
    { uid: "STU-0502", adm: "ADM-0502", name: "Sabbir Islam", section: class5SectionA, roll: 91 },
    { uid: "STU-0503", adm: "ADM-0503", name: "Tania Akter", section: class5SectionA, roll: 92 },
    { uid: "STU-0504", adm: "ADM-0504", name: "Imran Kabir", section: class5SectionB, roll: 90 },
    { uid: "STU-0801", adm: "ADM-0801", name: "Mizanur Rahman", section: class8SectionA, roll: 1 },
    { uid: "STU-0802", adm: "ADM-0802", name: "Sultana Parvin", section: class8SectionA, roll: 2 },
  ]
  for (const def of studentDefs) {
    await prisma.student.upsert({
      where: { studentUid: def.uid },
      update: {},
      create: {
        schoolId: school.id,
        studentUid: def.uid,
        admissionNumber: def.adm,
        name: def.name,
        dateOfBirth: new Date("2013-01-15"),
        gender: "MALE",
        academicYearId: academicYear.id,
        classId: def.section.classId,
        sectionId: def.section.id,
        roll: def.roll,
      },
    })
  }

  console.log(
    `Seeded ${subjects.length} subjects, linked to all classes, and topped up Class 5 (Sections A/B) + Class 8 (Section A) student rosters for exam testing.`
  )

  // --- Phase 7 fixture: link the pre-existing student@benwil.test /       ---
  // --- guardian@benwil.test seed accounts to one real student, so the    ---
  // --- portal has a deterministic account to log into out of the box.   ---
  const portalStudentUser = await prisma.user.findUniqueOrThrow({ where: { email: "student@benwil.test" } })
  const portalGuardianUser = await prisma.user.findUniqueOrThrow({ where: { email: "guardian@benwil.test" } })
  const linkedStudent = await prisma.student.findUniqueOrThrow({ where: { studentUid: "STU-0501" } })

  await prisma.student.update({
    where: { id: linkedStudent.id },
    data: { userId: portalStudentUser.id },
  })

  const portalGuardian = await prisma.guardian.upsert({
    where: { schoolId_phone: { schoolId: school.id, phone: "01700000000" } },
    update: { userId: portalGuardianUser.id },
    create: {
      schoolId: school.id,
      name: "Portal Test Guardian",
      phone: "01700000000",
      email: "guardian@benwil.test",
      userId: portalGuardianUser.id,
    },
  })
  await prisma.studentGuardian.upsert({
    where: { studentId_guardianId: { studentId: linkedStudent.id, guardianId: portalGuardian.id } },
    update: {},
    create: {
      studentId: linkedStudent.id,
      guardianId: portalGuardian.id,
      relation: "GUARDIAN",
      isPrimary: true,
    },
  })

  console.log(
    `Linked student@benwil.test to student ${linkedStudent.name} (${linkedStudent.studentUid}), and guardian@benwil.test to "Portal Test Guardian" as that student's guardian. Password for both: ${DEV_PASSWORD}`
  )

  // --- Phase 6 fixture: one default grading scale, explicitly labeled as ---
  // --- test/example data, not an official national grading standard.    ---
  const gradingScale = await prisma.gradingScale.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "Default Test Grading Scale" } },
    update: {},
    create: {
      schoolId: school.id,
      name: "Default Test Grading Scale",
      nameBn: "ডিফল্ট পরীক্ষামূলক গ্রেডিং স্কেল",
    },
  })
  const gradeRuleDefs = [
    { min: "80.00", max: "100.00", grade: "A+", gradeBn: "এ প্লাস", point: "5.00" },
    { min: "70.00", max: "79.99", grade: "A", gradeBn: "এ", point: "4.00" },
    { min: "60.00", max: "69.99", grade: "A-", gradeBn: "এ মাইনাস", point: "3.50" },
    { min: "50.00", max: "59.99", grade: "B", gradeBn: "বি", point: "3.00" },
    { min: "40.00", max: "49.99", grade: "C", gradeBn: "সি", point: "2.00" },
    { min: "33.00", max: "39.99", grade: "D", gradeBn: "ডি", point: "1.00" },
    { min: "0.00", max: "32.99", grade: "F", gradeBn: "এফ", point: "0.00" },
  ]
  for (const def of gradeRuleDefs) {
    const existing = await prisma.gradeRule.findFirst({
      where: { gradingScaleId: gradingScale.id, minPercentage: def.min },
    })
    if (!existing) {
      await prisma.gradeRule.create({
        data: {
          gradingScaleId: gradingScale.id,
          minPercentage: def.min,
          maxPercentage: def.max,
          grade: def.grade,
          gradeBn: def.gradeBn,
          gradePoint: def.point,
        },
      })
    }
  }

  console.log(
    `Seeded "${gradingScale.name}" with ${gradeRuleDefs.length} grade rules - this is example/test data, not an official grading standard. Adjust boundaries and grade points to your school's actual policy.`
  )

  // --- Phase 8 fixture: one fee category/structure, assigned to the      ---
  // --- portal test student, with one partial test payment - so the Fees ---
  // --- module has deterministic, non-empty data out of the box.         ---
  const tuitionCategory = await prisma.feeCategory.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "Tuition Fee" } },
    update: {},
    create: { schoolId: school.id, name: "Tuition Fee", nameBn: "বেতন" },
  })

  const class5TuitionStructure = await prisma.feeStructure.upsert({
    where: {
      schoolId_academicYearId_classId_feeCategoryId_name: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        classId: class5.id,
        feeCategoryId: tuitionCategory.id,
        name: "Class 5 Tuition Fee",
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      classId: class5.id,
      feeCategoryId: tuitionCategory.id,
      name: "Class 5 Tuition Fee",
      nameBn: "পঞ্চম শ্রেণির বেতন",
      amount: "1200.00",
      frequency: "MONTHLY",
    },
  })

  const accountantUser = await prisma.user.findFirstOrThrow({
    where: { schoolId: school.id, email: "accountant@benwil.test" },
  })

  const linkedStudentFee = await prisma.studentFee.upsert({
    where: { studentId_feeStructureId: { studentId: linkedStudent.id, feeStructureId: class5TuitionStructure.id } },
    update: {},
    create: {
      schoolId: school.id,
      studentId: linkedStudent.id,
      academicYearId: academicYear.id,
      feeStructureId: class5TuitionStructure.id,
      feeCategoryId: tuitionCategory.id,
      name: class5TuitionStructure.name,
      amount: class5TuitionStructure.amount,
      assignedById: accountantUser.id,
    },
  })

  // A seed script has no logged-in session to call the createPayment server
  // action with, so this mirrors its shape by hand: create the Payment +
  // PaymentAllocation together, update the fee's cached status, and keep
  // the receipt-number sequence in sync - guarded so re-running the seed
  // never creates a second payment.
  const existingSeedPayment = await prisma.payment.findFirst({
    where: { schoolId: school.id, studentId: linkedStudent.id, receiptNumber: "RCPT-2026-000001" },
  })
  if (!existingSeedPayment) {
    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          schoolId: school.id,
          studentId: linkedStudent.id,
          receiptNumber: "RCPT-2026-000001",
          amount: "500.00",
          method: "CASH",
          receivedById: accountantUser.id,
          allocations: {
            create: [{ schoolId: school.id, studentFeeId: linkedStudentFee.id, amount: "500.00" }],
          },
        },
      })
      await tx.studentFee.update({ where: { id: linkedStudentFee.id }, data: { status: "PARTIAL" } })
      await tx.feeReceiptSequence.upsert({
        where: { schoolId_year: { schoolId: school.id, year: 2026 } },
        update: {},
        create: { schoolId: school.id, year: 2026, lastNumber: 1 },
      })
    })
  }

  console.log(
    `Seeded fee category "${tuitionCategory.name}" and structure "${class5TuitionStructure.name}" (1200.00/month), assigned to ${linkedStudent.name} with one 500.00 test payment (receipt RCPT-2026-000001) - example/test data, not real billing.`
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
