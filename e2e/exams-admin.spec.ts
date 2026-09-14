import { test, expect } from "@playwright/test"
import { login, ACCOUNTS } from "./helpers"

test.describe("Admin exam management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
  })

  test("create, edit, and toggle an exam type", async ({ page }) => {
    const name = `Class Test ${Date.now()}`

    await page.goto("/exams/types")
    await page.getByRole("button", { name: "New Exam Type" }).click()
    await page.locator("#exam-type-name").fill(name)
    await page.locator("#exam-type-name-bn").fill("শ্রেণি পরীক্ষা")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText(name)).toBeVisible()

    const row = page.locator("tr", { hasText: name })
    await row.getByRole("button", { name: "Deactivate" }).click()
    await expect(row.getByText("Inactive")).toBeVisible()
    await row.getByRole("button", { name: "Activate" }).click()
    await expect(row.getByText("Active")).toBeVisible()
  })

  test("create an exam, add a schedule, and reject duplicates and bad marks", async ({ page }) => {
    const examTypeName = `Half Yearly ${Date.now()}`
    await page.goto("/exams/types")
    await page.getByRole("button", { name: "New Exam Type" }).click()
    await page.locator("#exam-type-name").fill(examTypeName)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText(examTypeName)).toBeVisible()

    const examName = `Half Yearly Exam ${Date.now()}`
    await page.goto("/exams")
    await page.getByRole("button", { name: "New Exam" }).click()
    await page.locator("#exam-name").fill(examName)
    await page.locator("#exam-academic-year").selectOption({ label: "2026" })
    await page.locator("#exam-type").selectOption({ label: examTypeName })
    await page.locator("#exam-start-date").fill("2026-10-01")
    await page.locator("#exam-end-date").fill("2026-10-10")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText(examName)).toBeVisible()

    await page.getByRole("link", { name: examName }).click()
    await expect(page).toHaveURL(/\/exams\/[^/]+$/)

    await page.getByRole("button", { name: "Add Subject" }).click()
    await page.locator("#schedule-class").selectOption({ label: "Class 6" })
    await page.locator("#schedule-subject").selectOption({ label: "Mathematics" })
    await page.locator("#schedule-date").fill("2026-10-02")
    await page.locator("#schedule-full-marks").fill("100")
    await page.locator("#schedule-pass-marks").fill("33")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByRole("cell", { name: "Mathematics" })).toBeVisible()

    // duplicate exam+class+subject is rejected
    await page.getByRole("button", { name: "Add Subject" }).click()
    await page.locator("#schedule-class").selectOption({ label: "Class 6" })
    await page.locator("#schedule-subject").selectOption({ label: "Mathematics" })
    await page.locator("#schedule-date").fill("2026-10-02")
    await page.locator("#schedule-full-marks").fill("100")
    await page.locator("#schedule-pass-marks").fill("33")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("This subject is already scheduled for this class in this exam")).toBeVisible()
    await page.keyboard.press("Escape")

    // passMarks > fullMarks is rejected
    await page.getByRole("button", { name: "Add Subject" }).click()
    await page.locator("#schedule-class").selectOption({ label: "Class 7" })
    await page.locator("#schedule-subject").selectOption({ label: "Mathematics" })
    await page.locator("#schedule-date").fill("2026-10-03")
    await page.locator("#schedule-full-marks").fill("50")
    await page.locator("#schedule-pass-marks").fill("60")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Pass marks must be between 0 and full marks")).toBeVisible()
  })

  test("enter marks, update them, mark absent, and see completion counts and student results", async ({ page }) => {
    const examTypeName = `Marks Flow Type ${Date.now()}`
    await page.goto("/exams/types")
    await page.getByRole("button", { name: "New Exam Type" }).click()
    await page.locator("#exam-type-name").fill(examTypeName)
    await page.getByRole("button", { name: "Save" }).click()

    const examName = `Marks Flow Exam ${Date.now()}`
    await page.goto("/exams")
    await page.getByRole("button", { name: "New Exam" }).click()
    await page.locator("#exam-name").fill(examName)
    await page.locator("#exam-academic-year").selectOption({ label: "2026" })
    await page.locator("#exam-type").selectOption({ label: examTypeName })
    await page.locator("#exam-start-date").fill("2026-11-01")
    await page.locator("#exam-end-date").fill("2026-11-10")
    await page.getByRole("button", { name: "Save" }).click()
    await page.getByRole("link", { name: examName }).click()

    await page.getByRole("button", { name: "Add Subject" }).click()
    await page.locator("#schedule-class").selectOption({ label: "Class 5" })
    await page.locator("#schedule-subject").selectOption({ label: "Mathematics" })
    await page.locator("#schedule-date").fill("2026-11-02")
    await page.locator("#schedule-full-marks").fill("100")
    await page.locator("#schedule-pass-marks").fill("33")
    await page.getByRole("button", { name: "Save" }).click()

    await page.getByRole("button", { name: "Enter Marks" }).click()
    await page.waitForURL(/\/marks/)
    await page.getByLabel("Section").selectOption({ label: "A" })
    await page.waitForURL(/sectionId=/)

    const marksInputs = page.locator('input[type="number"]')
    const studentCount = await marksInputs.count()
    expect(studentCount).toBeGreaterThan(0)
    for (let i = 0; i < studentCount; i++) {
      await marksInputs.nth(i).fill(String(70 + i))
    }
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText(`${studentCount} entered • 0 absent • 0 pending`)).toBeVisible()

    // update one student's marks
    await marksInputs.first().fill("99")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(marksInputs.first()).toHaveValue("99")

    // switch to Section B and mark all absent
    const beforeSwitchCompletion = await page.getByText(/entered.*absent.*pending/).textContent()
    await page.getByLabel("Section").selectOption({ label: "B" })
    await page.waitForURL(/sectionId=/)
    // The section change is a soft navigation (router.push -> server round
    // trip re-render), so wait for the completion summary to actually change
    // from Section A's value rather than reading input count immediately.
    await expect(page.getByText(/entered.*absent.*pending/)).not.toHaveText(beforeSwitchCompletion ?? "")
    const sectionBInputs = page.locator('input[type="number"]')
    const sectionBCount = await sectionBInputs.count()
    if (sectionBCount > 0) {
      await page.getByRole("button", { name: "Mark All Absent" }).click()
      await expect(page.getByText(`0 entered • ${sectionBCount} absent • 0 pending`)).toBeVisible()
    }

    // student profile results tab reflects the entered marks (Nusrat Jahan
    // is one of the seeded Class 5 / Section A students, per prisma/seed.ts)
    await page.goto("/students?q=Nusrat+Jahan")
    await page.getByRole("button", { name: "View" }).first().click()
    await page.getByRole("tab", { name: "Results" }).click()
    const examCard = page.locator('[data-slot="card"]', { hasText: examName }).first()
    await expect(examCard).toBeVisible()
    await expect(examCard.getByRole("cell", { name: "Mathematics" })).toBeVisible()
  })
})
