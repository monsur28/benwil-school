import "dotenv/config"
import { test, expect, type Page } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E Mobile ${Date.now()}`
let examId: string

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  )
  expect(hasOverflow).toBe(false)
}

test.describe("Mobile layout (390px)", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId: school.id, name: "2026" } })
    const examType = await prisma.examType.create({ data: { schoolId: school.id, name: `${RUN_PREFIX} Type` } })
    const exam = await prisma.exam.create({
      data: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        examTypeId: examType.id,
        name: `${RUN_PREFIX} Exam`,
        startDate: new Date("2026-12-01"),
        endDate: new Date("2026-12-10"),
      },
    })
    examId = exam.id
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId: school.id, name: "Class 5" } })
    const mathSubject = await prisma.subject.findFirstOrThrow({ where: { schoolId: school.id, code: "MATH" } })
    await prisma.examSchedule.create({
      data: {
        schoolId: school.id,
        examId,
        classId: class5.id,
        subjectId: mathSubject.id,
        examDate: new Date("2026-12-02"),
        fullMarks: 100,
        passMarks: 33,
      },
    })
  })

  test.afterAll(async () => {
    await prisma.examMark.deleteMany({ where: { examSchedule: { examId } } })
    await prisma.examSchedule.deleteMany({ where: { examId } })
    const exam = await prisma.exam.findUniqueOrThrow({ where: { id: examId } })
    await prisma.exam.delete({ where: { id: examId } })
    await prisma.examType.delete({ where: { id: exam.examTypeId } })
    await prisma.$disconnect()
  })

  test("exams list has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/exams")
    await expectNoHorizontalOverflow(page)
  })

  test("exam detail page has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/exams/${examId}`)
    await expectNoHorizontalOverflow(page)
  })

  test("add-schedule dialog has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/exams/${examId}`)
    await page.getByRole("button", { name: "Add Subject" }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test("marks entry page has no horizontal overflow and inputs stay usable", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    const class5 = await prisma.class.findFirstOrThrow({ where: { name: "Class 5" } })
    const sectionA = await prisma.section.findFirstOrThrow({ where: { classId: class5.id, name: "A" } })
    const mathSubject = await prisma.subject.findFirstOrThrow({ where: { code: "MATH" } })
    await page.goto(`/exams/${examId}/marks?classId=${class5.id}&sectionId=${sectionA.id}&subjectId=${mathSubject.id}`)
    await expectNoHorizontalOverflow(page)

    const marksInputs = page.locator('input[type="number"]')
    const count = await marksInputs.count()
    if (count > 0) {
      await expect(marksInputs.first()).toBeVisible()
      const box = await marksInputs.first().boundingBox()
      expect(box).not.toBeNull()
      expect(box!.width).toBeGreaterThan(0)
    }
  })
})

test.describe("Regression: existing features still work", () => {
  test("student admission page still loads for admins", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/students/new")
    await expect(page.locator("form")).toBeVisible()
  })

  test("attendance page still loads for a teacher", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto("/attendance")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("academic management still loads for admins", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/academics/assignments")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("accountant still has no access to exams", async ({ page }) => {
    await login(page, ACCOUNTS.accountant.email, ACCOUNTS.accountant.password)
    await page.goto("/exams")
    await expect(page.getByText("Access restricted", { exact: true }).first()).toBeVisible()
  })

  test("language switch to Bangla still renders exams UI translated, and back to English", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/exams")
    await expect(page.getByRole("heading", { name: "Exams", level: 1 })).toBeVisible()

    await page.getByRole("button", { name: "Language" }).click()
    await page.getByRole("menuitem", { name: "বাংলা" }).click()
    await expect(page.getByRole("heading", { name: "পরীক্ষা", level: 1 })).toBeVisible()

    await page.getByRole("button", { name: "ভাষা" }).click()
    await page.getByRole("menuitem", { name: "English" }).click()
    await expect(page.getByRole("heading", { name: "Exams", level: 1 })).toBeVisible()
  })
})
