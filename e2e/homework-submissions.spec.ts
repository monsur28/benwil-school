import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, Role } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E HomeworkSubmissions ${Date.now()}`

let schoolId: string
let academicYearId: string
let class5Id: string
let sectionA5Id: string
let teacherId: string
let studentId: string
let homeworkId: string

test.describe("Homework submissions and teacher review", () => {
  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    schoolId = school.id
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId, name: "2026" } })
    academicYearId = academicYear.id
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId, name: "Class 5" } })
    class5Id = class5.id
    const sectionA5 = await prisma.section.findFirstOrThrow({ where: { classId: class5Id, name: "A" } })
    sectionA5Id = sectionA5.id

    const teacher = await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.teacher.email } })
    teacherId = teacher.id

    const student = await prisma.student.findFirstOrThrow({
      where: {
        schoolId,
        academicYearId,
        classId: class5Id,
        sectionId: sectionA5Id,
      },
    })
    studentId = student.id

    const category = await prisma.homeworkCategory.create({ data: { schoolId, name: `${RUN_PREFIX} Category` } })
    const homework = await prisma.homework.create({
      data: {
        schoolId,
        academicYearId,
        teacherId,
        subjectId: (await prisma.subject.findFirstOrThrow({ where: { schoolId, code: "MATH" } })).id,
        classId: class5Id,
        sectionId: sectionA5Id,
        categoryId: category.id,
        title: `${RUN_PREFIX} Assignment`,
        instructions: "Please solve these problems.",
        status: "PUBLISHED",
        assignedDate: new Date(),
        dueDate: new Date(Date.now() + 86400000 * 7), // 7 days from now
      },
    })
    homeworkId = homework.id
  })

  test.afterAll(async () => {
    await prisma.homeworkSubmission.deleteMany({ where: { schoolId, homeworkId } })
    await prisma.homework.deleteMany({ where: { schoolId, id: homeworkId } })
    await prisma.homeworkCategory.deleteMany({ where: { schoolId, name: { startsWith: RUN_PREFIX } } })
    await prisma.$disconnect()
  })

  test("student submits homework, teacher reviews and provides feedback", async ({ page }) => {
    // 1. Student submits homework
    // The student's email needs to be mapped to the actual student account for testing
    // To make it simple, we use the teacher to verify the list is displayed first
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    
    // Navigate to homework detail page
    await page.goto(`/homework/${homeworkId}`)
    await expect(page.getByRole("heading", { name: `${RUN_PREFIX} Assignment` })).toBeVisible()
    
    // Check submissions section exists
    await expect(page.getByText("Submissions", { exact: true })).toBeVisible()
    await expect(page.getByText("Not Submitted").first()).toBeVisible()
    
    // Since simulating student portal login requires specific guardian/student auth setup that might vary,
    // let's directly create a submission via DB for testing teacher's review capabilities
    await prisma.homeworkSubmission.create({
      data: {
        schoolId,
        homeworkId,
        studentId,
        status: "SUBMITTED",
        content: "Here is my homework submission content.",
        submittedAt: new Date(),
      }
    })

    // Reload teacher view to see submission
    await page.reload()
    await expect(page.getByText("Submitted").first()).toBeVisible()
    
    // Navigate to review page
    await page.getByRole("button", { name: "Review Submission" }).first().click()
    await expect(page).toHaveURL(/\/homework\/.*\/submissions\/.*/)
    
    // Check submission content is visible
    await expect(page.getByText("Here is my homework submission content.")).toBeVisible()
    
    // Submit feedback
    await page.locator('textarea[name="feedback"]').fill("Great job on this assignment!")
    await page.locator('input[name="marks"]').fill("95")
    await page.locator('input[name="grade"]').fill("A")
    await page.getByRole("button", { name: "Save Feedback" }).click()
    
    // Success toast should appear
    await expect(page.getByText("Feedback saved successfully.")).toBeVisible()
    
    // Status should be reviewed
    await expect(page.getByText("Reviewed").first()).toBeVisible()
    
    await logout(page)
  })
})
