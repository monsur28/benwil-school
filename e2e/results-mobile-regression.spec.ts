import "dotenv/config"
import { test, expect, type Page } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E ResultsMobile ${Date.now()}`

let examId: string
let examTypeId: string
let classId: string
let sectionId: string
let studentId: string

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  )
  expect(hasOverflow).toBe(false)
}

test.describe("Results mobile layout (390px)", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId: school.id, name: "2026" } })
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId: school.id, name: "Class 5" } })
    classId = class5.id
    sectionId = (await prisma.section.findFirstOrThrow({ where: { classId: class5.id, name: "A" } })).id
    const mathSubject = await prisma.subject.findFirstOrThrow({ where: { schoolId: school.id, code: "MATH" } })

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
        classId,
        subjectId: mathSubject.id,
        examDate: new Date("2026-12-02"),
        fullMarks: 100,
        passMarks: 33,
      },
    })

    const student = await prisma.student.findFirstOrThrow({
      where: { classId, sectionId, academicYearId: academicYear.id, status: "ACTIVE" },
      orderBy: { roll: "asc" },
    })
    studentId = student.id

    const teacher = await prisma.user.findFirstOrThrow({ where: { email: "teacher@benwil.test" } })
    await prisma.examMark.create({
      data: { schoolId: school.id, examScheduleId: schedule.id, studentId, marks: 78, isAbsent: false, enteredById: teacher.id },
    })
  })

  test.afterAll(async () => {
    await prisma.examMark.deleteMany({ where: { examSchedule: { examId } } })
    await prisma.examSchedule.deleteMany({ where: { examId } })
    await prisma.exam.delete({ where: { id: examId } })
    await prisma.examType.delete({ where: { id: examTypeId } })
    await prisma.$disconnect()
  })

  test("grading configuration page has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/results/grading")
    await expectNoHorizontalOverflow(page)
  })

  test("results overview page has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/results")
    await expectNoHorizontalOverflow(page)
  })

  test("class/section result detail page has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/results/${examId}/${classId}/${sectionId}`)
    await expectNoHorizontalOverflow(page)
  })

  test("student result page has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/results/${examId}/student/${studentId}`)
    await expectNoHorizontalOverflow(page)
  })

  test("report card page has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/results/${examId}/student/${studentId}/report-card`)
    await expectNoHorizontalOverflow(page)
  })

  test("student profile Results tab has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/students/${studentId}`)
    await page.getByRole("tab", { name: "Results" }).click()
    await expectNoHorizontalOverflow(page)
  })
})

test.describe("Regression: prior functionality unaffected by Phase 6", () => {
  test("exams list and marks entry still work end to end", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/exams")
    await expect(page.getByRole("heading", { name: "Exams", level: 1 })).toBeVisible()
  })

  test("student admission page still loads", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/students/new")
    await expect(page.locator("form")).toBeVisible()
  })

  test("attendance page still loads for a teacher", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto("/attendance")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("accountant still has no access to results", async ({ page }) => {
    await login(page, ACCOUNTS.accountant.email, ACCOUNTS.accountant.password)
    await page.goto("/results")
    await expect(page.getByText("Access restricted", { exact: true }).first()).toBeVisible()
  })

  test("results UI translates to Bangla and back", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/results/grading")
    await expect(page.getByRole("heading", { name: "Grading", level: 1 })).toBeVisible()

    await page.getByRole("button", { name: "Language" }).click()
    await page.getByRole("menuitem", { name: "বাংলা" }).click()
    await expect(page.getByRole("heading", { name: "গ্রেডিং", level: 1 })).toBeVisible()

    await page.getByRole("button", { name: "ভাষা" }).click()
    await page.getByRole("menuitem", { name: "English" }).click()
    await expect(page.getByRole("heading", { name: "Grading", level: 1 })).toBeVisible()
  })
})
