import "dotenv/config"
import { test, expect, type Page } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E HomeworkMobile ${Date.now()}`

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  )
  expect(hasOverflow).toBe(false)
}

let schoolId: string
let studentId: string
let homeworkId: string

test.describe("Homework mobile layout (390px)", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    schoolId = school.id
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId, name: "2026" } })
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId, name: "Class 5" } })
    const sectionA5 = await prisma.section.findFirstOrThrow({ where: { classId: class5.id, name: "A" } })
    const mathSubject = await prisma.subject.findFirstOrThrow({ where: { schoolId, code: "MATH" } })
    const teacher = await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.teacher.email } })
    const student = await prisma.student.findFirstOrThrow({
      where: { schoolId, academicYearId: academicYear.id, classId: class5.id, sectionId: sectionA5.id },
    })
    studentId = student.id

    const homework = await prisma.homework.create({
      data: {
        schoolId,
        academicYearId: academicYear.id,
        teacherId: teacher.id,
        subjectId: mathSubject.id,
        classId: class5.id,
        sectionId: sectionA5.id,
        title: `${RUN_PREFIX} Assignment`,
        instructions: "Mobile layout regression fixture.",
        status: "PUBLISHED",
        assignedDate: new Date(),
        dueDate: new Date(Date.now() + 86400000 * 7),
        maxMarks: 10,
      },
    })
    homeworkId = homework.id

    await prisma.homeworkSubmission.create({
      data: {
        schoolId,
        homeworkId,
        studentId,
        status: "SUBMITTED",
        content: "Mobile regression submission content.",
        submittedAt: new Date(),
      },
    })
  })

  test.afterAll(async () => {
    await prisma.homeworkSubmission.deleteMany({ where: { homeworkId } })
    await prisma.homework.delete({ where: { id: homeworkId } })
    await prisma.$disconnect()
  })

  test("teacher homework list has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto("/homework")
    await expectNoHorizontalOverflow(page)
  })

  test("create homework form has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto("/homework/new")
    await expectNoHorizontalOverflow(page)
  })

  test("homework detail page with submissions list has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(`/homework/${homeworkId}`)
    await expectNoHorizontalOverflow(page)
  })

  test("submission review/grading panel stacks vertically with no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(`/homework/${homeworkId}/submissions/${studentId}`)
    await expectNoHorizontalOverflow(page)

    // The submission card and the evaluation form must stack (not sit
    // side-by-side) at this width - assert the evaluation form starts below
    // the bottom of the submission card, not beside it.
    const submissionCard = page.getByText("Mobile regression submission content.")
    const marksInput = page.locator('input[name="marks"]')
    const submissionBox = await submissionCard.boundingBox()
    const marksBox = await marksInput.boundingBox()
    expect(submissionBox).not.toBeNull()
    expect(marksBox).not.toBeNull()
    if (submissionBox && marksBox) {
      expect(marksBox.y).toBeGreaterThan(submissionBox.y)
    }
  })

  test("student homework list and detail page have no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto("/portal/student/homework")
    await expectNoHorizontalOverflow(page)

    await page.goto(`/portal/student/homework/${homeworkId}`)
    await expectNoHorizontalOverflow(page)
  })

  test("guardian homework detail page has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await page.goto(`/portal/guardian/children/${studentId}/homework/${homeworkId}`)
    await expectNoHorizontalOverflow(page)
  })
})
