import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// A run-unique prefix so this spec's fixtures (exam types, exams, and
// whatever schedules/marks hang off them) can be cleaned up afterwards
// without touching any other exam data - real or from other specs.
const RUN_PREFIX = `E2E Admin ${Date.now()}`

test.describe("Admin exam management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
  })

  test.afterAll(async () => {
    const exams = await prisma.exam.findMany({ where: { name: { startsWith: RUN_PREFIX } } })
    const examIds = exams.map((exam) => exam.id)
    const schedules = await prisma.examSchedule.findMany({ where: { examId: { in: examIds } } })
    const scheduleIds = schedules.map((schedule) => schedule.id)
    await prisma.examMark.deleteMany({ where: { examScheduleId: { in: scheduleIds } } })
    await prisma.examSchedule.deleteMany({ where: { examId: { in: examIds } } })
    await prisma.exam.deleteMany({ where: { id: { in: examIds } } })
    await prisma.examType.deleteMany({ where: { name: { startsWith: RUN_PREFIX } } })
    await prisma.$disconnect()
  })

  test("create, edit, and toggle an exam type", async ({ page }) => {
    const name = `${RUN_PREFIX} Class Test ${Date.now()}`

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
    const examTypeName = `${RUN_PREFIX} Half Yearly ${Date.now()}`
    await page.goto("/exams/types")
    await page.getByRole("button", { name: "New Exam Type" }).click()
    await page.locator("#exam-type-name").fill(examTypeName)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText(examTypeName)).toBeVisible()

    const examName = `${RUN_PREFIX} Half Yearly Exam ${Date.now()}`
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
    const examTypeName = `${RUN_PREFIX} Marks Flow Type ${Date.now()}`
    await page.goto("/exams/types")
    await page.getByRole("button", { name: "New Exam Type" }).click()
    await page.locator("#exam-type-name").fill(examTypeName)
    await page.getByRole("button", { name: "Save" }).click()
    // Wait for the create to actually persist before navigating away -
    // otherwise /exams' server-rendered examTypes list can be fetched
    // before this mutation has committed.
    await expect(page.getByText(examTypeName)).toBeVisible()

    const examName = `${RUN_PREFIX} Marks Flow Exam ${Date.now()}`
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
    // waitForURL defaults to waitUntil:"load", which a client-side soft
    // navigation (router.push/Link, no full reload) may never fire - wait
    // for actual marks-entry content instead. Section A is already the
    // page's own default (only 2 sections exist - A and B - and A is
    // selected first), so no explicit selection is needed; confirm we
    // landed there via one of its known students.
    await expect(page.getByText("Nusrat Jahan")).toBeVisible()

    const marksInputs = page.locator('input[type="number"]')
    const studentCount = await marksInputs.count()
    expect(studentCount).toBeGreaterThan(0)
    for (let i = 0; i < studentCount; i++) {
      await marksInputs.nth(i).fill(String(70 + i))
    }
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText(`${studentCount} entered • 0 absent • 0 pending`)).toBeVisible({
      timeout: 20_000,
    })

    // update one student's marks
    await marksInputs.first().fill("99")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(marksInputs.first()).toHaveValue("99")

    // switch to Section B and mark all absent
    const beforeSwitchCompletion = await page.getByText(/entered.*absent.*pending/).textContent()
    await page.getByLabel("Section").selectOption({ label: "B" })
    // The section change is a soft navigation (router.push -> server round
    // trip re-render via a fetch, not a full document load), so poll for
    // the completion summary to actually change rather than assuming a
    // single check will land after the transition settles.
    await expect(async () => {
      const current = await page.getByText(/entered.*absent.*pending/).textContent()
      expect(current).not.toBe(beforeSwitchCompletion)
    }).toPass({ timeout: 20_000 })
    const sectionBInputs = page.locator('input[type="number"]')
    const sectionBCount = await sectionBInputs.count()
    if (sectionBCount > 0) {
      await page.getByRole("button", { name: "Mark All Absent" }).click()
      await expect(page.getByText(`0 entered • ${sectionBCount} absent • 0 pending`)).toBeVisible({
        timeout: 20_000,
      })
    }

    // student profile results tab reflects the entered marks (Nusrat Jahan
    // is one of the seeded Class 5 / Section A students, per prisma/seed.ts)
    await page.goto("/students?q=Nusrat+Jahan")
    await page.getByRole("button", { name: "View" }).first().click()
    await page.getByRole("tab", { name: "Results" }).click()
    const examRow = page.getByRole("row").filter({ hasText: examName }).first()
    await expect(examRow).toBeVisible()
    await examRow.getByRole("button", { name: "View Result" }).click()
    await expect(page.getByRole("cell", { name: "Mathematics" })).toBeVisible()
  })
})
