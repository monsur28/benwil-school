import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E AttendanceSecurity ${Date.now()}`

let schoolAId: string
let academicYearAId: string
let class5Id: string
let sectionA5Id: string // the real teacher's actual assignment (Class 5 / A / Math)
let sectionB5Id: string // same class, a section the real teacher is NOT assigned to
let class6Id: string // an entirely different class the real teacher is NOT assigned to

let otherSchoolId: string
let otherSchoolClassId: string

// A distinctive, fixed past date namespaced to this run - avoids colliding
// with any other spec's or real seed data's attendance rows for Class 5 A.
const pastDate = "2020-03-15"
const futureDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

test.describe("Attendance security and school isolation", () => {
  test.beforeAll(async () => {
    const schoolA = await prisma.school.findFirstOrThrow()
    schoolAId = schoolA.id
    const academicYearA = await prisma.academicYear.findFirstOrThrow({ where: { schoolId: schoolAId, isActive: true } })
    academicYearAId = academicYearA.id
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId: schoolAId, name: "Class 5" } })
    class5Id = class5.id
    const sectionA5 = await prisma.section.findFirstOrThrow({ where: { classId: class5Id, name: "A" } })
    sectionA5Id = sectionA5.id
    const sectionB5 = await prisma.section.findFirstOrThrow({ where: { classId: class5Id, name: "B" } })
    sectionB5Id = sectionB5.id
    const class6 = await prisma.class.findFirstOrThrow({ where: { schoolId: schoolAId, name: "Class 6" } })
    class6Id = class6.id

    const otherSchool = await prisma.school.create({ data: { name: `${RUN_PREFIX} Other School` } })
    otherSchoolId = otherSchool.id
    const otherClass = await prisma.class.create({ data: { schoolId: otherSchoolId, name: "Class 5", order: 5 } })
    otherSchoolClassId = otherClass.id
    await prisma.section.create({ data: { classId: otherSchoolClassId, name: "A" } })
  })

  test.afterAll(async () => {
    await prisma.attendance.deleteMany({
      where: { schoolId: schoolAId, classId: class5Id, sectionId: sectionA5Id, date: { in: [new Date(pastDate), new Date(futureDate)] } },
    })
    await prisma.section.deleteMany({ where: { class: { schoolId: otherSchoolId } } })
    await prisma.class.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.school.delete({ where: { id: otherSchoolId } })
    await prisma.$disconnect()
  })

  test("non-teacher, non-admin staff roles are rejected with /unauthorized", async ({ page }) => {
    const staffAccounts = [ACCOUNTS.accountant, ACCOUNTS.librarian, ACCOUNTS.hr]
    for (const account of staffAccounts) {
      await login(page, account.email, account.password)
      await page.goto("/attendance")
      await expect(page).toHaveURL(/\/unauthorized/)
      // /unauthorized doesn't render the app shell's account menu - navigate
      // to a real dashboard page first (see fees-admin.spec.ts's same note).
      await page.goto("/dashboard")
      await logout(page)
    }
  })

  test("STUDENT and GUARDIAN never reach the attendance page at all", async ({ page }) => {
    // These roles are redirected to their own portal by the (dashboard)
    // layout itself, before any page-level role check runs (see
    // src/app/(dashboard)/layout.tsx) - so the observable outcome is
    // "never lands on /attendance", not /unauthorized.
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto("/attendance")
    await expect(page).not.toHaveURL(/\/attendance$/)
    await logout(page)

    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await page.goto("/attendance")
    await expect(page).not.toHaveURL(/\/attendance$/)
    await logout(page)
  })

  test("the take-attendance picker excludes a section the teacher isn't assigned to, even via direct URL params", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(`/attendance?classId=${class5Id}&sectionId=${sectionB5Id}`)
    await expect(page.locator(`select[name="sectionId"] option[value="${sectionB5Id}"]`)).toHaveCount(0)
    // Proves this is genuinely assignment-based, not a blanket lockout on
    // Class 5 - the teacher's real section is still offered.
    await expect(page.locator(`select[name="sectionId"] option[value="${sectionA5Id}"]`)).toHaveCount(1)
    await logout(page)
  })

  test("the take-attendance picker excludes an entirely unassigned class, even via direct URL params", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(`/attendance?classId=${class6Id}`)
    await expect(page.locator(`select[name="classId"] option[value="${class6Id}"]`)).toHaveCount(0)
    await logout(page)
  })

  test("a class from a different school never appears as an attendance option", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/attendance?classId=${otherSchoolClassId}`)
    await expect(page.locator(`select[name="classId"] option[value="${otherSchoolClassId}"]`)).toHaveCount(0)
    await logout(page)
  })

  test("an admin saves attendance and it persists across a reload, scoped only to that section", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/attendance?classId=${class5Id}&sectionId=${sectionA5Id}&date=${pastDate}`)

    await page.getByRole("button", { name: "Mark All Present" }).click()
    await page.getByRole("button", { name: "Save Attendance" }).click()
    await expect(page.getByText("Attendance saved successfully.")).toBeVisible()

    const studentCount = await prisma.student.count({
      where: { schoolId: schoolAId, classId: class5Id, sectionId: sectionA5Id, status: "ACTIVE" },
    })
    const savedCount = await prisma.attendance.count({
      where: { schoolId: schoolAId, classId: class5Id, sectionId: sectionA5Id, date: new Date(pastDate), status: "PRESENT" },
    })
    expect(savedCount).toBe(studentCount)

    // Reload: the saved statuses must come back from the database, not be lost.
    await page.reload();
    await expect(page.getByText("Attendance submitted")).toBeVisible()

    // A sibling section on the same date must remain completely untouched.
    const leakedIntoSectionB = await prisma.attendance.count({
      where: { schoolId: schoolAId, classId: class5Id, sectionId: sectionB5Id, date: new Date(pastDate) },
    })
    expect(leakedIntoSectionB).toBe(0)

    await logout(page)
  })

  test("a future attendance date is rejected server-side even though the client-side date input is bypassed via URL", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/attendance?classId=${class5Id}&sectionId=${sectionA5Id}&date=${futureDate}`)

    await page.getByRole("button", { name: "Save Attendance" }).click()
    // saveAttendance's zod schema does carry a specific "date cannot be in
    // the future" issue, but the action collapses any schema failure to the
    // same generic message (see src/actions/attendance/save-attendance.ts) -
    // the security property under test is that nothing gets persisted, not
    // the exact wording of the rejection.
    await expect(page.getByText("Please fix the highlighted fields.")).toBeVisible()

    const futureRecords = await prisma.attendance.count({
      where: { schoolId: schoolAId, classId: class5Id, sectionId: sectionA5Id, date: new Date(futureDate) },
    })
    expect(futureRecords).toBe(0)

    await logout(page)
  })
})
