import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// A run-unique prefix so this spec's fixtures (categories, notices) can be
// cleaned up afterwards without touching the deterministic seed fixtures or
// any other spec's data.
const RUN_PREFIX = `E2E NoticesAdmin ${Date.now()}`

let schoolId: string

function toDatetimeLocal(date: Date) {
  return date.toISOString().slice(0, 16)
}

const PAST = toDatetimeLocal(new Date(Date.now() - 60 * 60 * 1000))
const FUTURE_EXPIRY = toDatetimeLocal(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

test.describe("Admin notice management", () => {
  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    schoolId = school.id
  })

  test.afterAll(async () => {
    await prisma.notice.deleteMany({ where: { schoolId, title: { startsWith: RUN_PREFIX } } })
    await prisma.noticeCategory.deleteMany({ where: { schoolId, name: { startsWith: RUN_PREFIX } } })
    await prisma.$disconnect()
  })

  test("create a notice category and toggle it active/inactive", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    const name = `${RUN_PREFIX} Category`

    await page.goto("/notices/categories")
    await page.getByRole("button", { name: "Add Category" }).click()
    await page.locator("#notice-category-name").fill(name)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText(name)).toBeVisible()

    const row = page.locator("tr", { hasText: name })
    await row.getByRole("button", { name: "Deactivate" }).click()
    await expect(row.getByText("Inactive")).toBeVisible()
    await row.getByRole("button", { name: "Activate" }).click()
    await expect(row.getByText("Active")).toBeVisible()
  })

  test("reject a duplicate category name", async ({ page }) => {
    const name = `${RUN_PREFIX} Duplicate Category`
    await prisma.noticeCategory.create({ data: { schoolId, name } })

    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/notices/categories")
    await page.getByRole("button", { name: "Add Category" }).click()
    await page.locator("#notice-category-name").fill(name)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("A notice category with this name already exists.")).toBeVisible()
  })

  test("save a notice as draft, then publish it, then archive it", async ({ page }) => {
    const category = await prisma.noticeCategory.create({ data: { schoolId, name: `${RUN_PREFIX} Draft Flow Category` } })
    const title = `${RUN_PREFIX} Draft Flow Notice`

    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/notices")
    await page.getByRole("button", { name: "New Notice" }).click()
    await page.locator("#notice-title").fill(title)
    await page.locator("#notice-content").fill("This is a test notice body.")
    await page.locator("#notice-category").selectOption({ label: category.name })
    await page.locator("#notice-audience").selectOption({ label: "Everyone" })
    await page.locator("#notice-publish-at").fill(PAST)
    await page.getByRole("button", { name: "Save Draft" }).click()
    await expect(page.getByText(title)).toBeVisible()

    const row = page.locator("tr", { hasText: title })
    await expect(row.getByText("Draft", { exact: true })).toBeVisible()
    await row.getByRole("link", { name: title }).click()
    await expect(page).toHaveURL(/\/notices\/[^/]+$/)
    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible()

    await page.getByRole("button", { name: "Publish" }).click()
    await expect(page.getByText("Published", { exact: true }).first()).toBeVisible()

    await page.getByRole("button", { name: "Archive" }).click()
    await expect(page.getByText("Archived", { exact: true }).first()).toBeVisible()
    // Archived notices become read-only - no more Edit/Publish actions.
    await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0)
  })

  test("create and immediately publish a notice targeted at a class section", async ({ page }) => {
    const category = await prisma.noticeCategory.create({ data: { schoolId, name: `${RUN_PREFIX} Section Category` } })
    const title = `${RUN_PREFIX} Section Notice`

    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/notices")
    await page.getByRole("button", { name: "New Notice" }).click()
    await page.locator("#notice-title").fill(title)
    await page.locator("#notice-content").fill("Section-specific test notice.")
    await page.locator("#notice-category").selectOption({ label: category.name })
    await page.locator("#notice-audience").selectOption({ label: "A Class Section" })
    await page.locator("#notice-class").selectOption({ label: "Class 5" })
    await page.locator("#notice-section").selectOption({ label: "A" })
    await page.locator("#notice-publish-at").fill(PAST)
    await page.getByRole("button", { name: "Publish" }).click()
    await expect(page.getByText(title)).toBeVisible()

    const row = page.locator("tr", { hasText: title })
    await expect(row.getByText("Published")).toBeVisible()
    await expect(row.getByText("Class 5")).toBeVisible()
  })

  test("reject an expiry date that is not after the publish date", async ({ page }) => {
    const category = await prisma.noticeCategory.create({ data: { schoolId, name: `${RUN_PREFIX} Date Category` } })

    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/notices")
    await page.getByRole("button", { name: "New Notice" }).click()
    await page.locator("#notice-title").fill(`${RUN_PREFIX} Invalid Date Notice`)
    await page.locator("#notice-content").fill("Body.")
    await page.locator("#notice-category").selectOption({ label: category.name })
    await page.locator("#notice-audience").selectOption({ label: "Everyone" })
    await page.locator("#notice-publish-at").fill(FUTURE_EXPIRY)
    await page.locator("#notice-expires-at").fill(PAST)
    await page.getByRole("button", { name: "Save Draft" }).click()
    await expect(page.getByText("The expiry must be after the publish date.")).toBeVisible()
  })

  test("edit an existing notice's title", async ({ page }) => {
    const category = await prisma.noticeCategory.create({ data: { schoolId, name: `${RUN_PREFIX} Edit Category` } })
    const originalTitle = `${RUN_PREFIX} Edit Original Title`
    const newTitle = `${RUN_PREFIX} Edit Updated Title`
    const admin = await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.admin.email } })
    const notice = await prisma.notice.create({
      data: {
        schoolId,
        categoryId: category.id,
        title: originalTitle,
        content: "Original body.",
        status: "DRAFT",
        audienceType: "ALL",
        publishAt: new Date(),
        createdById: admin.id,
      },
    })

    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/notices/${notice.id}`)
    await page.getByRole("button", { name: "Edit" }).click()
    await page.locator("#notice-title").fill(newTitle)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText(newTitle)).toBeVisible()
  })

  test("teacher and other non-admin roles cannot reach notice management", async ({ page }) => {
    for (const account of [ACCOUNTS.teacher, ACCOUNTS.accountant, ACCOUNTS.librarian, ACCOUNTS.hr]) {
      await login(page, account.email, account.password)
      await page.goto("/notices")
      await expect(page).toHaveURL(/\/unauthorized$/)
      await page.goto("/dashboard")
      await logout(page)
    }
  })
})
