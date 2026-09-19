import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E PortalGuardian ${Date.now()}`

let examId: string
let examTypeId: string
let scheduleId: string
let studentId: string // Nusrat Jahan (STU-0501) - guardian@benwil.test's linked child
let guardianId: string
let unrelatedStudentId: string // STU-0503 - not linked to this guardian
let secondChildLinkId: string | null = null

let otherSchoolId: string
let otherSchoolStudentId: string

test.describe("Guardian portal", () => {
  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId: school.id, name: "2026" } })
    const student = await prisma.student.findUniqueOrThrow({ where: { studentUid: "STU-0501" } })
    studentId = student.id
    // Looked up by email, not name - guardian@benwil.test's Guardian row is
    // upserted in seed.ts keyed by phone, and that upsert only ever patches
    // userId on an existing row, never name. In this shared dev database the
    // row already existed (created through real admission testing) under a
    // real display name, so `name` was never a stable fixture identifier -
    // email is (see prisma/seed.ts's guardian.upsert).
    const guardian = await prisma.guardian.findFirstOrThrow({ where: { schoolId: school.id, email: "guardian@benwil.test" } })
    guardianId = guardian.id
    const unrelated = await prisma.student.findUniqueOrThrow({ where: { studentUid: "STU-0503" } })
    unrelatedStudentId = unrelated.id

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
      data: { schoolId: school.id, examScheduleId: scheduleId, studentId, marks: 74, isAbsent: false, enteredById: teacher.id },
    })

    // A second school, entirely unrelated to this guardian, for the
    // cross-tenant check - a real id from a real school, not a random one.
    const otherSchool = await prisma.school.create({ data: { name: `${RUN_PREFIX} Other School` } })
    otherSchoolId = otherSchool.id
    const otherAcademicYear = await prisma.academicYear.create({ data: { schoolId: otherSchool.id, name: "2026" } })
    const otherClass = await prisma.class.create({ data: { schoolId: otherSchool.id, name: "Class 5", order: 5 } })
    const otherSection = await prisma.section.create({ data: { classId: otherClass.id, name: "A" } })
    const otherStudent = await prisma.student.create({
      data: {
        schoolId: otherSchool.id,
        studentUid: `${RUN_PREFIX}-STU`,
        admissionNumber: `${RUN_PREFIX}-ADM`,
        name: `${RUN_PREFIX} Other Student`,
        dateOfBirth: new Date("2014-01-01"),
        gender: "FEMALE",
        academicYearId: otherAcademicYear.id,
        classId: otherClass.id,
        sectionId: otherSection.id,
        roll: 1,
      },
    })
    otherSchoolStudentId = otherStudent.id
  })

  test.afterAll(async () => {
    await prisma.examMark.deleteMany({ where: { examScheduleId: scheduleId } })
    await prisma.examSchedule.deleteMany({ where: { examId } })
    await prisma.exam.delete({ where: { id: examId } })
    await prisma.examType.delete({ where: { id: examTypeId } })

    if (secondChildLinkId) {
      await prisma.studentGuardian.delete({ where: { id: secondChildLinkId } }).catch(() => {})
    }

    await prisma.student.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.section.deleteMany({ where: { class: { schoolId: otherSchoolId } } })
    await prisma.class.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.academicYear.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.school.delete({ where: { id: otherSchoolId } })

    await prisma.$disconnect()
  })

  test("login redirects straight to the sole child's dashboard", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await expect(page).toHaveURL(new RegExp(`/portal/guardian/children/${studentId}$`))
    // The dashboard's own H1 is now the guardian's own greeting ("Good
    // evening, Mrs./Mr. <guardian name>.") rather than the child's name -
    // see the Mr./Mrs. honorific commit. The subtitle paragraph ("Tracking
    // <name>'s academic journey...") is a single contiguous text node
    // naming the resolved child, so it's the stable per-child signal here -
    // unlike the sidebar's "Student: <name>" tag, which is split across
    // adjacent sibling spans with no text-node space between them, so
    // getByText's substring match (DOM textContent, not the a11y-snapshot
    // rendering) never finds "Student: <name>" as one string.
    await expect(page.getByText(/Tracking Nusrat Jahan/)).toBeVisible()
  })

  test("profile, attendance, and finalized results work for the linked child", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)

    await page.goto(`/portal/guardian/children/${studentId}/profile`)
    await expect(page.getByText("STU-0501").first()).toBeVisible()

    await page.goto(`/portal/guardian/children/${studentId}/attendance`)
    await expect(page.getByText("Attendance Percentage")).toBeVisible()

    // DRAFT by default - invisible.
    await page.goto(`/portal/guardian/children/${studentId}/results`)
    await expect(page.getByText(`${RUN_PREFIX} Exam`)).not.toBeVisible()
    await page.goto(`/portal/guardian/children/${studentId}/results/${examId}`)
    await expect(page.getByText("Page not found")).toBeVisible()

    await prisma.exam.update({ where: { id: examId }, data: { resultStatus: "FINALIZED" } })

    await page.goto(`/portal/guardian/children/${studentId}/results`)
    await expect(page.getByText(`${RUN_PREFIX} Exam`)).toBeVisible()
    await page.goto(`/portal/guardian/children/${studentId}/results/${examId}`)
    await expect(page.getByRole("cell", { name: "Mathematics" })).toBeVisible()
    await page.goto(`/portal/guardian/children/${studentId}/results/${examId}/report-card`)
    await expect(page.getByText("Nusrat Jahan").first()).toBeVisible()

    await prisma.exam.update({ where: { id: examId }, data: { resultStatus: "DRAFT" } })
  })

  test("with two children, the switcher appears and switching loads the right child", async ({ page }) => {
    const link = await prisma.studentGuardian.create({
      data: { studentId: unrelatedStudentId, guardianId, relation: "GUARDIAN", isPrimary: false },
    })
    secondChildLinkId = link.id

    try {
      await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
      // Two children now - no more auto-redirect, "My Children" lists both.
      await expect(page).toHaveURL(/\/portal\/guardian$/)
      await expect(page.getByText("Nusrat Jahan")).toBeVisible()
      await expect(page.getByText("Tania Akter")).toBeVisible()

      // Each child on this list is a <button>, not a link - click the
      // button itself rather than its inner text paragraph.
      await page.getByRole("button", { name: /Nusrat Jahan/ }).click()
      await expect(page).toHaveURL(new RegExp(`/portal/guardian/children/${studentId}$`))

      const switcher = page.locator("#portal-child-switcher")
      await expect(switcher).toBeVisible()
      await switcher.selectOption(unrelatedStudentId)
      await expect(page).toHaveURL(new RegExp(`/portal/guardian/children/${unrelatedStudentId}$`))
      // See the identical comment on the single-child login test above -
      // the H1 is the guardian's own greeting, not the child's name.
      await expect(page.getByText(/Tracking Tania Akter/)).toBeVisible()
    } finally {
      await prisma.studentGuardian.delete({ where: { id: link.id } })
      secondChildLinkId = null
    }
  })

  test("Bangla/English toggle and logout work", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await expect(page.getByText(/Tracking Nusrat Jahan/)).toBeVisible()

    await page.getByRole("button", { name: "Language" }).click()
    await page.getByRole("menuitem", { name: "বাংলা" }).click()
    await expect(page.getByRole("link", { name: "আমার সন্তানরা" }).first()).toBeVisible()

    await page.getByRole("button", { name: "ভাষা" }).click()
    await page.getByRole("menuitem", { name: "English" }).click()
    await expect(page.getByText(/Tracking Nusrat Jahan/)).toBeVisible()

    await logout(page)
    await expect(page).toHaveURL(/\/login$/)
  })

  test("cannot reach an unrelated student via URL manipulation", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await page.goto(`/portal/guardian/children/${unrelatedStudentId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
    await page.goto(`/portal/guardian/children/${unrelatedStudentId}/attendance`)
    await expect(page.getByText("Page not found")).toBeVisible()
    await page.goto(`/portal/guardian/children/${unrelatedStudentId}/results`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })

  test("cannot reach a student from another school via URL manipulation", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await page.goto(`/portal/guardian/children/${otherSchoolStudentId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })

  test("a guardian cannot reach admin routes or marks entry", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)

    await page.goto("/dashboard")
    await expect(page).toHaveURL(new RegExp(`/portal/guardian/children/${studentId}$`))

    await page.goto("/students")
    await expect(page).toHaveURL(new RegExp(`/portal/guardian/children/${studentId}$`))

    await page.goto(`/exams/${examId}/marks`)
    await expect(page).toHaveURL(new RegExp(`/portal/guardian/children/${studentId}$`))

    await page.goto("/results/grading")
    await expect(page).toHaveURL(new RegExp(`/portal/guardian/children/${studentId}$`))
  })
})
