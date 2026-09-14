import "dotenv/config"
import { test, expect, type Page } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E PortalMobile ${Date.now()}`

let examId: string
let examTypeId: string
let scheduleId: string
let studentId: string
let secondChildLinkId: string

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  )
  expect(hasOverflow).toBe(false)
}

test.describe("Portal mobile layout (390px)", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId: school.id, name: "2026" } })
    const student = await prisma.student.findUniqueOrThrow({ where: { studentUid: "STU-0501" } })
    studentId = student.id
    const guardian = await prisma.guardian.findFirstOrThrow({ where: { schoolId: school.id, name: "Portal Test Guardian" } })
    const secondChild = await prisma.student.findUniqueOrThrow({ where: { studentUid: "STU-0503" } })
    const link = await prisma.studentGuardian.create({
      data: { studentId: secondChild.id, guardianId: guardian.id, relation: "GUARDIAN", isPrimary: false },
    })
    secondChildLinkId = link.id

    const mathSubject = await prisma.subject.findFirstOrThrow({ where: { schoolId: school.id, code: "MATH" } })
    const teacher = await prisma.user.findFirstOrThrow({ where: { email: "teacher@benwil.test" } })

    const examType = await prisma.examType.create({ data: { schoolId: school.id, name: `${RUN_PREFIX} Type` } })
    examTypeId = examType.id
    const exam = await prisma.exam.create({
      data: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        examTypeId,
        name: `${RUN_PREFIX} Exam`,
        startDate: new Date("2026-12-01"),
        endDate: new Date("2026-12-10"),
      },
    })
    examId = exam.id
    const schedule = await prisma.examSchedule.create({
      data: {
        schoolId: school.id,
        examId,
        classId: student.classId,
        subjectId: mathSubject.id,
        examDate: new Date("2026-12-02"),
        fullMarks: 100,
        passMarks: 33,
      },
    })
    scheduleId = schedule.id
    await prisma.examMark.create({
      data: { schoolId: school.id, examScheduleId: scheduleId, studentId, marks: 91, isAbsent: false, enteredById: teacher.id },
    })
    await prisma.exam.update({ where: { id: examId }, data: { resultStatus: "FINALIZED" } })
  })

  test.afterAll(async () => {
    await prisma.studentGuardian.delete({ where: { id: secondChildLinkId } })
    await prisma.examMark.deleteMany({ where: { examScheduleId: scheduleId } })
    await prisma.examSchedule.deleteMany({ where: { examId } })
    await prisma.exam.delete({ where: { id: examId } })
    await prisma.examType.delete({ where: { id: examTypeId } })
    await prisma.$disconnect()
  })

  test("student: dashboard, profile, attendance, results, report card - no overflow", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await expectNoHorizontalOverflow(page)

    await page.goto("/portal/student/profile")
    await expectNoHorizontalOverflow(page)

    await page.goto("/portal/student/attendance")
    await expectNoHorizontalOverflow(page)

    await page.goto("/portal/student/results")
    await expectNoHorizontalOverflow(page)

    await page.goto(`/portal/student/results/${examId}`)
    await expectNoHorizontalOverflow(page)

    await page.goto(`/portal/student/results/${examId}/report-card`)
    await expectNoHorizontalOverflow(page)
  })

  test("guardian: children list, child switcher, and every child page - no overflow", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    // Two children now (from beforeAll) - lands on the list, not an
    // auto-redirect.
    await expect(page).toHaveURL(/\/portal\/guardian$/)
    await expectNoHorizontalOverflow(page)

    await page.goto(`/portal/guardian/children/${studentId}`)
    await expectNoHorizontalOverflow(page)
    await expect(page.locator("#portal-child-switcher")).toBeVisible()

    await page.goto(`/portal/guardian/children/${studentId}/profile`)
    await expectNoHorizontalOverflow(page)

    await page.goto(`/portal/guardian/children/${studentId}/attendance`)
    await expectNoHorizontalOverflow(page)

    await page.goto(`/portal/guardian/children/${studentId}/results`)
    await expectNoHorizontalOverflow(page)

    await page.goto(`/portal/guardian/children/${studentId}/results/${examId}`)
    await expectNoHorizontalOverflow(page)

    await page.goto(`/portal/guardian/children/${studentId}/results/${examId}/report-card`)
    await expectNoHorizontalOverflow(page)
  })

  test("student profile page (admin view) still shows the Results tab correctly", async ({ page }) => {
    // Same describe block as the fixture on purpose - this describe's own
    // afterAll tears the exam down as soon as its tests finish, so a check
    // that needs it can't live in a later, sibling describe.
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/students/${studentId}`)
    await page.getByRole("tab", { name: "Results" }).click()
    await expect(page.getByText(`${RUN_PREFIX} Exam`)).toBeVisible()
  })
})

test.describe("Regression: prior functionality unaffected by Phase 7", () => {
  test("admin dashboard, students, exams, and results still load", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await expect(page).toHaveURL(/\/dashboard$/)

    await page.goto("/students")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

    await page.goto("/exams")
    await expect(page.getByRole("heading", { name: "Exams", level: 1 })).toBeVisible()

    await page.goto("/results")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("teacher login still lands on /dashboard and attendance still works", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await expect(page).toHaveURL(/\/dashboard$/)
    await page.goto("/attendance")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("accountant still has no access to exams or the portal's admin-only pages", async ({ page }) => {
    await login(page, ACCOUNTS.accountant.email, ACCOUNTS.accountant.password)
    await expect(page).toHaveURL(/\/dashboard$/)
    await page.goto("/exams")
    await expect(page.getByText("Access restricted", { exact: true }).first()).toBeVisible()
  })
})
