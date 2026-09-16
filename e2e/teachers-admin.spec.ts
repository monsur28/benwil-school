import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E TeachersAdmin ${Date.now()}`
const createdUserIds: string[] = []
const createdAssignmentIds: string[] = []

let schoolId: string
let academicYearId: string
let class5Id: string
let sectionA5Id: string
let mathSubjectId: string

test.describe("Admin teacher management", () => {
  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    schoolId = school.id
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId, name: "2026" } })
    academicYearId = academicYear.id
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId, name: "Class 5" } })
    class5Id = class5.id
    const sectionA5 = await prisma.section.findFirstOrThrow({ where: { classId: class5Id, name: "A" } })
    sectionA5Id = sectionA5.id
    mathSubjectId = (await prisma.subject.findFirstOrThrow({ where: { schoolId, code: "MATH" } })).id
  })

  test.afterAll(async () => {
    await prisma.teacherAssignment.deleteMany({ where: { id: { in: createdAssignmentIds } } })
    await prisma.teacherAssignment.deleteMany({ where: { teacherId: { in: createdUserIds } } })
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
    await prisma.$disconnect()
  })

  test("admin creates a teacher account", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/teachers/new")

    const email = `${RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()}-created@test.local`
    await page.locator("#teacher-name").fill(`${RUN_PREFIX} Created Teacher`)
    await page.locator("#teacher-email").fill(email)
    await page.locator("#teacher-password").fill("Passw0rd!123")
    await page.locator("#teacher-employee-id").fill(`${RUN_PREFIX}-EMP1`)
    await page.locator("#teacher-designation").fill("Senior Teacher")
    await page.locator("#teacher-department").fill("Science")

    await page.getByRole("button", { name: "Create Teacher" }).click()
    await expect(page.getByText("Teacher account created.")).toBeVisible()
    await expect(page).toHaveURL(/\/teachers\/[a-z0-9]+$/)

    const created = await prisma.user.findFirstOrThrow({ where: { schoolId, email } })
    createdUserIds.push(created.id)
    expect(created.role).toBe("TEACHER")
    expect(created.designation).toBe("Senior Teacher")
    expect(created.isActive).toBe(true)
    // A real, bcrypt-hashed password must exist - never plaintext.
    expect(created.passwordHash).not.toBe("Passw0rd!123")
    expect(created.passwordHash.length).toBeGreaterThan(20)

    await expect(page.getByText(`${RUN_PREFIX} Created Teacher`)).toBeVisible()
    await expect(page.getByText("Senior Teacher", { exact: false })).toBeVisible()

    await logout(page)
  })

  test("admin edits a teacher's profile", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    const teacherId = createdUserIds[0]
    await page.goto(`/teachers/${teacherId}/edit`)

    const designationInput = page.locator("#teacher-designation")
    await designationInput.click({ clickCount: 3 })
    await designationInput.press("Backspace")
    await designationInput.pressSequentially("Head of Department")
    await page.getByRole("button", { name: "Save", exact: true }).click()

    await expect(page).toHaveURL(new RegExp(`/teachers/${teacherId}\\?updated=1`))
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: teacherId } })
    expect(updated.designation).toBe("Head of Department")
    // Editing the profile must never touch login credentials.
    const before = await prisma.user.findUniqueOrThrow({ where: { id: teacherId }, select: { passwordHash: true } })
    expect(updated.passwordHash).toBe(before.passwordHash)

    await logout(page)
  })

  test("admin assigns a class/section/subject to a teacher, and duplicate assignment is rejected", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    const teacherId = createdUserIds[0]
    await page.goto(`/academics/assignments?teacherId=${teacherId}`)

    await page.getByRole("button", { name: "Assign Teacher" }).click()
    await page.locator('select[name="academicYearId"]').selectOption(academicYearId)
    await page.locator('select[name="classId"]').selectOption(class5Id)
    await page.locator('select[name="sectionId"]').selectOption(sectionA5Id)
    await page.locator('select[name="subjectId"]').selectOption(mathSubjectId)
    await page.getByRole("button", { name: "Save", exact: true }).click()
    await expect(page.getByText("Saved successfully.")).toBeVisible()

    const assignment = await prisma.teacherAssignment.findFirstOrThrow({
      where: { schoolId, teacherId, classId: class5Id, sectionId: sectionA5Id, subjectId: mathSubjectId, academicYearId },
    })
    createdAssignmentIds.push(assignment.id)

    // Attempt the exact same assignment again - must be rejected, not
    // silently duplicated.
    await page.getByRole("button", { name: "Assign Teacher" }).click()
    await page.locator('select[name="academicYearId"]').selectOption(academicYearId)
    await page.locator('select[name="classId"]').selectOption(class5Id)
    await page.locator('select[name="sectionId"]').selectOption(sectionA5Id)
    await page.locator('select[name="subjectId"]').selectOption(mathSubjectId)
    await page.getByRole("button", { name: "Save", exact: true }).click()
    await expect(page.getByText("This teacher is already assigned to this class, section, and subject.")).toBeVisible()

    const count = await prisma.teacherAssignment.count({
      where: { schoolId, teacherId, classId: class5Id, sectionId: sectionA5Id, subjectId: mathSubjectId, academicYearId },
    })
    expect(count).toBe(1)

    await logout(page)
  })

  test("deactivating a teacher preserves their assignment history", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    const teacherId = createdUserIds[0]
    await page.goto(`/teachers/${teacherId}`)

    page.once("dialog", (dialog) => dialog.accept())
    await page.getByRole("button", { name: "Deactivate" }).click()
    await expect(page.getByText("Teacher deactivated.")).toBeVisible()

    const teacher = await prisma.user.findUniqueOrThrow({ where: { id: teacherId } })
    expect(teacher.isActive).toBe(false)

    // The assignment created in the previous test must still exist untouched.
    const assignment = await prisma.teacherAssignment.findFirst({
      where: { teacherId, classId: class5Id, sectionId: sectionA5Id, subjectId: mathSubjectId },
    })
    expect(assignment).not.toBeNull()

    await expect(page.getByText("Inactive", { exact: true })).toBeVisible()
    await logout(page)
  })
})
