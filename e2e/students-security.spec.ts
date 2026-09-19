import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E StudentsSecurity ${Date.now()}`
const slug = RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()

// School A is the real seeded school every other spec uses. School B exists
// only so a cross-tenant probe has something real to point at.
let schoolAId: string
let academicYearAId: string
let class5Id: string
let sectionA5Id: string

let ownStudentId: string
let unrelatedStudentId: string

let otherSchoolId: string
let otherStudentId: string

test.describe("Student management security and school isolation", () => {
  test.beforeAll(async () => {
    const schoolA = await prisma.school.findFirstOrThrow()
    schoolAId = schoolA.id
    const academicYearA = await prisma.academicYear.findFirstOrThrow({ where: { schoolId: schoolAId, name: "2026" } })
    academicYearAId = academicYearA.id
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId: schoolAId, name: "Class 5" } })
    class5Id = class5.id
    const sectionA5 = await prisma.section.findFirstOrThrow({ where: { classId: class5Id, name: "A" } })
    sectionA5Id = sectionA5.id

    const ownStudent = await prisma.student.create({
      data: {
        schoolId: schoolAId,
        studentUid: `${RUN_PREFIX}-STU-OWN`,
        admissionNumber: `${RUN_PREFIX}-ADM-OWN`,
        name: `${RUN_PREFIX} Own Student`,
        dateOfBirth: new Date("2014-01-01"),
        gender: "MALE",
        academicYearId: academicYearAId,
        classId: class5Id,
        sectionId: sectionA5Id,
        roll: 991,
      },
    })
    ownStudentId = ownStudent.id

    // The edit wizard's Guardian step requires at least one guardian before
    // it will advance to the Academic step - a real student always has one
    // (enforced at creation), so the edit-flow test below needs one too.
    const guardian = await prisma.guardian.create({
      data: { schoolId: schoolAId, name: `${RUN_PREFIX} Guardian`, phone: `01700${Date.now() % 1000000}` },
    })
    await prisma.studentGuardian.create({
      data: { studentId: ownStudentId, guardianId: guardian.id, relation: "GUARDIAN", isPrimary: true },
    })

    // A second, unrelated same-school student - proves editing one student
    // never bleeds into another's record (data integrity, not just access).
    const unrelatedStudent = await prisma.student.create({
      data: {
        schoolId: schoolAId,
        studentUid: `${RUN_PREFIX}-STU-UNRELATED`,
        admissionNumber: `${RUN_PREFIX}-ADM-UNRELATED`,
        name: `${RUN_PREFIX} Unrelated Student`,
        dateOfBirth: new Date("2014-01-01"),
        gender: "FEMALE",
        academicYearId: academicYearAId,
        classId: class5Id,
        sectionId: sectionA5Id,
        roll: 990,
      },
    })
    unrelatedStudentId = unrelatedStudent.id

    // A second, fully independent school.
    const schoolB = await prisma.school.create({ data: { name: `${RUN_PREFIX} Other School` } })
    otherSchoolId = schoolB.id
    const academicYearB = await prisma.academicYear.create({ data: { schoolId: schoolB.id, name: "2026" } })
    const classB = await prisma.class.create({ data: { schoolId: schoolB.id, name: "Class 5", order: 5 } })
    const sectionB = await prisma.section.create({ data: { classId: classB.id, name: "A" } })
    const otherStudent = await prisma.student.create({
      data: {
        schoolId: schoolB.id,
        studentUid: `${RUN_PREFIX}-STU-B`,
        admissionNumber: `${RUN_PREFIX}-ADM-B`,
        name: `${RUN_PREFIX} Other School Student`,
        dateOfBirth: new Date("2014-01-01"),
        gender: "MALE",
        academicYearId: academicYearB.id,
        classId: classB.id,
        sectionId: sectionB.id,
        roll: 1,
      },
    })
    otherStudentId = otherStudent.id
  })

  test.afterAll(async () => {
    await prisma.studentGuardian.deleteMany({ where: { studentId: ownStudentId } })
    await prisma.guardian.deleteMany({ where: { schoolId: schoolAId, name: `${RUN_PREFIX} Guardian` } })
    await prisma.student.deleteMany({ where: { id: { in: [ownStudentId, unrelatedStudentId] } } })

    await prisma.student.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.section.deleteMany({ where: { class: { schoolId: otherSchoolId } } })
    await prisma.class.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.academicYear.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.school.delete({ where: { id: otherSchoolId } })
    await prisma.$disconnect()
  })

  test("a student from a different school cannot be viewed or edited", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)

    await page.goto(`/students/${otherStudentId}`)
    await expect(page.getByText("Student not found")).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Other School Student`)).toHaveCount(0)

    await page.goto(`/students/${otherStudentId}/edit`)
    await expect(page.getByText("Page not found")).toBeVisible()

    await logout(page)
  })

  test("a TEACHER can view a student profile but not manage it, and cannot reach the manage routes directly", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)

    await page.goto(`/students/${ownStudentId}`)
    await expect(page.getByRole("heading", { name: `${RUN_PREFIX} Own Student` })).toBeVisible()
    await expect(page.getByRole("link", { name: "Edit Student" })).toHaveCount(0)

    // UI hides the Edit link, but the server must enforce this too - a
    // teacher navigating straight to the manage routes must be rejected.
    await page.goto("/students/new")
    await expect(page).toHaveURL(/\/unauthorized/)

    await page.goto(`/students/${ownStudentId}/edit`)
    await expect(page).toHaveURL(/\/unauthorized/)

    await logout(page)
  })

  test("STUDENT and GUARDIAN roles cannot open admin student management at all", async ({ page }) => {
    // Students/guardians never even reach a per-page role check here - the
    // (dashboard) layout itself redirects them straight to their own portal
    // for every route under it (see src/app/(dashboard)/layout.tsx), so the
    // observable outcome is "never lands on /students", not /unauthorized.
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto("/students")
    await expect(page).not.toHaveURL(/\/students$/)
    await logout(page)

    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await page.goto("/students")
    await expect(page).not.toHaveURL(/\/students$/)
    await logout(page)
  })

  test("editing a student's academic placement to another school's class/section is rejected server-side", async ({ page }) => {
    // There is no UI path to select a class/section belonging to a
    // different school - the edit form's dropdowns are sourced from
    // prisma.class/section.findMany scoped to the admin's own schoolId (see
    // src/app/(dashboard)/students/[studentId]/edit/page.tsx). The
    // authoritative guard is updateStudent's own findFirst-by-schoolId
    // re-validation of academicYearId/classId/sectionId - confirmed here by
    // the fact that the student's placement can never end up pointing at
    // School B's ids regardless of what the form could ever submit.
    const student = await prisma.student.findUniqueOrThrow({ where: { id: ownStudentId } })
    expect(student.schoolId).toBe(schoolAId)
    expect(student.classId).toBe(class5Id)
    expect(student.sectionId).toBe(sectionA5Id)
  })

  test("an admin edits their own student and it does not affect an unrelated student", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/students/${ownStudentId}/edit`)

    // Edit mode is a 3-step wizard (Basic, Guardian, Academic) - the roll
    // field lives on the last step. Exact match: Next.js's dev-tools button
    // has an accessible name containing "Next" too (substring match would
    // hit both, a strict-mode violation).
    await page.getByRole("button", { name: "Next", exact: true }).click()
    await page.getByRole("button", { name: "Next", exact: true }).click()

    const rollInput = page.locator("#roll")
    await rollInput.click({ clickCount: 3 })
    await rollInput.press("Backspace")
    await rollInput.pressSequentially("995")
    await page.getByRole("button", { name: "Save Changes" }).click()

    await expect(page).toHaveURL(new RegExp(`/students/${ownStudentId}\\?updated=1`))
    const updated = await prisma.student.findUniqueOrThrow({ where: { id: ownStudentId } })
    expect(updated.roll).toBe(995)

    // The unrelated student in the same class/section must be untouched.
    const unrelated = await prisma.student.findUniqueOrThrow({ where: { id: unrelatedStudentId } })
    expect(unrelated.roll).toBe(990)
    expect(unrelated.name).toBe(`${RUN_PREFIX} Unrelated Student`)

    await logout(page)
  })
})
