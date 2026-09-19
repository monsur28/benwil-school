import "dotenv/config"
import { before, after, describe, it } from "node:test"
import assert from "node:assert/strict"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { getStudentHomeworkAssessmentSummary, getHomeworkAssessmentSummaries } from "../homework-assessment-summary"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// Mirrors homework-access.test.ts: real fixtures against the real (remote,
// seeded) database, run-prefixed so this file's own rows never collide with
// seed data or another test run.
const RUN_PREFIX = `UnitTest HomeworkAssessmentSummary ${Date.now()}`

let schoolAId: string
let academicYearId: string
let class5Id: string
let sectionA5Id: string
let class8Id: string
let sectionA8Id: string
let mathSubjectId: string
let teacherId: string
let studentId: string
let otherStudentId: string

let homeworkAId: string
let homeworkBId: string // different class - simulates a stale cross-class row

describe("homework assessment summary (DB-backed)", () => {
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
    const teacher = await prisma.user.findFirstOrThrow({ where: { schoolId: schoolAId, email: "teacher@benwil.test" } })
    teacherId = teacher.id

    const students = await prisma.student.findMany({
      where: { schoolId: schoolAId, classId: class5Id, sectionId: sectionA5Id, academicYearId },
      take: 2,
    })
    if (students.length < 2) throw new Error("Expected at least 2 seeded students in Class 5 / Section A")
    studentId = students[0].id
    otherStudentId = students[1].id

    const homeworkA = await prisma.homework.create({
      data: {
        schoolId: schoolAId,
        academicYearId,
        teacherId,
        subjectId: mathSubjectId,
        classId: class5Id,
        sectionId: sectionA5Id,
        title: `${RUN_PREFIX} Homework A`,
        instructions: "Practice",
        assignedDate: new Date(),
        dueDate: new Date(),
        maxMarks: 20,
        status: "PUBLISHED",
      },
    })
    homeworkAId = homeworkA.id

    // A homework row in a DIFFERENT class - real students can never submit
    // to this through the normal flow (checkStudentSubmissionEligibility
    // blocks it), but a stale row could exist after a manual class change.
    // The classId filter added in this phase must exclude it regardless.
    const homeworkB = await prisma.homework.create({
      data: {
        schoolId: schoolAId,
        academicYearId,
        teacherId,
        subjectId: mathSubjectId,
        classId: class8Id,
        sectionId: sectionA8Id,
        title: `${RUN_PREFIX} Homework B (different class)`,
        instructions: "Practice",
        assignedDate: new Date(),
        dueDate: new Date(),
        maxMarks: 10,
        status: "PUBLISHED",
      },
    })
    homeworkBId = homeworkB.id

    await prisma.homeworkSubmission.create({
      data: {
        schoolId: schoolAId,
        homeworkId: homeworkAId,
        studentId,
        content: "done",
        status: "REVIEWED",
        marks: 16,
        reviewedAt: new Date(),
        reviewedById: teacherId,
      },
    })
    // Cross-class stale row for the SAME student - must not leak in.
    await prisma.homeworkSubmission.create({
      data: {
        schoolId: schoolAId,
        homeworkId: homeworkBId,
        studentId,
        content: "done",
        status: "REVIEWED",
        marks: 9,
        reviewedAt: new Date(),
        reviewedById: teacherId,
      },
    })
    await prisma.homeworkSubmission.create({
      data: {
        schoolId: schoolAId,
        homeworkId: homeworkAId,
        studentId: otherStudentId,
        content: "done",
        status: "REVIEWED",
        marks: 10,
        reviewedAt: new Date(),
        reviewedById: teacherId,
      },
    })
  })

  after(async () => {
    await prisma.homeworkSubmission.deleteMany({ where: { homeworkId: { in: [homeworkAId, homeworkBId] } } })
    await prisma.homework.deleteMany({ where: { id: { in: [homeworkAId, homeworkBId] } } })
    await prisma.$disconnect()
  })

  describe("getStudentHomeworkAssessmentSummary", () => {
    it("only counts homework from the requested class, excluding a different class's homework", async () => {
      const summary = await getStudentHomeworkAssessmentSummary({
        schoolId: schoolAId,
        studentId,
        classId: class5Id,
        subjectId: mathSubjectId,
        academicYearId,
      })
      assert.equal(summary.gradedCount, 1)
      assert.equal(summary.totalMarks, 16)
      assert.equal(summary.totalMaxMarks, 20)
      assert.equal(summary.averagePercent, 80)
    })

    it("returns an empty summary for a class the student has no homework in", async () => {
      const summary = await getStudentHomeworkAssessmentSummary({
        schoolId: schoolAId,
        studentId: otherStudentId,
        classId: class8Id,
        subjectId: mathSubjectId,
        academicYearId,
      })
      assert.equal(summary.gradedCount, 0)
      assert.equal(summary.averagePercent, null)
    })
  })

  describe("getHomeworkAssessmentSummaries (batched)", () => {
    it("returns one summary per student in a single call, excluding the different-class homework", async () => {
      const summaries = await getHomeworkAssessmentSummaries({
        schoolId: schoolAId,
        studentIds: [studentId, otherStudentId],
        classId: class5Id,
        subjectId: mathSubjectId,
        academicYearId,
      })
      assert.equal(summaries.get(studentId)?.totalMarks, 16)
      assert.equal(summaries.get(studentId)?.totalMaxMarks, 20)
      assert.equal(summaries.get(otherStudentId)?.totalMarks, 10)
      assert.equal(summaries.get(otherStudentId)?.totalMaxMarks, 20)
    })

    it("returns an empty map for an empty studentIds list without querying", async () => {
      const summaries = await getHomeworkAssessmentSummaries({
        schoolId: schoolAId,
        studentIds: [],
        classId: class5Id,
        subjectId: mathSubjectId,
        academicYearId,
      })
      assert.equal(summaries.size, 0)
    })
  })
})
