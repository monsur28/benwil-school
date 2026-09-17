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
let otherSchoolId: string | undefined

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
    if (otherSchoolId) await prisma.school.delete({ where: { id: otherSchoolId } })
    await prisma.$disconnect()
  })

  test("admin creates a teacher account", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/teachers/new")

    const email = `${RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()}-created@test.local`
    await page.locator("#teacher-name").fill(`${RUN_PREFIX} Created Teacher`)
    await page.locator("#teacher-phone").fill("01711000001")
    await page.locator("#teacher-employee-id").fill(`${RUN_PREFIX}-EMP1`)
    await page.locator("#teacher-designation").fill("Senior Teacher")
    await page.locator("#teacher-department").fill("Science")
    await page.locator("#teacher-joining-date").fill("2026-01-05")
    await page.locator("#teacher-employment-type").selectOption("FULL_TIME")
    await page.locator("#teacher-email").fill(email)
    await page.locator("#teacher-password").fill("Passw0rd!123")

    await page.getByRole("button", { name: "Create Teacher" }).click()
    await expect(page.getByText("Teacher created successfully.")).toBeVisible()
    await expect(page).toHaveURL(/\/teachers\/(?!new$)[a-z0-9]+$/)

    const created = await prisma.user.findFirstOrThrow({ where: { schoolId, email } })
    createdUserIds.push(created.id)
    expect(created.role).toBe("TEACHER")
    expect(created.designation).toBe("Senior Teacher")
    expect(created.phone).toBe("01711000001")
    expect(created.employmentType).toBe("FULL_TIME")
    expect(created.joiningDate?.toISOString().slice(0, 10)).toBe("2026-01-05")
    // "Allow teacher to access the system" defaults to checked.
    expect(created.isActive).toBe(true)
    // A real, bcrypt-hashed password must exist - never plaintext.
    expect(created.passwordHash).not.toBe("Passw0rd!123")
    expect(created.passwordHash.length).toBeGreaterThan(20)

    // Scoped to the heading role, not a bare getByText: the App Router's
    // hidden route announcer mirrors the same page-title text into a second
    // DOM node on navigation, which a plain getByText matches too (strict
    // mode violation).
    await expect(page.getByRole("heading", { name: `${RUN_PREFIX} Created Teacher` })).toBeVisible()
    await expect(page.getByText("Senior Teacher", { exact: false })).toBeVisible()

    await logout(page)
  })

  test("rejects a duplicate Employee ID within the same school", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/teachers/new")

    // Reuses the Employee ID from the teacher created above - within the
    // SAME school this must be rejected, not silently duplicated.
    const duplicateEmail = `${RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()}-dup-emp@test.local`
    await page.locator("#teacher-name").fill(`${RUN_PREFIX} Duplicate EmployeeId Teacher`)
    await page.locator("#teacher-phone").fill("01711000002")
    await page.locator("#teacher-employee-id").fill(`${RUN_PREFIX}-EMP1`)
    await page.locator("#teacher-designation").fill("Teacher")
    await page.locator("#teacher-joining-date").fill("2026-01-05")
    await page.locator("#teacher-employment-type").selectOption("FULL_TIME")
    await page.locator("#teacher-email").fill(duplicateEmail)
    await page.locator("#teacher-password").fill("Passw0rd!123")
    await page.getByRole("button", { name: "Create Teacher" }).click()

    await expect(page.getByText("This employee ID is already in use.")).toBeVisible()
    const dupeCount = await prisma.user.count({ where: { schoolId, email: duplicateEmail } })
    expect(dupeCount).toBe(0)

    await logout(page)
  })

  test("allows the same Employee ID to be reused in a different school", async ({ page }) => {
    // Multi-school architecture: Employee ID is unique per school, never
    // globally (spec section 6/27).
    const otherSchool = await prisma.school.create({ data: { name: `${RUN_PREFIX} Other School` } })
    otherSchoolId = otherSchool.id
    const adminAccount = await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.admin.email } })
    const otherSchoolAdmin = await prisma.user.create({
      data: {
        schoolId: otherSchoolId,
        name: `${RUN_PREFIX} Other School Admin`,
        email: `${RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()}-other-admin@test.local`,
        passwordHash: adminAccount.passwordHash,
        role: "SCHOOL_ADMIN",
      },
    })

    await login(page, otherSchoolAdmin.email, ACCOUNTS.admin.password)
    await page.goto("/teachers/new")

    const email = `${RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()}-other-school-emp@test.local`
    await page.locator("#teacher-name").fill(`${RUN_PREFIX} Other School Teacher`)
    await page.locator("#teacher-phone").fill("01711000003")
    // Same literal Employee ID used in the primary school above.
    await page.locator("#teacher-employee-id").fill(`${RUN_PREFIX}-EMP1`)
    await page.locator("#teacher-designation").fill("Teacher")
    await page.locator("#teacher-joining-date").fill("2026-01-05")
    await page.locator("#teacher-employment-type").selectOption("FULL_TIME")
    await page.locator("#teacher-email").fill(email)
    await page.locator("#teacher-password").fill("Passw0rd!123")
    await page.getByRole("button", { name: "Create Teacher" }).click()

    // A longer timeout than the suite's default: this test does extra
    // Prisma round-trips (a fresh school + admin fixture) before the
    // browser even starts, on top of the dev server's own first-hit route
    // compilation cost (see playwright.config.ts's own comment on this).
    await expect(page).toHaveURL(/\/teachers\/(?!new$)[a-z0-9]+$/, { timeout: 30_000 })
    const created = await prisma.user.findFirstOrThrow({ where: { schoolId: otherSchoolId, email } })
    expect(created.employeeId).toBe(`${RUN_PREFIX}-EMP1`)

    await prisma.user.delete({ where: { id: created.id } })
    await prisma.user.delete({ where: { id: otherSchoolAdmin.id } })
    await logout(page)
  })

  test("rejects an invalid phone number", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/teachers/new")

    await page.locator("#teacher-name").fill(`${RUN_PREFIX} Invalid Phone Teacher`)
    await page.locator("#teacher-phone").fill("abc")
    await page.locator("#teacher-employee-id").fill(`${RUN_PREFIX}-EMP-BADPHONE`)
    await page.locator("#teacher-designation").fill("Teacher")
    await page.locator("#teacher-joining-date").fill("2026-01-05")
    await page.locator("#teacher-employment-type").selectOption("FULL_TIME")
    await page.locator("#teacher-email").fill(
      `${RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()}-badphone@test.local`
    )
    await page.locator("#teacher-password").fill("Passw0rd!123")
    await page.getByRole("button", { name: "Create Teacher" }).click()

    await expect(page.getByText("Enter a valid phone number.")).toBeVisible()
    // Client-side validation blocks the submit entirely - still on the form.
    await expect(page).toHaveURL(/\/teachers\/new$/)

    await logout(page)
  })

  test("creates a teacher with the full set of optional profile fields", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/teachers/new")

    const email = `${RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()}-full-profile@test.local`
    await page.locator("#teacher-name").fill(`${RUN_PREFIX} Full Profile Teacher`)
    await page.locator("#teacher-phone").fill("01711000004")
    await page.locator("#teacher-gender").selectOption("FEMALE")
    await page.locator("#teacher-dob").fill("1990-06-15")
    await page.locator("#teacher-address").fill("42 College Road, Dhaka")
    await page.locator("#teacher-employee-id").fill(`${RUN_PREFIX}-EMP-FULL`)
    await page.locator("#teacher-designation").fill("Senior Teacher")
    await page.locator("#teacher-department").fill("English")
    await page.locator("#teacher-joining-date").fill("2026-02-01")
    await page.locator("#teacher-employment-type").selectOption("PART_TIME")
    await page.locator("#teacher-qualifications").fill("MA in English")
    await page.locator("#teacher-specialization").fill("Literature")
    await page.locator("#teacher-experience").fill("8 years")
    await page.locator("#teacher-email").fill(email)
    await page.locator("#teacher-password").fill("Passw0rd!123")
    // Uncheck system access - this teacher should not be able to log in yet.
    await page.locator("#teacher-is-active").uncheck()
    await page.getByRole("button", { name: "Create Teacher" }).click()

    await expect(page).toHaveURL(/\/teachers\/(?!new$)[a-z0-9]+$/)
    const created = await prisma.user.findFirstOrThrow({ where: { schoolId, email } })
    createdUserIds.push(created.id)

    expect(created.gender).toBe("FEMALE")
    expect(created.dateOfBirth?.toISOString().slice(0, 10)).toBe("1990-06-15")
    expect(created.address).toBe("42 College Road, Dhaka")
    expect(created.department).toBe("English")
    expect(created.employmentType).toBe("PART_TIME")
    expect(created.qualifications).toBe("MA in English")
    expect(created.specialization).toBe("Literature")
    expect(created.experience).toBe("8 years")
    // Unchecking "Allow teacher to access the system" must actually gate login.
    expect(created.isActive).toBe(false)

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
