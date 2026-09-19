import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E HomeworkTermAssessment ${Date.now()}`

let schoolId: string
let academicYearId: string
let class5Id: string
let sectionA5Id: string
let mathSubjectId: string
let teacherId: string
let studentId: string

let examTypeId: string
let examId: string
let scheduleId: string
let homeworkId: string

// Written marks out of (fullMarks - homeworkMaxMarks) = 100 - 10 = 90.
const FULL_MARKS = 100
const HOMEWORK_MAX_MARKS = 10
const WRITTEN_MAX_MARKS = FULL_MARKS - HOMEWORK_MAX_MARKS

test.describe("Homework marks -> Term Exam result integration", () => {
  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    schoolId = school.id
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId, name: "2026" } })
    academicYearId = academicYear.id
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId, name: "Class 5" } })
    class5Id = class5.id
    const sectionA5 = await prisma.section.findFirstOrThrow({ where: { classId: class5Id, name: "A" } })
    sectionA5Id = sectionA5.id
    const mathSubject = await prisma.subject.findFirstOrThrow({ where: { schoolId, code: "MATH" } })
    mathSubjectId = mathSubject.id
    const teacher = await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.teacher.email } })
    teacherId = teacher.id
    // Linked to student@benwil.test / guardian@benwil.test (see prisma/seed.ts).
    const student = await prisma.student.findFirstOrThrow({ where: { studentUid: "STU-0501" } })
    studentId = student.id

    const examType = await prisma.examType.create({ data: { schoolId, name: `${RUN_PREFIX} Type` } })
    examTypeId = examType.id
    const exam = await prisma.exam.create({
      data: {
        schoolId,
        academicYearId,
        examTypeId,
        name: `${RUN_PREFIX} Exam`,
        startDate: new Date("2026-11-01"),
        endDate: new Date("2026-11-10"),
      },
    })
    examId = exam.id
    const schedule = await prisma.examSchedule.create({
      data: {
        schoolId,
        examId,
        classId: class5Id,
        subjectId: mathSubjectId,
        examDate: new Date("2026-11-02"),
        fullMarks: FULL_MARKS,
        passMarks: 33,
        homeworkMaxMarks: HOMEWORK_MAX_MARKS,
      },
    })
    scheduleId = schedule.id

    const homework = await prisma.homework.create({
      data: {
        schoolId,
        academicYearId,
        teacherId,
        subjectId: mathSubjectId,
        classId: class5Id,
        sectionId: sectionA5Id,
        title: `${RUN_PREFIX} Homework`,
        instructions: "Practice problems.",
        assignedDate: new Date(),
        dueDate: new Date(Date.now() + 86400000 * 7),
        maxMarks: 20,
        status: "PUBLISHED",
      },
    })
    homeworkId = homework.id
    await prisma.homeworkSubmission.create({
      data: {
        schoolId,
        homeworkId,
        studentId,
        status: "SUBMITTED",
        content: "My homework answers.",
        submittedAt: new Date(),
      },
    })
  })

  test.afterAll(async () => {
    await prisma.examMark.deleteMany({ where: { examScheduleId: scheduleId } })
    await prisma.examSchedule.deleteMany({ where: { examId } })
    await prisma.exam.delete({ where: { id: examId } })
    await prisma.examType.delete({ where: { id: examTypeId } })
    await prisma.homeworkSubmission.deleteMany({ where: { homeworkId } })
    await prisma.homework.deleteMany({ where: { id: homeworkId } })
    await prisma.$disconnect()
  })

  test("written marks entry rejects a value above the reduced (fullMarks - homeworkMaxMarks) cap", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(`/exams/${examId}/marks?classId=${class5Id}&sectionId=${sectionA5Id}&subjectId=${mathSubjectId}`)

    await expect(page.getByText(new RegExp(`Written marks are out of ${WRITTEN_MAX_MARKS}`))).toBeVisible()

    const row = page.getByRole("row").filter({ hasText: await studentName() })
    await row.getByRole("spinbutton").fill(String(WRITTEN_MAX_MARKS + 5))
    await page.getByRole("button", { name: "Save", exact: true }).click()
    await expect(page.getByText("Marks must be between 0 and full marks.")).toBeVisible()

    const mark = await prisma.examMark.findUnique({
      where: { examScheduleId_studentId: { examScheduleId: scheduleId, studentId } },
    })
    expect(mark).toBeNull() // rejected save never persisted anything
  })

  test("teacher enters written marks, reviews homework, and the result totals both", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(`/exams/${examId}/marks?classId=${class5Id}&sectionId=${sectionA5Id}&subjectId=${mathSubjectId}`)

    const row = page.getByRole("row").filter({ hasText: await studentName() })
    await row.getByRole("spinbutton").fill("80")
    await page.getByRole("button", { name: "Save", exact: true }).click()
    await expect(page.getByText("Marks saved")).toBeVisible()

    await page.goto(`/homework/${homeworkId}/submissions/${studentId}`)
    await page.locator('input[name="marks"]').fill("16")
    await page.locator('textarea[name="feedback"]').fill("Good effort.")
    await page.getByRole("button", { name: "Save Feedback" }).click()
    await expect(page.getByText("Feedback saved successfully.")).toBeVisible()

    // 16/20 homework -> 8/10 scaled contribution; total = 80 + 8 = 88.
    // The class/section overview shows the combined total ("88 / 100");
    // the written/homework breakdown itself only renders on the per-student
    // detail view (ResultDetailView), which both the admin and portal result
    // pages share - see src/components/results/result-detail-view.tsx.
    await page.goto(`/results/${examId}/${class5Id}/${sectionA5Id}`)
    await expect(page.getByText("88 / 100")).toBeVisible()

    await page.goto(`/results/${examId}/student/${studentId}`)
    await expect(page.getByText("Written: 80, Homework: 8")).toBeVisible()
  })

  test("updating the homework mark updates the still-DRAFT result live", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(`/homework/${homeworkId}/submissions/${studentId}`)
    await page.locator('input[name="marks"]').fill("18")
    await page.getByRole("button", { name: "Save Feedback" }).click()
    await expect(page.getByText("Feedback saved successfully.")).toBeVisible()

    // 18/20 -> 9/10 scaled; total = 80 + 9 = 89.
    await page.goto(`/results/${examId}/student/${studentId}`)
    await expect(page.getByText("Written: 80, Homework: 9")).toBeVisible()
  })

  test("finalizing freezes the homework contribution; a later homework edit does not change it until reopened", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/results/${examId}/${class5Id}/${sectionA5Id}`)
    await page.getByRole("button", { name: "Finalize Results" }).click()
    await expect(page.getByText("Results finalized")).toBeVisible()
    await logout(page)

    // Homework mark changes to 20/20 (would be 10/10 if live) - but the
    // exam is now FINALIZED, so the frozen 9 from the previous test must
    // still be what the result shows.
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(`/homework/${homeworkId}/submissions/${studentId}`)
    await page.locator('input[name="marks"]').fill("20")
    await page.getByRole("button", { name: "Save Feedback" }).click()
    await expect(page.getByText("Feedback saved successfully.")).toBeVisible()
    await logout(page)

    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/results/${examId}/student/${studentId}`)
    await expect(page.getByText("Written: 80, Homework: 9")).toBeVisible() // still frozen, not 10

    // Reopen -> recalculates live again, now reflecting the 20/20 homework mark.
    await page.goto(`/results/${examId}/${class5Id}/${sectionA5Id}`)
    await page.getByRole("button", { name: "Reopen Results" }).click()
    await expect(page.getByText("Results reopened")).toBeVisible()

    await page.goto(`/results/${examId}/student/${studentId}`)
    await expect(page.getByText("Written: 80, Homework: 10")).toBeVisible()
  })

  test("student portal shows the student's own homework mark and feedback", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto(`/portal/student/homework/${homeworkId}`)
    await expect(page.getByText("20 / 20")).toBeVisible()
    await expect(page.getByText("Good effort.")).toBeVisible()
  })

  test("guardian portal shows the linked child's homework mark and feedback", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await page.goto(`/portal/guardian/children/${studentId}/homework/${homeworkId}`)
    await expect(page.getByText("20 / 20")).toBeVisible()
    await expect(page.getByText("Good effort.")).toBeVisible()
  })
})

async function studentName() {
  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId }, select: { name: true } })
  return student.name
}
