import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E TeacherYearSecurity ${Date.now()}`
const slug = RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()

let schoolId: string
let activeYearId: string
let otherYearId: string
let class5Id: string
let sectionA5Id: string
let mathSubjectId: string
let examTypeId: string

let yearScopedTeacherId: string
let legacyTeacherId: string

let homeworkOtherYearId: string
let homeworkActiveYearId: string

let examOtherYearId: string
let examActiveYearId: string

// Phase 12: Teacher academic authorization is scoped by
// Teacher + School + AcademicYear + Class + Section + Subject, not just the
// first four. This suite proves that scoping actually holds across every
// module that depends on it (Homework, Attendance, Exams, Results), using a
// teacher assigned ONLY in a non-active year and a teacher with a legacy
// (pre-Phase-12) null-year "standing" assignment. Cross-school/wrong-role/
// basic URL tampering are already covered by homework-security.spec.ts,
// teachers-security.spec.ts, and results-security.spec.ts - this file does
// not repeat them.
test.describe("Teacher authorization is scoped to the correct academic year", () => {
  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    schoolId = school.id
    const activeYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId, isActive: true } })
    activeYearId = activeYear.id
    const otherYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId, id: { not: activeYearId } } })
    otherYearId = otherYear.id

    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId, name: "Class 5" } })
    class5Id = class5.id
    const sectionA5 = await prisma.section.findFirstOrThrow({ where: { classId: class5Id, name: "A" } })
    sectionA5Id = sectionA5.id
    mathSubjectId = (await prisma.subject.findFirstOrThrow({ where: { schoolId, code: "MATH" } })).id
    examTypeId = (await prisma.examType.findFirstOrThrow({ where: { schoolId } })).id

    const realTeacher = await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.teacher.email } })

    // Assigned to Class 5 A Math ONLY in the non-active year - never in the
    // school's currently active year.
    const yearScopedTeacher = await prisma.user.create({
      data: {
        schoolId,
        name: `${RUN_PREFIX} Year Scoped Teacher`,
        email: `${slug}-year-scoped@test.local`,
        passwordHash: realTeacher.passwordHash,
        role: "TEACHER",
      },
    })
    yearScopedTeacherId = yearScopedTeacher.id
    await prisma.teacherAssignment.create({
      data: {
        schoolId,
        academicYearId: otherYearId,
        teacherId: yearScopedTeacherId,
        classId: class5Id,
        sectionId: sectionA5Id,
        subjectId: mathSubjectId,
      },
    })

    // A pre-Phase-12 "legacy" assignment with no academicYearId at all -
    // the documented standing-permission carve-out in
    // src/lib/academics/teacher-assignments.ts. Must authorize regardless of
    // which year the record in question belongs to.
    const legacyTeacher = await prisma.user.create({
      data: {
        schoolId,
        name: `${RUN_PREFIX} Legacy Teacher`,
        email: `${slug}-legacy@test.local`,
        passwordHash: realTeacher.passwordHash,
        role: "TEACHER",
      },
    })
    legacyTeacherId = legacyTeacher.id
    await prisma.teacherAssignment.create({
      data: {
        schoolId,
        academicYearId: null,
        teacherId: legacyTeacherId,
        classId: class5Id,
        sectionId: sectionA5Id,
        subjectId: mathSubjectId,
      },
    })

    const homeworkOtherYear = await prisma.homework.create({
      data: {
        schoolId,
        academicYearId: otherYearId,
        teacherId: yearScopedTeacherId,
        subjectId: mathSubjectId,
        classId: class5Id,
        sectionId: sectionA5Id,
        title: `${RUN_PREFIX} Other Year Homework`,
        instructions: "Assigned in the non-active year.",
        status: "PUBLISHED",
        assignedDate: new Date(),
        dueDate: new Date(Date.now() + 86400000 * 7),
      },
    })
    homeworkOtherYearId = homeworkOtherYear.id

    const homeworkActiveYear = await prisma.homework.create({
      data: {
        schoolId,
        academicYearId: activeYearId,
        teacherId: yearScopedTeacherId,
        subjectId: mathSubjectId,
        classId: class5Id,
        sectionId: sectionA5Id,
        title: `${RUN_PREFIX} Active Year Homework`,
        instructions: "Owned by the year-scoped teacher, but for the active year they are not assigned in.",
        status: "DRAFT",
        assignedDate: new Date(),
        dueDate: new Date(Date.now() + 86400000 * 7),
      },
    })
    homeworkActiveYearId = homeworkActiveYear.id

    const examOtherYear = await prisma.exam.create({
      data: {
        schoolId,
        academicYearId: otherYearId,
        examTypeId,
        name: `${RUN_PREFIX} Other Year Exam`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      },
    })
    examOtherYearId = examOtherYear.id
    await prisma.examSchedule.create({
      data: {
        schoolId,
        examId: examOtherYearId,
        classId: class5Id,
        subjectId: mathSubjectId,
        examDate: new Date(),
        fullMarks: 100,
        passMarks: 33,
      },
    })

    const examActiveYear = await prisma.exam.create({
      data: {
        schoolId,
        academicYearId: activeYearId,
        examTypeId,
        name: `${RUN_PREFIX} Active Year Exam`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      },
    })
    examActiveYearId = examActiveYear.id
    await prisma.examSchedule.create({
      data: {
        schoolId,
        examId: examActiveYearId,
        classId: class5Id,
        subjectId: mathSubjectId,
        examDate: new Date(),
        fullMarks: 100,
        passMarks: 33,
      },
    })
  })

  test.afterAll(async () => {
    await prisma.examSchedule.deleteMany({ where: { examId: { in: [examOtherYearId, examActiveYearId] } } })
    await prisma.exam.deleteMany({ where: { id: { in: [examOtherYearId, examActiveYearId] } } })
    await prisma.homework.deleteMany({ where: { id: { in: [homeworkOtherYearId, homeworkActiveYearId] } } })
    await prisma.teacherAssignment.deleteMany({ where: { teacherId: { in: [yearScopedTeacherId, legacyTeacherId] } } })
    await prisma.user.deleteMany({ where: { id: { in: [yearScopedTeacherId, legacyTeacherId] } } })
    await prisma.$disconnect()
  })

  test("homework: a teacher can view and manage a homework in the year they're actually assigned in", async ({ page }) => {
    await login(page, `${slug}-year-scoped@test.local`, ACCOUNTS.teacher.password)

    await page.goto(`/homework/${homeworkOtherYearId}`)
    await expect(page.getByRole("heading", { name: `${RUN_PREFIX} Other Year Homework` })).toBeVisible()
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible()

    await page.goto(`/homework/${homeworkOtherYearId}/edit`)
    await expect(page.locator("#homework-title")).toHaveValue(`${RUN_PREFIX} Other Year Homework`)

    await logout(page)
  })

  test("homework: owning a homework in a DIFFERENT year than the current assignment allows viewing but blocks managing", async ({ page }) => {
    await login(page, `${slug}-year-scoped@test.local`, ACCOUNTS.teacher.password)

    // Ownership (teacherId match) still lets them view their own historical
    // record, but write access is gated on THIS record's academic year.
    await page.goto(`/homework/${homeworkActiveYearId}`)
    await expect(page.getByRole("heading", { name: `${RUN_PREFIX} Active Year Homework` })).toBeVisible()
    await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0)

    // Next's streamed SSR can flush a 200 status before a deeper notFound()
    // resolves (see the same note in homework-security.spec.ts), so the
    // reliable signal is the rendered not-found content, not the response
    // status code.
    await page.goto(`/homework/${homeworkActiveYearId}/edit`)
    await expect(page.getByText("Page not found")).toBeVisible()

    await logout(page)
  })

  test("homework: the New Homework picker only offers classes assigned in the active year", async ({ page }) => {
    await login(page, `${slug}-year-scoped@test.local`, ACCOUNTS.teacher.password)
    await page.goto("/homework/new")
    await expect(page.locator(`#homework-class option[value="${class5Id}"]`)).toHaveCount(0)
    await logout(page)

    // The real seeded teacher IS assigned to Class 5 in the active year -
    // proves this is genuinely year-based, not a blanket lockout.
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto("/homework/new")
    await expect(page.locator(`#homework-class option[value="${class5Id}"]`)).toHaveCount(1)
    await logout(page)
  })

  test("attendance: the take-attendance picker excludes a class only assigned in a different year", async ({ page }) => {
    await login(page, `${slug}-year-scoped@test.local`, ACCOUNTS.teacher.password)
    await page.goto("/attendance")
    await expect(page.locator(`select[name="classId"] option[value="${class5Id}"]`)).toHaveCount(0)
    await logout(page)

    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto("/attendance")
    await expect(page.locator(`select[name="classId"] option[value="${class5Id}"]`)).toHaveCount(1)
    await logout(page)
  })

  test("attendance history: still shows a class from a past assignment year (historical access preserved)", async ({ page }) => {
    await login(page, `${slug}-year-scoped@test.local`, ACCOUNTS.teacher.password)
    await page.goto("/attendance/history")
    await expect(page.locator(`select[name="classId"] option[value="${class5Id}"]`)).toHaveCount(1)
    await logout(page)
  })

  test("exam marks: accessible for the year assigned, blocked for a different year's exam on the same class/subject", async ({ page }) => {
    await login(page, `${slug}-year-scoped@test.local`, ACCOUNTS.teacher.password)

    await page.goto(`/exams/${examOtherYearId}/marks`)
    await expect(page.getByText("Select a class and subject with a scheduled exam to enter marks.")).toHaveCount(0)

    await page.goto(`/exams/${examActiveYearId}/marks`)
    await expect(page.getByText("Select a class and subject with a scheduled exam to enter marks.")).toBeVisible()

    await logout(page)
  })

  test("results: accessible for the year assigned, redirected to /unauthorized for a different year", async ({ page }) => {
    await login(page, `${slug}-year-scoped@test.local`, ACCOUNTS.teacher.password)

    await page.goto(`/results/${examOtherYearId}/${class5Id}/${sectionA5Id}`)
    await expect(page).not.toHaveURL(/\/unauthorized/)

    await page.goto(`/results/${examActiveYearId}/${class5Id}/${sectionA5Id}`)
    await expect(page).toHaveURL(/\/unauthorized/)

    await logout(page)
  })

  test("legacy null-year assignment authorizes exam marks regardless of which year the exam belongs to", async ({ page }) => {
    // Exam marks access has no ownership concept (unlike homework, where a
    // teacher can only ever manage homework they personally created) - it is
    // purely TeacherAssignment-based via checkScheduleAccess, making it the
    // clean place to prove the null-year "standing permission" carve-out
    // holds across two different years for the exact same assignment row.
    await login(page, `${slug}-legacy@test.local`, ACCOUNTS.teacher.password)

    await page.goto(`/exams/${examOtherYearId}/marks`)
    await expect(page.getByText("Select a class and subject with a scheduled exam to enter marks.")).toHaveCount(0)

    await page.goto(`/exams/${examActiveYearId}/marks`)
    await expect(page.getByText("Select a class and subject with a scheduled exam to enter marks.")).toHaveCount(0)

    await logout(page)
  })
})
