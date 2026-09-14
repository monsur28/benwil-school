import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E PortalLink ${Date.now()}`
const PASSWORD = "PortalTest1234!"

let studentId: string
let guardianId: string
let createdUserIds: string[] = []

test.describe("Account linking", () => {
  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId: school.id, name: "2026" } })
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId: school.id, name: "Class 5" } })
    const sectionA = await prisma.section.findFirstOrThrow({ where: { classId: class5.id, name: "A" } })

    const student = await prisma.student.create({
      data: {
        schoolId: school.id,
        studentUid: `${RUN_PREFIX}-STU`,
        admissionNumber: `${RUN_PREFIX}-ADM`,
        name: `${RUN_PREFIX} Student`,
        dateOfBirth: new Date("2014-01-01"),
        gender: "MALE",
        academicYearId: academicYear.id,
        classId: class5.id,
        sectionId: sectionA.id,
        roll: 501,
      },
    })
    studentId = student.id

    const guardian = await prisma.guardian.create({
      data: { schoolId: school.id, name: `${RUN_PREFIX} Guardian`, phone: `01900${Date.now() % 1000000}` },
    })
    guardianId = guardian.id
    await prisma.studentGuardian.create({
      data: { studentId, guardianId, relation: "GUARDIAN", isPrimary: true },
    })
  })

  test.afterAll(async () => {
    if (createdUserIds.length > 0) {
      await prisma.student.update({ where: { id: studentId }, data: { userId: null } }).catch(() => {})
      await prisma.guardian.update({ where: { id: guardianId }, data: { userId: null } }).catch(() => {})
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
    }
    await prisma.studentGuardian.deleteMany({ where: { studentId } })
    await prisma.guardian.delete({ where: { id: guardianId } })
    await prisma.student.delete({ where: { id: studentId } })
    await prisma.$disconnect()
  })

  test("admin creates a student portal account, and the student can log in to see their own data", async ({
    page,
  }) => {
    const email = `${RUN_PREFIX.toLowerCase().replace(/\s+/g, "-")}-student@example.test`

    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/students/${studentId}`)

    const accountCard = page.locator('[data-slot="card"]', { hasText: "Portal Accounts" })
    const studentRow = accountCard.getByText("Student Account").locator("..")
    await studentRow.getByRole("button", { name: "Create Account" }).click()

    const dialog = page.getByRole("dialog")
    await dialog.locator("#portal-account-email").fill(email)
    await dialog.locator("#portal-account-password").fill(PASSWORD)
    await dialog.getByRole("button", { name: "Create Account" }).click()
    await expect(page.getByText("Portal account created")).toBeVisible()
    await expect(accountCard.getByText(email)).toBeVisible()

    const createdUser = await prisma.user.findUniqueOrThrow({ where: { email } })
    createdUserIds.push(createdUser.id)
    expect(createdUser.role).toBe("STUDENT")

    // Creating a second account for the same student must be rejected - the
    // row no longer offers a "Create Account" trigger once linked (reload
    // first so this isn't just leftover client state from the dialog).
    await page.reload()
    await expect(accountCard.getByText(email)).toBeVisible()
    await expect(studentRow.getByRole("button", { name: "Create Account" })).not.toBeVisible()

    await logout(page)
    await login(page, email, PASSWORD)
    await page.waitForURL("**/portal/student")
    await expect(page.getByRole("heading", { name: `Welcome, ${RUN_PREFIX} Student` })).toBeVisible()
  })

  test("admin creates a guardian portal account, and the guardian sees the right child", async ({ page }) => {
    const email = `${RUN_PREFIX.toLowerCase().replace(/\s+/g, "-")}-guardian@example.test`

    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/students/${studentId}`)

    const accountCard = page.locator('[data-slot="card"]', { hasText: "Portal Accounts" })
    const guardianRow = accountCard.getByText(`${RUN_PREFIX} Guardian`, { exact: true }).locator("..")
    await guardianRow.getByRole("button", { name: "Create Account" }).click()

    const dialog = page.getByRole("dialog")
    await dialog.locator("#portal-account-email").fill(email)
    await dialog.locator("#portal-account-password").fill(PASSWORD)
    await dialog.getByRole("button", { name: "Create Account" }).click()
    await expect(page.getByText("Portal account created")).toBeVisible()

    const createdUser = await prisma.user.findUniqueOrThrow({ where: { email } })
    createdUserIds.push(createdUser.id)
    expect(createdUser.role).toBe("GUARDIAN")

    await logout(page)
    await login(page, email, PASSWORD)
    await page.waitForURL(/\/portal\/guardian/)
    await expect(page.getByRole("heading", { name: `${RUN_PREFIX} Student` })).toBeVisible()
  })

  test("a deactivated portal account cannot log in", async ({ page }) => {
    const studentAccount = await prisma.student.findUniqueOrThrow({ where: { id: studentId }, select: { userId: true } })
    expect(studentAccount.userId).not.toBeNull()

    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/students/${studentId}`)

    const accountCard = page.locator('[data-slot="card"]', { hasText: "Portal Accounts" })
    const studentRow = accountCard.getByText("Student Account").locator("..")
    await studentRow.getByRole("button", { name: "Deactivate" }).click()
    await expect(studentRow.getByText("Inactive")).toBeVisible()

    const account = await prisma.user.findUniqueOrThrow({ where: { id: studentAccount.userId! } })
    expect(account.isActive).toBe(false)

    await logout(page)
    const emailInput = page.locator('input[type="email"]')
    await emailInput.click({ clickCount: 3 })
    await emailInput.press("Backspace")
    await emailInput.pressSequentially(account.email)
    const passwordInput = page.locator('input[type="password"]')
    await passwordInput.click({ clickCount: 3 })
    await passwordInput.press("Backspace")
    await passwordInput.pressSequentially(PASSWORD)
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText("The email or password you entered is incorrect.")).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)

    // Reactivate so this account doesn't stay disabled for the afterAll
    // cleanup or any later run - log back in as admin first, since the
    // failed login above never created a session.
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/students/${studentId}`)
    await studentRow.getByRole("button", { name: "Activate" }).click()
    await expect(studentRow.getByText("Active")).toBeVisible()
  })
})
