import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, DayOfWeek } from "@prisma/client"
import { login, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

test.describe("Class Routine Security", () => {
  let schoolId: string
  let academicYearId: string
  let class5Id: string
  let section5AId: string
  let class6Id: string
  let section6AId: string
  let mathSubjectId: string
  let teacherId: string
  let linkedStudentId: string
  let unrelatedStudentId: string
  let seededEntryId: string | null = null

  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    schoolId = school.id

    const academicYear = await prisma.academicYear.findFirstOrThrow({
      where: { schoolId, name: "2026" },
    })
    academicYearId = academicYear.id

    const class5 = await prisma.class.findFirstOrThrow({
      where: { schoolId, name: "Class 5" },
    })
    class5Id = class5.id

    const section5A = await prisma.section.findFirstOrThrow({
      where: { classId: class5Id, name: "A" },
    })
    section5AId = section5A.id

    const class6 = await prisma.class.findFirstOrThrow({
      where: { schoolId, name: "Class 6" },
    })
    class6Id = class6.id

    const section6A = await prisma.section.findFirstOrThrow({
      where: { classId: class6Id, name: "A" },
    })
    section6AId = section6A.id

    const math = await prisma.subject.findFirstOrThrow({
      where: { schoolId, code: "MATH" },
    })
    mathSubjectId = math.id

    const teacher = await prisma.user.findFirstOrThrow({
      where: { schoolId, email: "teacher@benwil.test" },
    })
    teacherId = teacher.id

    // Linked student (Nusrat Jahan, STU-0501)
    const linkedStudent = await prisma.student.findUniqueOrThrow({
      where: { studentUid: "STU-0501" },
    })
    linkedStudentId = linkedStudent.id

    // Unrelated student (STU-0503)
    const unrelatedStudent = await prisma.student.findUniqueOrThrow({
      where: { studentUid: "STU-0503" },
    })
    unrelatedStudentId = unrelatedStudent.id

    // Ensure teacher assignment exists for Class 6 Section A Mathematics as well for conflict testing
    await prisma.teacherAssignment.upsert({
      where: {
        schoolId_academicYearId_teacherId_classId_sectionId_subjectId: {
          schoolId,
          teacherId,
          academicYearId,
          classId: class6Id,
          sectionId: section6AId,
          subjectId: mathSubjectId,
        },
      },
      update: {},
      create: {
        schoolId,
        teacherId,
        academicYearId,
        classId: class6Id,
        sectionId: section6AId,
        subjectId: mathSubjectId,
        isClassTeacher: false,
      },
    })

    // Seed a routine entry for Class 5 A on TUESDAY Period 2 with this teacher
    const created = await prisma.routineEntry.create({
      data: {
        schoolId,
        academicYearId,
        classId: class5Id,
        sectionId: section5AId,
        subjectId: mathSubjectId,
        teacherId,
        dayOfWeek: DayOfWeek.TUESDAY,
        periodNumber: 2,
        startTime: "09:45",
        endTime: "10:30",
        room: "Room 105",
      },
    })
    seededEntryId = created.id
  })

  test.afterAll(async () => {
    if (seededEntryId) {
      await prisma.routineEntry.deleteMany({
        where: { id: seededEntryId },
      })
    }
    await prisma.routineEntry.deleteMany({
      where: { schoolId, academicYearId, classId: class6Id, sectionId: section6AId },
    })
    await prisma.$disconnect()
  })

  test("Teacher cannot access routine management page", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(`/academics/routine`)
    // Role-protected: redirected away from /academics/routine
    await page.waitForURL((url) => !url.pathname.includes("/academics/routine"))
    expect(page.url()).not.toContain("/academics/routine")
  })

  test("Student cannot access routine management page", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto(`/academics/routine`)
    await page.waitForURL((url) => !url.pathname.includes("/academics/routine"))
    expect(page.url()).not.toContain("/academics/routine")
  })

  test("Guardian cannot access routine management page", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await page.goto(`/academics/routine`)
    await page.waitForURL((url) => !url.pathname.includes("/academics/routine"))
    expect(page.url()).not.toContain("/academics/routine")
  })

  test("Guardian cannot access an unrelated child's routine", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    const res = await page.goto(`/portal/guardian/children/${unrelatedStudentId}/routine`)
    // Expect 404 or Not Found page
    expect(res?.status() === 404 || (await page.locator("body").innerText()).includes("404") || (await page.locator("body").innerText()).includes("Not Found")).toBeTruthy()
  })

  test("Guardian can access their linked child's routine", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await page.goto(`/portal/guardian/children/${linkedStudentId}/routine`)
    await expect(page.locator("h1")).toContainText(/Routine|Timetable/i)
    // Nusrat Jahan is enrolled in Class 5 Section A, so Tuesday Period 2 should be visible
    await expect(page.locator("body")).toContainText("Room 105")
  })

  test("Server prevents teacher double-booking across different classes on the same day and period", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(
      `/academics/routine?academicYearId=${academicYearId}&classId=${class6Id}&sectionId=${section6AId}`
    )

    const addEntryBtn = page.getByRole("button", { name: /Add Routine Entry/i }).first()
    await addEntryBtn.click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Select TUESDAY, Period 2, Math, same Teacher
    await dialog.locator('select[name="dayOfWeek"]').selectOption(DayOfWeek.TUESDAY)
    await dialog.locator('select[name="periodNumber"]').selectOption("2")
    await dialog.locator('input[name="startTime"]').fill("09:45")
    await dialog.locator('input[name="endTime"]').fill("10:30")
    await dialog.locator('input[name="room"]').fill("Room 205")

    await dialog.getByRole("button", { name: /Save/i }).click()

    // Expect teacher conflict rejection
    await expect(dialog).toContainText(/already assigned/i)
  })
})
