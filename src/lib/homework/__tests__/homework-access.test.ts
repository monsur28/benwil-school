import "dotenv/config"
import { before, after, describe, it } from "node:test"
import assert from "node:assert/strict"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, Role } from "@prisma/client"
import { checkHomeworkWriteAccess, checkHomeworkOwnership } from "../homework-access"
import { getHomeworkById, getHomeworkList } from "../get-homework"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// Mirrors every DB-hitting test/spec in this repo: real fixtures against the
// real (remote, seeded) database, run-prefixed so this file's own rows never
// collide with the deterministic seed data or another test run.
const RUN_PREFIX = `UnitTest HomeworkAccess ${Date.now()}`

let schoolAId: string
let academicYearId: string
let class5Id: string
let sectionA5Id: string
let class8Id: string
let sectionA8Id: string
let mathSubjectId: string
let englishSubjectId: string
let assignedTeacherId: string
let otherTeacherId: string
let adminUserId: string
let principalId: string

let schoolBId: string

describe("homework authorization (DB-backed)", () => {
  before(async () => {
    const schoolA = await prisma.school.findFirstOrThrow()
    schoolAId = schoolA.id
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId: schoolAId, name: "2026" } })
    academicYearId = academicYear.id
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId: schoolAId, name: "Class 5" } })
    class5Id = class5.id
    const sectionA5 = await prisma.section.findFirstOrThrow({ where: { classId: class5Id, name: "A" } })
    sectionA5Id = sectionA5.id
    const class8 = await prisma.class.findFirstOrThrow({ where: { schoolId: schoolAId, name: "Class 8" } })
    class8Id = class8.id
    const sectionA8 = await prisma.section.findFirstOrThrow({ where: { classId: class8Id, name: "A" } })
    sectionA8Id = sectionA8.id
    const mathSubject = await prisma.subject.findFirstOrThrow({ where: { schoolId: schoolAId, code: "MATH" } })
    mathSubjectId = mathSubject.id
    const englishSubject = await prisma.subject.findFirstOrThrow({ where: { schoolId: schoolAId, code: "ENG" } })
    englishSubjectId = englishSubject.id

    // teacher@benwil.test is seeded with exactly one TeacherAssignment:
    // Class 5 / Section A / Mathematics (see prisma/seed.ts).
    const assignedTeacher = await prisma.user.findFirstOrThrow({
      where: { schoolId: schoolAId, email: "teacher@benwil.test" },
    })
    assignedTeacherId = assignedTeacher.id
    const admin = await prisma.user.findFirstOrThrow({ where: { schoolId: schoolAId, email: "school.admin@benwil.test" } })
    adminUserId = admin.id
    const principal = await prisma.user.findFirstOrThrow({ where: { schoolId: schoolAId, email: "principal@benwil.test" } })
    principalId = principal.id

    // A second teacher, with no assignments at all, purely to prove
    // ownership checks compare teacherId and don't just re-check assignment.
    const otherTeacher = await prisma.user.create({
      data: {
        schoolId: schoolAId,
        name: `${RUN_PREFIX} Other Teacher`,
        email: `${RUN_PREFIX.toLowerCase().replace(/\s+/g, "-")}-teacher@benwil.test`,
        passwordHash: admin.passwordHash,
        role: Role.TEACHER,
      },
    })
    otherTeacherId = otherTeacher.id

    // A second, fully independent school for cross-tenant isolation checks.
    const schoolB = await prisma.school.create({ data: { name: `${RUN_PREFIX} Other School` } })
    schoolBId = schoolB.id
  })

  after(async () => {
    await prisma.homework.deleteMany({ where: { title: { startsWith: RUN_PREFIX } } })
    await prisma.user.delete({ where: { id: otherTeacherId } })
    await prisma.school.delete({ where: { id: schoolBId } })
    await prisma.$disconnect()
  })

  describe("checkHomeworkWriteAccess", () => {
    it("allows a school admin for any class/section/subject in their school", async () => {
      const user = { userId: adminUserId, schoolId: schoolAId, role: Role.SCHOOL_ADMIN, name: "" }
      const result = await checkHomeworkWriteAccess(user, academicYearId, class8Id, sectionA8Id, englishSubjectId)
      assert.equal(result.ok, true)
    })

    it("allows a principal for any class/section/subject in their school", async () => {
      const user = { userId: principalId, schoolId: schoolAId, role: Role.PRINCIPAL, name: "" }
      const result = await checkHomeworkWriteAccess(user, academicYearId, class8Id, sectionA8Id, englishSubjectId)
      assert.equal(result.ok, true)
    })

    it("allows a teacher for their assigned class + section + subject", async () => {
      const user = { userId: assignedTeacherId, schoolId: schoolAId, role: Role.TEACHER, name: "" }
      const result = await checkHomeworkWriteAccess(user, academicYearId, class5Id, sectionA5Id, mathSubjectId)
      assert.equal(result.ok, true)
    })

    it("rejects a teacher for an unassigned class", async () => {
      const user = { userId: assignedTeacherId, schoolId: schoolAId, role: Role.TEACHER, name: "" }
      const result = await checkHomeworkWriteAccess(user, academicYearId, class8Id, sectionA8Id, mathSubjectId)
      assert.equal(result.ok, false)
    })

    it("rejects a teacher for an unassigned subject in an otherwise-assigned class/section", async () => {
      const user = { userId: assignedTeacherId, schoolId: schoolAId, role: Role.TEACHER, name: "" }
      const result = await checkHomeworkWriteAccess(user, academicYearId, class5Id, sectionA5Id, englishSubjectId)
      assert.equal(result.ok, false)
    })

    it("rejects a role with no homework access (e.g. accountant)", async () => {
      const user = { userId: adminUserId, schoolId: schoolAId, role: Role.ACCOUNTANT, name: "" }
      const result = await checkHomeworkWriteAccess(user, academicYearId, class5Id, sectionA5Id, mathSubjectId)
      assert.equal(result.ok, false)
    })
  })

  // PHASE 12: a real assignment scoped to one specific academic year must
  // not authorize a teacher for a different academic year, even for the
  // exact same class/section/subject. The one pre-Phase-11 legacy row
  // (academicYearId: null) is intentionally exempt from this - see the
  // block comment in teacher-assignments.ts - so this uses a FRESH
  // year-scoped assignment to prove the strict-year case specifically.
  describe("checkHomeworkWriteAccess is academic-year scoped", () => {
    let otherYearId: string
    let yearScopedTeacherId: string

    before(async () => {
      const otherYear = await prisma.academicYear.findFirstOrThrow({
        where: { schoolId: schoolAId, id: { not: academicYearId } },
      })
      otherYearId = otherYear.id

      const admin = await prisma.user.findFirstOrThrow({ where: { id: adminUserId } })
      const yearScopedTeacher = await prisma.user.create({
        data: {
          schoolId: schoolAId,
          name: `${RUN_PREFIX} Year Scoped Teacher`,
          email: `${RUN_PREFIX.toLowerCase().replace(/\s+/g, "-")}-year-scoped@benwil.test`,
          passwordHash: admin.passwordHash,
          role: Role.TEACHER,
        },
      })
      yearScopedTeacherId = yearScopedTeacher.id

      // Assigned ONLY in `otherYearId`, never in `academicYearId`.
      await prisma.teacherAssignment.create({
        data: {
          schoolId: schoolAId,
          academicYearId: otherYearId,
          teacherId: yearScopedTeacherId,
          classId: class5Id,
          sectionId: sectionA5Id,
          subjectId: mathSubjectId,
        },
      })
    })

    after(async () => {
      await prisma.teacherAssignment.deleteMany({ where: { teacherId: yearScopedTeacherId } })
      await prisma.user.delete({ where: { id: yearScopedTeacherId } })
    })

    it("authorizes the teacher for the year they're actually assigned in", async () => {
      const user = { userId: yearScopedTeacherId, schoolId: schoolAId, role: Role.TEACHER, name: "" }
      const result = await checkHomeworkWriteAccess(user, otherYearId, class5Id, sectionA5Id, mathSubjectId)
      assert.equal(result.ok, true)
    })

    it("rejects the same teacher/class/section/subject for a DIFFERENT academic year", async () => {
      const user = { userId: yearScopedTeacherId, schoolId: schoolAId, role: Role.TEACHER, name: "" }
      const result = await checkHomeworkWriteAccess(user, academicYearId, class5Id, sectionA5Id, mathSubjectId)
      assert.equal(result.ok, false)
    })
  })

  describe("checkHomeworkOwnership", () => {
    it("allows an admin to manage any teacher's homework", () => {
      const user = { userId: adminUserId, schoolId: schoolAId, role: Role.SCHOOL_ADMIN, name: "" }
      assert.equal(checkHomeworkOwnership(user, assignedTeacherId).ok, true)
    })

    it("allows a teacher to manage their own homework", () => {
      const user = { userId: assignedTeacherId, schoolId: schoolAId, role: Role.TEACHER, name: "" }
      assert.equal(checkHomeworkOwnership(user, assignedTeacherId).ok, true)
    })

    it("rejects a teacher managing another teacher's homework", () => {
      const user = { userId: otherTeacherId, schoolId: schoolAId, role: Role.TEACHER, name: "" }
      assert.equal(checkHomeworkOwnership(user, assignedTeacherId).ok, false)
    })
  })

  describe("school isolation (getHomeworkById / getHomeworkList)", () => {
    it("a homework record is retrievable within its own school", async () => {
      const homework = await prisma.homework.create({
        data: {
          schoolId: schoolAId,
          academicYearId,
          teacherId: assignedTeacherId,
          subjectId: mathSubjectId,
          classId: class5Id,
          sectionId: sectionA5Id,
          title: `${RUN_PREFIX} Own School Homework`,
          instructions: "Test.",
          assignedDate: new Date("2026-09-15"),
          dueDate: new Date("2026-09-20"),
        },
      })

      const found = await getHomeworkById({ schoolId: schoolAId, homeworkId: homework.id })
      assert.ok(found)
      assert.equal(found.id, homework.id)
    })

    it("a homework record is invisible from another school", async () => {
      const homework = await prisma.homework.create({
        data: {
          schoolId: schoolAId,
          academicYearId,
          teacherId: assignedTeacherId,
          subjectId: mathSubjectId,
          classId: class5Id,
          sectionId: sectionA5Id,
          title: `${RUN_PREFIX} Cross Tenant Probe`,
          instructions: "Test.",
          assignedDate: new Date("2026-09-15"),
          dueDate: new Date("2026-09-20"),
        },
      })

      const found = await getHomeworkById({ schoolId: schoolBId, homeworkId: homework.id })
      assert.equal(found, null)
    })

    it("a school-scoped list never includes another school's homework", async () => {
      await prisma.homework.create({
        data: {
          schoolId: schoolAId,
          academicYearId,
          teacherId: assignedTeacherId,
          subjectId: mathSubjectId,
          classId: class5Id,
          sectionId: sectionA5Id,
          title: `${RUN_PREFIX} List Isolation Probe`,
          instructions: "Test.",
          assignedDate: new Date("2026-09-15"),
          dueDate: new Date("2026-09-20"),
        },
      })

      const { homework } = await getHomeworkList({ schoolId: schoolBId })
      assert.equal(
        homework.some((h) => h.title.startsWith(RUN_PREFIX)),
        false
      )
    })
  })
})
