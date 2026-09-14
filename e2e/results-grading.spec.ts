import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E Grading ${Date.now()}`

test.describe("Grading configuration", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
  })

  test.afterAll(async () => {
    const scales = await prisma.gradingScale.findMany({ where: { name: { startsWith: RUN_PREFIX } } })
    await prisma.gradeRule.deleteMany({ where: { gradingScaleId: { in: scales.map((scale) => scale.id) } } })
    await prisma.gradingScale.deleteMany({ where: { id: { in: scales.map((scale) => scale.id) } } })
    await prisma.$disconnect()
  })

  test("create, edit, and toggle a grading scale", async ({ page }) => {
    const name = `${RUN_PREFIX} Scale`
    await page.goto("/results/grading")
    await page.getByRole("button", { name: "New Grading Scale" }).click()
    await page.locator("#grading-scale-name").fill(name)
    await page.locator("#grading-scale-name-bn").fill("পরীক্ষামূলক স্কেল")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText(name)).toBeVisible()

    const card = page.locator('[data-slot="card"]', { hasText: name })
    await card.getByRole("button", { name: "Deactivate" }).click()
    await expect(card.getByText("Inactive")).toBeVisible()
    await card.getByRole("button", { name: "Activate" }).click()
    await expect(card.getByText("Active")).toBeVisible()
  })

  test("add grade rules, reject invalid and overlapping ranges, then delete a rule", async ({ page }) => {
    const name = `${RUN_PREFIX} Rules Scale`
    await page.goto("/results/grading")
    await page.getByRole("button", { name: "New Grading Scale" }).click()
    await page.locator("#grading-scale-name").fill(name)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText(name)).toBeVisible()

    const card = page.locator('[data-slot="card"]', { hasText: name })

    // Valid rule: 80-100 -> A+
    await card.getByRole("button", { name: "Add Grade Rule" }).click()
    await page.locator("#grade-rule-min").fill("80")
    await page.locator("#grade-rule-max").fill("100")
    await page.locator("#grade-rule-grade").fill("A+")
    await page.locator("#grade-rule-point").fill("5")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(card.getByRole("cell", { name: "A+" })).toBeVisible()

    // Invalid range: min >= max is rejected
    await card.getByRole("button", { name: "Add Grade Rule" }).click()
    await page.locator("#grade-rule-min").fill("50")
    await page.locator("#grade-rule-max").fill("40")
    await page.locator("#grade-rule-grade").fill("Bad")
    await page.locator("#grade-rule-point").fill("2")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Minimum percentage must be less than maximum percentage")).toBeVisible()
    await page.keyboard.press("Escape")

    // Overlapping range with the existing 80-100 rule is rejected
    await card.getByRole("button", { name: "Add Grade Rule" }).click()
    await page.locator("#grade-rule-min").fill("75")
    await page.locator("#grade-rule-max").fill("85")
    await page.locator("#grade-rule-grade").fill("Overlap")
    await page.locator("#grade-rule-point").fill("4")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("This percentage range overlaps with an existing grade rule")).toBeVisible()
    await page.keyboard.press("Escape")

    // Non-overlapping rule is accepted
    await card.getByRole("button", { name: "Add Grade Rule" }).click()
    await page.locator("#grade-rule-min").fill("70")
    await page.locator("#grade-rule-max").fill("79.99")
    await page.locator("#grade-rule-grade").fill("A")
    await page.locator("#grade-rule-point").fill("4")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(card.getByRole("cell", { name: "A", exact: true })).toBeVisible()

    // Delete the "A" rule
    const ruleRow = card.getByRole("row").filter({ hasText: "A" }).filter({ hasNotText: "A+" })
    page.once("dialog", (dialog) => dialog.accept())
    await ruleRow.getByRole("button").last().click()
    await expect(card.getByRole("cell", { name: "A", exact: true })).not.toBeVisible()
    await expect(card.getByRole("cell", { name: "A+" })).toBeVisible()
  })
})
