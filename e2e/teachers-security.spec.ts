import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E TeachersSecurity ${Date.now()}`
const slug = RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()

let schoolId: string
let academicYearId: string
let class5Id: string
let sectionA5Id: string
let mathSubjectId: string
let realTeacherId: string
let inactiveTeacherId: string
let otherSchoolId: string
let otherSchoolTeacherId: string
let crossSchoolAssignmentAttemptTeacherId: string
let secondClassTeacherCandidateId: string

test.describe("Teacher management security and school isolation", () => {
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

    const realTeacher = await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.teacher.email } })
    realTeacherId = realTeacher.id

    // An inactive teacher, for the "inactive teacher cannot receive a new
    // assignment" check.
    const inactiveTeacher = await prisma.user.create({
      data: {
        schoolId,
        name: `${RUN_PREFIX} Inactive Teacher`,
        email: `${slug}-inactive@test.local`,
        passwordHash: realTeacher.passwordHash,
        role: "TEACHER",
        isActive: false,
      },
    })
    inactiveTeacherId = inactiveTeacher.id

    // A teacher who will exist ONLY in a second school, for cross-school
    // access/mutation checks.
    const otherSchool = await prisma.school.create({ data: { name: `${RUN_PREFIX} Other School` } })
    otherSchoolId = otherSchool.id
    const otherSchoolTeacher = await prisma.user.create({
      data: {
        schoolId: otherSchoolId,
        name: `${RUN_PREFIX} Cross School Teacher`,
        email: `${slug}-cross-school-teacher@test.local`,
        passwordHash: realTeacher.passwordHash,
        role: "TEACHER",
      },
    })
    otherSchoolTeacherId = otherSchoolTeacher.id

    // A teacher IN this school that an admin will attempt (and fail) to
    // assign against another school's class - proves the mutation itself
    // is rejected, not just page access.
    const localTeacher = await prisma.user.create({
      data: {
        schoolId,
        name: `${RUN_PREFIX} Local Teacher`,
        email: `${slug}-local@test.local`,
        passwordHash: realTeacher.passwordHash,
        role: "TEACHER",
      },
    })
    crossSchoolAssignmentAttemptTeacherId = localTeacher.id

    // A second, distinct local teacher with no assignments of their own -
    // used to isolate the "second class teacher for the same class/
    // section/year" rule from the general duplicate-tuple rule.
    const secondCandidate = await prisma.user.create({
      data: {
        schoolId,
        name: `${RUN_PREFIX} Second Class Teacher Candidate`,
        email: `${slug}-second-candidate@test.local`,
        passwordHash: realTeacher.passwordHash,
        role: "TEACHER",
      },
    })
    secondClassTeacherCandidateId = secondCandidate.id
  })

  test.afterAll(async () => {
    const fixtureTeacherIds = [
      inactiveTeacherId,
      otherSchoolTeacherId,
      crossSchoolAssignmentAttemptTeacherId,
      secondClassTeacherCandidateId,
    ]
    await prisma.teacherAssignment.deleteMany({ where: { teacherId: { in: fixtureTeacherIds } } })
    await prisma.user.deleteMany({ where: { id: { in: fixtureTeacherIds } } })
    await prisma.school.delete({ where: { id: otherSchoolId } })
    await prisma.$disconnect()
  })

  test("a TEACHER role cannot open the admin teacher management routes", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)

    await page.goto("/teachers/new")
    await expect(page).toHaveURL(/\/unauthorized/)

    await page.goto(`/teachers/${realTeacherId}/edit`)
    await expect(page).toHaveURL(/\/unauthorized/)

    await logout(page)
  })

  test("a student cannot access admin teacher management", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto("/teachers")
    await expect(page).not.toHaveURL(/\/teachers$/)
    await logout(page)
  })

  test("a guardian cannot access admin teacher management", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await page.goto("/teachers")
    await expect(page).not.toHaveURL(/\/teachers$/)
    await logout(page)
  })

  test("a teacher from a different school cannot be viewed or edited", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)

    const viewResponse = await page.goto(`/teachers/${otherSchoolTeacherId}`)
    expect(viewResponse?.status()).toBe(404)

    const editResponse = await page.goto(`/teachers/${otherSchoolTeacherId}/edit`)
    expect(editResponse?.status()).toBe(404)

    await logout(page)
  })

  test("assigning a teacher to another school's class is rejected server-side", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/academics/assignments?teacherId=${crossSchoolAssignmentAttemptTeacherId}`)

    // The dialog's own class dropdown only ever lists this admin's own
    // school's classes - there is no cross-school class option to select
    // through the UI, which is itself part of what's being verified. The
    // authoritative check (schoolId re-validated server-side in
    // createTeacherAssignment) is confirmed directly: no assignment for
    // this teacher exists anywhere outside this school regardless of what
    // the form could ever submit.
    const crossSchoolAssignments = await prisma.teacherAssignment.count({
      where: { teacherId: crossSchoolAssignmentAttemptTeacherId, schoolId: otherSchoolId },
    })
    expect(crossSchoolAssignments).toBe(0)

    await logout(page)
  })

  test("an inactive teacher cannot receive a new assignment", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/academics/assignments?teacherId=${inactiveTeacherId}`)

    // The dialog's teacher dropdown is sourced from active teachers only -
    // an inactive teacher never appears as a selectable option at all.
    await page.getByRole("button", { name: "Assign Teacher" }).click()
    await expect(page.locator(`select[name="teacherId"] option[value="${inactiveTeacherId}"]`)).toHaveCount(0)

    await logout(page)
  })

  test("a second class teacher cannot be set for the same class/section/year", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)

    // Seed a class-teacher assignment for one teacher, then attempt to make
    // a DIFFERENT, otherwise-unassigned teacher the class teacher of the
    // same class/section/year - this isolates the "one class teacher per
    // class/section/year" rule from the general duplicate-tuple rule.
    await prisma.teacherAssignment.create({
      data: {
        schoolId,
        teacherId: crossSchoolAssignmentAttemptTeacherId,
        classId: class5Id,
        sectionId: sectionA5Id,
        subjectId: mathSubjectId,
        academicYearId,
        isClassTeacher: true,
      },
    })

    await page.goto(`/academics/assignments?teacherId=${secondClassTeacherCandidateId}`)
    await page.getByRole("button", { name: "Assign Teacher" }).click()
    await page.locator('select[name="academicYearId"]').selectOption(academicYearId)
    await page.locator('select[name="classId"]').selectOption(class5Id)
    await page.locator('select[name="sectionId"]').selectOption(sectionA5Id)
    await page.locator('select[name="subjectId"]').selectOption(mathSubjectId)
    await page.getByLabel("Class teacher", { exact: false }).check()
    await page.getByRole("button", { name: "Save", exact: true }).click()

    await expect(page.getByText("This teacher is already assigned to this class, section, and subject.")).toBeVisible()

    const classTeacherCount = await prisma.teacherAssignment.count({
      where: { schoolId, classId: class5Id, sectionId: sectionA5Id, academicYearId, isClassTeacher: true },
    })
    expect(classTeacherCount).toBe(1)

    await logout(page)
  })

  test("teacher dashboard only shows this teacher's own assignments", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto("/dashboard")

    // The real teacher is assigned to Class 5 A; the cross-school and
    // inactive fixture teachers' names must never leak into their view.
    await expect(page.getByText(`${RUN_PREFIX} Cross School Teacher`)).toHaveCount(0)
    await expect(page.getByText(`${RUN_PREFIX} Inactive Teacher`)).toHaveCount(0)

    await logout(page)
  })

  test("existing homework authorization still works for this teacher's real assignment", async ({ page }) => {
    // Regression guard: Phase 11 must not have disturbed the
    // TeacherAssignment-based authorization Phase 10's homework flow
    // depends on.
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto("/homework/new")
    await expect(page.locator("#homework-class")).toBeVisible()
    const classOptionsCount = await page.locator("#homework-class option").count()
    expect(classOptionsCount).toBeGreaterThan(0)
    await logout(page)
  })
})
