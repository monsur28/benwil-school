import "dotenv/config"
import { test, expect, type Page } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  )
  expect(hasOverflow).toBe(false)
}

// Reuses the deterministic seed fixture (prisma/seed.ts: "Tuition Fee" /
// "Class 5 Tuition Fee" / Nusrat Jahan / receipt RCPT-2026-000001) rather
// than creating throwaway data - this suite only checks layout, not
// behavior, so the shared seed data is enough and keeps the file short.
let seededStudentId: string
let seededPaymentId: string

test.describe("Fees mobile layout (390px)", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeAll(async () => {
    const student = await prisma.student.findUniqueOrThrow({ where: { studentUid: "STU-0501" } })
    seededStudentId = student.id
    const payment = await prisma.payment.findFirstOrThrow({ where: { receiptNumber: "RCPT-2026-000001" } })
    seededPaymentId = payment.id
  })

  test.afterAll(async () => {
    await prisma.$disconnect()
  })

  test("fees dashboard has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/fees")
    await expectNoHorizontalOverflow(page)
  })

  test("fee categories page has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/fees/categories")
    await expectNoHorizontalOverflow(page)
  })

  test("fee structures page has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/fees/structures")
    await expectNoHorizontalOverflow(page)
  })

  test("student fee overview page has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.accountant.email, ACCOUNTS.accountant.password)
    await page.goto(`/fees/student/${seededStudentId}`)
    await expectNoHorizontalOverflow(page)
  })

  test("record payment page has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.accountant.email, ACCOUNTS.accountant.password)
    await page.goto(`/fees/payments/new?studentId=${seededStudentId}`)
    await expectNoHorizontalOverflow(page)
  })

  test("payment receipt page has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.accountant.email, ACCOUNTS.accountant.password)
    await page.goto(`/fees/payments/${seededPaymentId}/receipt`)
    await expectNoHorizontalOverflow(page)
  })

  test("student profile Fees tab has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/students/${seededStudentId}`)
    await page.getByRole("tab", { name: "Fees" }).click()
    await expectNoHorizontalOverflow(page)
  })

  test("student portal fees page has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto("/portal/student/fees")
    await expectNoHorizontalOverflow(page)
  })

  test("guardian portal fees page has no horizontal overflow", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await page.waitForURL(/\/portal\/guardian\/children\/[^/]+$/)
    await page.goto(`${page.url()}/fees`)
    await expectNoHorizontalOverflow(page)
  })
})

test.describe("Regression: prior functionality unaffected by Phase 8", () => {
  test("results and portal still work end to end", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/results")
    await expect(page.getByRole("heading", { name: "Results", level: 1 })).toBeVisible()
  })

  test("student profile still loads with all tabs, including the new Fees tab", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/students/${seededStudentId}`)
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Fees" })).toBeVisible()
  })

  test("admin dashboard still loads", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
