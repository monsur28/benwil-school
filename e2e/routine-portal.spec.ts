import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, DayOfWeek } from "@prisma/client"
import { login, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// Mirrors src/lib/academics/routine.ts JS_DAY_TO_DAY_OF_WEEK - not imported
// directly since that module is marked "server-only" and this spec runs
// under plain Node, not the react-server condition.
const JS_DAY_TO_DAY_OF_WEEK: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
}

test.describe("Student Portal Routine & Dashboard Data Wiring", () => {
  let schoolId: string
  let academicYearId: string
  let classId: string
  let sectionId: string
  let subjectId: string
  let teacherId: string
  let seededTodayEntryId: string | null = null

  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    schoolId = school.id

    const academicYear = await prisma.academicYear.findFirstOrThrow({
      where: { schoolId, name: "2026" },
    })
    academicYearId = academicYear.id

    const student = await prisma.student.findUniqueOrThrow({
      where: { studentUid: "STU-0501" },
    })
    classId = student.classId
    sectionId = student.sectionId

    const subject = await prisma.subject.findFirstOrThrow({
      where: { schoolId, code: "MATH" },
    })
    subjectId = subject.id

    const teacher = await prisma.user.findFirstOrThrow({
      where: { schoolId, email: "teacher@benwil.test" },
    })
    teacherId = teacher.id

    // Today's day of week
    const todayEnum = JS_DAY_TO_DAY_OF_WEEK[new Date().getDay()]

    // Create a routine entry for Nusrat Jahan's class on today's day of week
    await prisma.routineEntry.deleteMany({
      where: {
        schoolId,
        academicYearId,
        classId,
        sectionId,
        dayOfWeek: todayEnum,
        // Period 9 - deliberately distinct from routine.spec.ts (period 1)
        // and routine-security.spec.ts (period 2), which share this same
        // Class 5 Section A fixture and run concurrently in other workers.
        // Different period numbers keep the three files collision-free on
        // the (day, period) unique constraint regardless of which real
        // weekday the suite happens to run on.
        periodNumber: 9,
      },
    })

    const entry = await prisma.routineEntry.create({
      data: {
        schoolId,
        academicYearId,
        classId,
        sectionId,
        subjectId,
        teacherId,
        dayOfWeek: todayEnum,
        // Period 9 - deliberately distinct from routine.spec.ts (period 1)
        // and routine-security.spec.ts (period 2), which share this same
        // Class 5 Section A fixture and run concurrently in other workers.
        // Different period numbers keep the three files collision-free on
        // the (day, period) unique constraint regardless of which real
        // weekday the suite happens to run on.
        periodNumber: 9,
        startTime: "09:00",
        endTime: "09:45",
        room: "Room 303",
      },
    })
    seededTodayEntryId = entry.id
  })

  test.afterAll(async () => {
    if (seededTodayEntryId) {
      await prisma.routineEntry.deleteMany({
        where: { id: seededTodayEntryId },
      })
    }
    await prisma.$disconnect()
  })

  test("Student can view full weekly routine in student portal", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto(`/portal/student/routine`)

    await expect(page.locator("h1")).toContainText(/My Routine|আমার রুটিন/i)
    // Verify our seeded entry is present (Room 303, 09:00 - 09:45)
    await expect(page.locator("body")).toContainText("Room 303")
    await expect(page.locator("body")).toContainText("09:00")
  })

  test("Student dashboard shows real Today's Schedule and real student metadata", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto(`/portal/student`)

    // Verify real student header metadata (Class 5 Section A, NOT fake Class 6)
    await expect(page.locator("body")).toContainText("Class 5")
    await expect(page.locator("body")).not.toContainText("Class 6 - Section B")

    // Verify Today's Schedule card has real data. The dashboard widget shows
    // only the start time (not a range) - see src/app/portal/student/page.tsx.
    await expect(page.locator("body")).toContainText(/Today's Schedule|আজকের সময়সূচী/i)
    await expect(page.locator("body")).toContainText("Room 303")
    await expect(page.locator("body")).toContainText("09:00")
  })

  test("Mobile responsiveness: no horizontal overflow at 390px viewport width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)

    // Check student dashboard
    await page.goto(`/portal/student`)
    const dashboardOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2
    })
    expect(dashboardOverflow).toBeFalsy()

    // Check student routine page
    await page.goto(`/portal/student/routine`)
    const routineOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2
    })
    expect(routineOverflow).toBeFalsy()
  })
})
