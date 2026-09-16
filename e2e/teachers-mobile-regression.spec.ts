import "dotenv/config"
import { test, expect, type Page } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E TeachersMobile ${Date.now()}`

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  )
  expect(hasOverflow).toBe(false)
}

let teacherId: string

test.describe("Teacher management mobile layout (390px)", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    const teacher = await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.teacher.email } })
    const fixture = await prisma.user.create({
      data: {
        schoolId: school.id,
        name: `${RUN_PREFIX} Mobile Teacher`,
        email: `${RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()}@test.local`,
        passwordHash: teacher.passwordHash,
        role: "TEACHER",
        employeeId: `${RUN_PREFIX}-EMP`,
        designation: "Mathematics Teacher",
      },
    })
    teacherId = fixture.id
  })

  test.afterAll(async () => {
    await prisma.teacherAssignment.deleteMany({ where: { teacherId } })
    await prisma.user.delete({ where: { id: teacherId } })
    await prisma.$disconnect()
  })

  test("teacher directory has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/teachers")
    await expectNoHorizontalOverflow(page)
  })

  test("create teacher form has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/teachers/new")
    await expectNoHorizontalOverflow(page)
  })

  test("teacher profile page has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/teachers/${teacherId}`)
    await expectNoHorizontalOverflow(page)
  })

  test("edit teacher form has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/teachers/${teacherId}/edit`)
    await expectNoHorizontalOverflow(page)
  })

  test("assignment management page and dialog have no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/academics/assignments?teacherId=${teacherId}`)
    await expectNoHorizontalOverflow(page)

    await page.getByRole("button", { name: "Assign Teacher" }).click()
    await expectNoHorizontalOverflow(page)
  })
})
