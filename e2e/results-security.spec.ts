import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E ResultsSecurity ${Date.now()}`

// School A is the real seeded school every other spec uses. School B exists
// only so a cross-tenant probe has something real to point at - the point
// of this suite is proving School A's admin can never reach it, no matter
// how the URL is built.
let otherSchoolId: string
let otherExamId: string
let otherExamTypeId: string
let otherClassId: string
let otherSectionId: string
let otherStudentId: string
let otherAcademicYearId: string

let ownExamId: string
let ownExamTypeId: string
let ownClassId: string
let ownSectionId: string

test.describe("Cross-tenant and cross-role result security", () => {
  test.beforeAll(async () => {
    const schoolA = await prisma.school.findFirstOrThrow()
    const academicYearA = await prisma.academicYear.findFirstOrThrow({ where: { schoolId: schoolA.id, name: "2026" } })
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId: schoolA.id, name: "Class 5" } })
    ownClassId = class5.id
    ownSectionId = (await prisma.section.findFirstOrThrow({ where: { classId: class5.id, name: "A" } })).id
    const mathSubjectA = await prisma.subject.findFirstOrThrow({ where: { schoolId: schoolA.id, code: "MATH" } })

    const examTypeA = await prisma.examType.create({ data: { schoolId: schoolA.id, name: `${RUN_PREFIX} Own Type` } })
    ownExamTypeId = examTypeA.id
    const examA = await prisma.exam.create({
      data: {
        schoolId: schoolA.id,
        academicYearId: academicYearA.id,
        examTypeId: examTypeA.id,
        name: `${RUN_PREFIX} Own Exam`,
        startDate: new Date("2026-12-01"),
        endDate: new Date("2026-12-10"),
      },
    })
    ownExamId = examA.id
    await prisma.examSchedule.create({
      data: {
        schoolId: schoolA.id,
        examId: ownExamId,
        classId: ownClassId,
        subjectId: mathSubjectA.id,
        examDate: new Date("2026-12-02"),
        fullMarks: 100,
        passMarks: 33,
      },
    })

    // A second, fully independent school - the "another school" side of
    // every cross-tenant assertion below.
    const schoolB = await prisma.school.create({ data: { name: `${RUN_PREFIX} Other School` } })
    otherSchoolId = schoolB.id
    const academicYearB = await prisma.academicYear.create({
      data: { schoolId: schoolB.id, name: "2026" },
    })
    otherAcademicYearId = academicYearB.id
    const classB = await prisma.class.create({ data: { schoolId: schoolB.id, name: "Class 5", order: 5 } })
    otherClassId = classB.id
    const sectionB = await prisma.section.create({ data: { classId: classB.id, name: "A" } })
    otherSectionId = sectionB.id
    const subjectB = await prisma.subject.create({ data: { schoolId: schoolB.id, name: "Mathematics", code: "MATH" } })
    const examTypeB = await prisma.examType.create({ data: { schoolId: schoolB.id, name: `${RUN_PREFIX} Other Type` } })
    otherExamTypeId = examTypeB.id
    const examB = await prisma.exam.create({
      data: {
        schoolId: schoolB.id,
        academicYearId: academicYearB.id,
        examTypeId: examTypeB.id,
        name: `${RUN_PREFIX} Other Exam`,
        startDate: new Date("2026-12-01"),
        endDate: new Date("2026-12-10"),
      },
    })
    otherExamId = examB.id
    await prisma.examSchedule.create({
      data: {
        schoolId: schoolB.id,
        examId: otherExamId,
        classId: otherClassId,
        subjectId: subjectB.id,
        examDate: new Date("2026-12-02"),
        fullMarks: 100,
        passMarks: 33,
      },
    })
    const studentB = await prisma.student.create({
      data: {
        schoolId: schoolB.id,
        studentUid: `${RUN_PREFIX}-STU-B`,
        admissionNumber: `${RUN_PREFIX}-ADM-B`,
        name: `${RUN_PREFIX} Other Student`,
        dateOfBirth: new Date("2015-01-01"),
        gender: "MALE",
        academicYearId: otherAcademicYearId,
        classId: otherClassId,
        sectionId: otherSectionId,
        roll: 1,
      },
    })
    otherStudentId = studentB.id
  })

  test.afterAll(async () => {
    await prisma.student.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.examSchedule.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.exam.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.examType.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.subject.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.section.deleteMany({ where: { class: { schoolId: otherSchoolId } } })
    await prisma.class.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.academicYear.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.school.delete({ where: { id: otherSchoolId } })

    await prisma.examSchedule.deleteMany({ where: { examId: ownExamId } })
    await prisma.exam.delete({ where: { id: ownExamId } })
    await prisma.examType.delete({ where: { id: ownExamTypeId } })
    await prisma.$disconnect()
  })

  test("another school's exam/class/section is rejected as not-found, not exposed", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/results/${otherExamId}/${otherClassId}/${otherSectionId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })

  test("another school's student result and report card are rejected as not-found", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/results/${otherExamId}/student/${otherStudentId}`)
    await expect(page.getByText("Page not found")).toBeVisible()

    await page.goto(`/results/${otherExamId}/student/${otherStudentId}/report-card`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })

  test("a mixed combination - own school's real exam with another school's real student id - is rejected", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    // examId is genuinely valid for School A; studentId is genuinely valid,
    // just for School B. Neither id is garbage - the pairing is what's
    // invalid, and it must still be rejected server-side.
    await page.goto(`/results/${ownExamId}/student/${otherStudentId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })

  test("own school's class paired with another school's section id is rejected", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/results/${ownExamId}/${ownClassId}/${otherSectionId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })

  test("teacher cannot reach the grading configuration page", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto("/results/grading")
    await expect(page).toHaveURL(/\/unauthorized$/)
  })

  test("principal can finalize and reopen results (not just admin)", async ({ page }) => {
    await login(page, ACCOUNTS.principal.email, ACCOUNTS.principal.password)
    await page.goto(`/results/${ownExamId}/${ownClassId}/${ownSectionId}`)

    await page.getByRole("button", { name: "Finalize Results" }).click()
    await expect(page.getByText("Results finalized")).toBeVisible()

    const examAfterFinalize = await prisma.exam.findUniqueOrThrow({ where: { id: ownExamId } })
    expect(examAfterFinalize.resultStatus).toBe("FINALIZED")

    await page.getByRole("button", { name: "Reopen Results" }).click()
    await expect(page.getByText("Results reopened")).toBeVisible()

    const examAfterReopen = await prisma.exam.findUniqueOrThrow({ where: { id: ownExamId } })
    expect(examAfterReopen.resultStatus).toBe("DRAFT")
  })
})
