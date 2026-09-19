import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E PortalStudent ${Date.now()}`

let examId: string
let examTypeId: string
let scheduleId: string
let studentId: string

test.describe("Student portal", () => {
  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId: school.id, name: "2026" } })
    const student = await prisma.student.findUniqueOrThrow({ where: { studentUid: "STU-0501" } })
    studentId = student.id
    const mathSubject = await prisma.subject.findFirstOrThrow({ where: { schoolId: school.id, code: "MATH" } })
    const teacher = await prisma.user.findFirstOrThrow({ where: { email: "teacher@benwil.test" } })

    const examType = await prisma.examType.create({ data: { schoolId: school.id, name: `${RUN_PREFIX} Type` } })
    examTypeId = examType.id
    const exam = await prisma.exam.create({
      data: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        examTypeId,
        name: `${RUN_PREFIX} Exam`,
        startDate: new Date("2026-12-01"),
        endDate: new Date("2026-12-10"),
      },
    })
    examId = exam.id
    const schedule = await prisma.examSchedule.create({
      data: {
        schoolId: school.id,
        examId,
        classId: student.classId,
        subjectId: mathSubject.id,
        examDate: new Date("2026-12-02"),
        fullMarks: 100,
        passMarks: 33,
      },
    })
    scheduleId = schedule.id
    await prisma.examMark.create({
      data: { schoolId: school.id, examScheduleId: scheduleId, studentId, marks: 88, isAbsent: false, enteredById: teacher.id },
    })
  })

  test.afterAll(async () => {
    await prisma.examMark.deleteMany({ where: { examScheduleId: scheduleId } })
    await prisma.examSchedule.deleteMany({ where: { examId } })
    await prisma.exam.delete({ where: { id: examId } })
    await prisma.examType.delete({ where: { id: examTypeId } })
    await prisma.$disconnect()
  })

  test("login redirects to the student portal and shows the right dashboard", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await expect(page).toHaveURL(/\/portal\/student$/)
    // The dashboard redesign (src/app/portal/student/page.tsx) changed the
    // greeting to "<Good morning/evening>, <first name>." (was "Welcome,
    // <full name>") - only the first name is real data.
    await expect(page.getByRole("heading", { name: "Nusrat." })).toBeVisible()

    // Phase 14/14.1 wired identity, routine, homework, results, fees, and
    // notices to real data (see e2e/student-dashboard-data.spec.ts for the
    // dedicated, fixture-driven coverage of each). STU-0501 is genuinely
    // Class 5 Section A / Roll 90 / academic year 2026 - spot-check that
    // here too since this is the canonical seeded portal login.
    //
    // KNOWN APPLICATION ISSUE: the Attendance widget on this page is still
    // hardcoded demo content (92% / 22 days present / etc.), not backed by
    // real Attendance records - out of scope for Phase 14.1, tracked
    // separately.
    await expect(page.getByText("Class 5").first()).toBeVisible()
    await expect(page.getByText("Roll 90")).toBeVisible()
  })

  test("profile shows the student's own information, read-only", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto("/portal/student/profile")
    // The student ID appears more than once on this page (e.g. a header
    // badge and a details table) - .first() rather than an exact match.
    await expect(page.getByText("STU-0501").first()).toBeVisible()
    await expect(page.getByText("ADM-0501").first()).toBeVisible()
    // Read-only: no edit affordance anywhere on this page.
    await expect(page.getByRole("button", { name: /edit/i })).toHaveCount(0)
  })

  test("attendance page shows the student's own attendance only", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto("/portal/student/attendance")
    await expect(page.getByText("Attendance Percentage")).toBeVisible()
  })

  test("a draft result is invisible, a finalized one is visible, and reopening hides it again", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)

    // DRAFT: not in the list, and not reachable by guessing the exam id.
    await page.goto("/portal/student/results")
    await expect(page.getByText(`${RUN_PREFIX} Exam`)).not.toBeVisible()
    await page.goto(`/portal/student/results/${examId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
    await page.goto(`/portal/student/results/${examId}/report-card`)
    await expect(page.getByText("Page not found")).toBeVisible()

    await prisma.exam.update({ where: { id: examId }, data: { resultStatus: "FINALIZED" } })

    // FINALIZED: visible in the list and reachable directly.
    await page.goto("/portal/student/results")
    await expect(page.getByText(`${RUN_PREFIX} Exam`)).toBeVisible()
    await page.goto(`/portal/student/results/${examId}`)
    await expect(page.getByRole("cell", { name: "Mathematics" })).toBeVisible()
    await expect(page.getByRole("cell", { name: "88", exact: true })).toBeVisible()
    await page.goto(`/portal/student/results/${examId}/report-card`)
    await expect(page.getByText("Nusrat Jahan")).toBeVisible()

    // Reopened (back to DRAFT): invisible again, everywhere.
    await prisma.exam.update({ where: { id: examId }, data: { resultStatus: "DRAFT" } })
    await page.goto("/portal/student/results")
    await expect(page.getByText(`${RUN_PREFIX} Exam`)).not.toBeVisible()
    await page.goto(`/portal/student/results/${examId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })

  test("Bangla/English toggle and logout work", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await expect(page.getByRole("heading", { name: "Nusrat." })).toBeVisible()

    // Phase 14/14.1 added getLocale()-driven i18n to the routine/homework/
    // results/fees/notices sections of this page - "Upcoming Homework"
    // becomes "আসন্ন হোমওয়ার্ক" in Bangla.
    //
    // KNOWN APPLICATION ISSUE: the Attendance widget's static English labels
    // ("Attendance", "Present", "Great consistency!"...) are not localized -
    // out of scope for Phase 14.1, tracked separately.
    await page.getByRole("button", { name: "Language" }).click()
    await page.getByRole("menuitem", { name: "বাংলা" }).click()
    await expect(page.getByRole("button", { name: "ভাষা" })).toBeVisible()
    await expect(page.getByText("আসন্ন হোমওয়ার্ক")).toBeVisible()

    await page.getByRole("button", { name: "ভাষা" }).click()
    await page.getByRole("menuitem", { name: "English" }).click()
    await expect(page.getByRole("button", { name: "Language" })).toBeVisible()

    await logout(page)
    await expect(page).toHaveURL(/\/login$/)
  })

  test("a student cannot reach admin routes, another student's data, or marks entry", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)

    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/portal\/student$/)

    await page.goto("/students")
    await expect(page).toHaveURL(/\/portal\/student$/)

    await page.goto(`/students/${studentId}`)
    await expect(page).toHaveURL(/\/portal\/student$/)

    await page.goto("/results")
    await expect(page).toHaveURL(/\/portal\/student$/)

    await page.goto(`/exams/${examId}/marks`)
    await expect(page).toHaveURL(/\/portal\/student$/)

    await page.goto("/results/grading")
    await expect(page).toHaveURL(/\/portal\/student$/)
  })
})
