import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E HomeworkAdmin ${Date.now()}`

let schoolId: string
const createdHomeworkIds: string[] = []

test.describe("Teacher/admin homework management", () => {
  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    schoolId = school.id
  })

  test.afterAll(async () => {
    await prisma.homeworkSubmission.deleteMany({ where: { homeworkId: { in: createdHomeworkIds } } })
    await prisma.homework.deleteMany({ where: { id: { in: createdHomeworkIds } } })
    await prisma.$disconnect()
  })

  test("teacher creates a homework as draft, then publishes it", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto("/homework/new")

    const title = `${RUN_PREFIX} Draft Assignment`
    await page.locator("#homework-title").fill(title)
    await page.locator("#homework-instructions").fill("Read chapter 3 and answer the questions.")
    await page.locator("#homework-max-marks").fill("10")

    // Teacher mode options come entirely from the teacher's own
    // TeacherAssignment rows - pick whatever the first available class/
    // section/subject cascade resolves to rather than hardcoding names.
    await page.locator("#homework-class").selectOption({ index: 1 })
    await page.locator("#homework-section").selectOption({ index: 1 })
    await page.locator("#homework-subject").selectOption({ index: 1 })

    await page.getByRole("button", { name: "Save Draft" }).click()
    await expect(page.getByText("Homework saved as draft.")).toBeVisible()
    await expect(page).toHaveURL(/\/homework\/[a-z0-9]+$/)

    const created = await prisma.homework.findFirstOrThrow({ where: { schoolId, title } })
    createdHomeworkIds.push(created.id)
    expect(created.status).toBe("DRAFT")
    expect(created.maxMarks).toBe(10)

    // A draft shows the Publish action; publishing flips status without
    // touching any other field.
    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible()
    await page.getByRole("button", { name: "Publish" }).click()
    await expect(page.getByText("Homework published.")).toBeVisible()

    const published = await prisma.homework.findUniqueOrThrow({ where: { id: created.id } })
    expect(published.status).toBe("PUBLISHED")

    await logout(page)
  })

  test("teacher edits their own homework", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    const homeworkId = createdHomeworkIds[0]
    await page.goto(`/homework/${homeworkId}/edit`)

    const updatedTitle = `${RUN_PREFIX} Draft Assignment (edited)`
    // A plain .fill() has been observed to append to this field's existing
    // value rather than replace it (same issue documented in helpers.ts for
    // the login form) - select-all + retype is the reliable way to land on
    // an exact value.
    const titleInput = page.locator("#homework-title")
    await titleInput.click({ clickCount: 3 })
    await titleInput.press("Backspace")
    await titleInput.pressSequentially(updatedTitle)
    await page.getByRole("button", { name: "Save", exact: true }).click()

    await expect(page.getByText("Homework updated.")).toBeVisible()
    const updated = await prisma.homework.findUniqueOrThrow({ where: { id: homeworkId } })
    expect(updated.title).toBe(updatedTitle)

    await logout(page)
  })

  test("homework list shows the created homework and supports the status filter", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto("/homework")

    await expect(page.getByText(`${RUN_PREFIX} Draft Assignment (edited)`)).toBeVisible()

    await page.goto("/homework?status=DRAFT")
    await expect(page.getByText(`${RUN_PREFIX} Draft Assignment (edited)`)).toHaveCount(0)

    await logout(page)
  })

  test("admin can create homework on behalf of a specific teacher", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/homework/new")

    const title = `${RUN_PREFIX} Admin-Created Assignment`
    await page.locator("#homework-title").fill(title)
    await page.locator("#homework-instructions").fill("Complete the worksheet.")

    await page.locator("#homework-teacher").selectOption({ label: "Teacher" })
    await page.locator("#homework-class").selectOption({ label: "Class 5" })
    await page.locator("#homework-section").selectOption({ label: "A" })
    await page.locator("#homework-subject").selectOption({ index: 1 })

    await page.getByRole("button", { name: "Save Draft" }).click()
    await expect(page.getByText("Homework saved as draft.")).toBeVisible()

    const created = await prisma.homework.findFirstOrThrow({ where: { schoolId, title } })
    createdHomeworkIds.push(created.id)

    const teacherUser = await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.teacher.email } })
    expect(created.teacherId).toBe(teacherUser.id)

    await logout(page)
  })
})
