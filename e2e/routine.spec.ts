import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, DayOfWeek } from "@prisma/client"
import { login, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

test.describe("Class Routine Management", () => {
  let schoolId: string
  let academicYearId: string
  let classId: string
  let sectionId: string

  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    schoolId = school.id

    const academicYear = await prisma.academicYear.findFirstOrThrow({
      where: { schoolId, name: "2026" },
    })
    academicYearId = academicYear.id

    const cls = await prisma.class.findFirstOrThrow({
      where: { schoolId, name: "Class 5" },
    })
    classId = cls.id

    const section = await prisma.section.findFirstOrThrow({
      where: { classId, name: "A" },
    })
    sectionId = section.id

    // Clean up only the exact (day, period) slot this test owns - Class 5
    // Section A is shared with routine-security.spec.ts and
    // routine-portal.spec.ts, which run concurrently in other workers, so a
    // broader delete on classId/sectionId alone would race and wipe their
    // fixtures too.
    await prisma.routineEntry.deleteMany({
      where: { schoolId, academicYearId, classId, sectionId, dayOfWeek: DayOfWeek.MONDAY, periodNumber: 1 },
    })
  })

  test.afterAll(async () => {
    await prisma.routineEntry.deleteMany({
      where: { schoolId, academicYearId, classId, sectionId, dayOfWeek: DayOfWeek.MONDAY, periodNumber: 1 },
    })
    await prisma.$disconnect()
  })

  test("Admin can view routine page, create an entry, edit it, and delete it", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)

    // Navigate to routine page
    await page.goto(
      `/academics/routine?academicYearId=${academicYearId}&classId=${classId}&sectionId=${sectionId}`
    )
    await expect(page.locator("h1")).toContainText(/Routine|Timetable/i)

    // Verify empty state or grid is present
    const addEntryBtn = page.getByRole("button", { name: /Add Routine Entry/i }).first()
    await expect(addEntryBtn).toBeVisible()

    // 1. Create a routine entry for MONDAY Period 1
    await addEntryBtn.click()

    // Fill the dialog form. Scoped to data-slot="dialog-content" rather than
    // role=dialog - the success toast also renders role="dialog", which
    // makes a plain getByRole("dialog") ambiguous the instant a save
    // succeeds and its toast is still animating out.
    const dialog = page.locator('[data-slot="dialog-content"]')
    await expect(dialog).toBeVisible()

    // Day
    await dialog.locator('select[name="dayOfWeek"]').selectOption(DayOfWeek.MONDAY)
    // Period
    await dialog.locator('select[name="periodNumber"]').selectOption("1")
    // Start Time & End Time
    await dialog.locator('input[name="startTime"]').fill("09:00")
    await dialog.locator('input[name="endTime"]').fill("09:45")
    // Room
    await dialog.locator('input[name="room"]').fill("Room 101")

    // Submit
    await dialog.getByRole("button", { name: /Save/i }).click()

    // Wait for dialog to close
    await expect(dialog).toBeHidden({ timeout: 10000 })

    // Verify entry is visible on the page (Period 1, 09:00 - 09:45, Room 101)
    await expect(page.locator("body")).toContainText("Room 101")
    await expect(page.locator("body")).toContainText("09:00")

    // 2. Prevent conflicting entry on the same day and period
    await addEntryBtn.click()
    await expect(dialog).toBeVisible()
    await dialog.locator('select[name="dayOfWeek"]').selectOption(DayOfWeek.MONDAY)
    await dialog.locator('select[name="periodNumber"]').selectOption("1")
    await dialog.locator('input[name="startTime"]').fill("09:00")
    await dialog.locator('input[name="endTime"]').fill("09:45")
    await dialog.getByRole("button", { name: /Save/i }).click()

    // Should display class conflict error
    await expect(dialog).toContainText(/already exists/i)

    // Close conflict dialog
    await dialog.getByRole("button", { name: /Cancel/i }).click()
    await expect(dialog).toBeHidden()

    // 3. Edit the existing entry
    const editBtn = page.getByTitle("Edit Routine Entry").first()
    await editBtn.click()
    await expect(dialog).toBeVisible()
    await dialog.locator('input[name="room"]').fill("Room 202")
    await dialog.getByRole("button", { name: /Save/i }).click()
    await expect(dialog).toBeHidden({ timeout: 10000 })

    await expect(page.locator("body")).toContainText("Room 202")

    // 4. Delete the routine entry (native window.confirm)
    page.once("dialog", (confirmDialog) => confirmDialog.accept())
    const deleteBtn = page.getByTitle("Delete Routine Entry").first()
    await deleteBtn.click()

    // Verify entry is removed
    await expect(page.locator("body")).not.toContainText("Room 202", { timeout: 10000 })
  })
})
