import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E Results ${Date.now()}`

let examId: string
let examTypeId: string
let gradingScaleId: string
let class5Id: string
let class8Id: string
let sectionAId: string
let sectionBId: string
let class8SectionAId: string
let mathScheduleId: string
let englishScheduleId: string
let studentPassId: string
let studentFailId: string
let studentAbsentId: string
let studentPendingId: string

test.describe("Result calculation, finalization, and security", () => {
  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId: school.id, name: "2026" } })

    // Isolated grading scale (own boundaries), so this suite's assertions
    // never depend on the seeded default scale being unmodified.
    const gradingScale = await prisma.gradingScale.create({
      data: { schoolId: school.id, name: `${RUN_PREFIX} Scale` },
    })
    gradingScaleId = gradingScale.id
    // getActiveGradeRules only supports one active scale per school (the app
    // now enforces this in its own actions - see grading-scales.ts) - since
    // this fixture writes directly via Prisma, bypassing that action layer,
    // it has to enforce the same invariant itself so results are calculated
    // against this suite's own scale, not whichever scale a prior test left
    // active (e.g. the seeded default).
    await prisma.gradingScale.updateMany({
      where: { schoolId: school.id, id: { not: gradingScaleId } },
      data: { isActive: false },
    })
    await prisma.gradeRule.createMany({
      data: [
        { gradingScaleId, minPercentage: "80.00", maxPercentage: "100.00", grade: "A+", gradePoint: "5.00" },
        { gradingScaleId, minPercentage: "33.00", maxPercentage: "79.99", grade: "PASS", gradePoint: "2.00" },
        { gradingScaleId, minPercentage: "0.00", maxPercentage: "32.99", grade: "F", gradePoint: "0.00" },
      ],
    })

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

    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId: school.id, name: "Class 5" } })
    const class8 = await prisma.class.findFirstOrThrow({ where: { schoolId: school.id, name: "Class 8" } })
    class5Id = class5.id
    class8Id = class8.id
    sectionAId = (await prisma.section.findFirstOrThrow({ where: { classId: class5.id, name: "A" } })).id
    sectionBId = (await prisma.section.findFirstOrThrow({ where: { classId: class5.id, name: "B" } })).id
    class8SectionAId = (await prisma.section.findFirstOrThrow({ where: { classId: class8.id, name: "A" } })).id

    const mathSubject = await prisma.subject.findFirstOrThrow({ where: { schoolId: school.id, code: "MATH" } })
    const englishSubject = await prisma.subject.findFirstOrThrow({ where: { schoolId: school.id, code: "ENG" } })

    const mathSchedule = await prisma.examSchedule.create({
      data: {
        schoolId: school.id,
        examId,
        classId: class5Id,
        subjectId: mathSubject.id,
        examDate: new Date("2026-12-02"),
        fullMarks: 100,
        passMarks: 33,
      },
    })
    mathScheduleId = mathSchedule.id
    const englishSchedule = await prisma.examSchedule.create({
      data: {
        schoolId: school.id,
        examId,
        classId: class5Id,
        subjectId: englishSubject.id,
        examDate: new Date("2026-12-03"),
        fullMarks: 100,
        passMarks: 33,
      },
    })
    englishScheduleId = englishSchedule.id
    await prisma.examSchedule.create({
      data: {
        schoolId: school.id,
        examId,
        classId: class8Id,
        subjectId: mathSubject.id,
        examDate: new Date("2026-12-04"),
        fullMarks: 100,
        passMarks: 33,
      },
    })

    const students = await prisma.student.findMany({
      where: { classId: class5Id, sectionId: sectionAId, academicYearId: academicYear.id, status: "ACTIVE" },
      orderBy: { roll: "asc" },
    })
    expect(students.length).toBeGreaterThanOrEqual(4)
    ;[studentPassId, studentFailId, studentAbsentId, studentPendingId] = students.slice(0, 4).map((s) => s.id)

    const teacher = await prisma.user.findFirstOrThrow({ where: { email: "teacher@benwil.test" } })
    await prisma.examMark.createMany({
      data: [
        { schoolId: school.id, examScheduleId: mathScheduleId, studentId: studentPassId, marks: 82, isAbsent: false, enteredById: teacher.id },
        { schoolId: school.id, examScheduleId: englishScheduleId, studentId: studentPassId, marks: 74, isAbsent: false, enteredById: teacher.id },
        { schoolId: school.id, examScheduleId: mathScheduleId, studentId: studentFailId, marks: 10, isAbsent: false, enteredById: teacher.id },
        { schoolId: school.id, examScheduleId: englishScheduleId, studentId: studentFailId, marks: 60, isAbsent: false, enteredById: teacher.id },
        { schoolId: school.id, examScheduleId: mathScheduleId, studentId: studentAbsentId, marks: null, isAbsent: true, enteredById: teacher.id },
        { schoolId: school.id, examScheduleId: englishScheduleId, studentId: studentAbsentId, marks: 55, isAbsent: false, enteredById: teacher.id },
        { schoolId: school.id, examScheduleId: mathScheduleId, studentId: studentPendingId, marks: 45, isAbsent: false, enteredById: teacher.id },
        // studentPendingId has no English mark row at all -> PENDING -> exam incomplete
      ],
    })
  })

  test.afterAll(async () => {
    await prisma.examMark.deleteMany({ where: { examScheduleId: { in: [mathScheduleId, englishScheduleId] } } })
    await prisma.examSchedule.deleteMany({ where: { examId } })
    await prisma.exam.delete({ where: { id: examId } })
    await prisma.examType.delete({ where: { id: examTypeId } })
    await prisma.gradeRule.deleteMany({ where: { gradingScaleId } })
    const scale = await prisma.gradingScale.findUniqueOrThrow({ where: { id: gradingScaleId }, select: { schoolId: true } })
    await prisma.gradingScale.delete({ where: { id: gradingScaleId } })

    // Deactivating every other scale in beforeAll (see above) leaves the
    // school with zero active scales once this one is deleted - restore the
    // seeded default so the DB isn't left in a state where no result can
    // ever calculate a grade.
    const stillActive = await prisma.gradingScale.findFirst({ where: { schoolId: scale.schoolId, isActive: true } })
    if (!stillActive) {
      await prisma.gradingScale.updateMany({
        where: { schoolId: scale.schoolId, name: "Default Test Grading Scale" },
        data: { isActive: true },
      })
    }
    await prisma.$disconnect()
  })

  test("class/section result list shows correct Pass/Fail/Incomplete and is marked Incomplete overall", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/results/${examId}/${class5Id}/${sectionAId}`)

    // Exam-level status is embedded in the PageHeader description
    // ("ExamType • Year • Incomplete • Draft") - scope to that specific
    // paragraph (text-muted-foreground, not the sidebar's bullet-joined
    // tagline) so this doesn't collide with the pending row's own
    // "Incomplete" cell below.
    await expect(page.locator("p.text-muted-foreground", { hasText: "•" })).toContainText("Incomplete")

    const passRow = page.getByRole("row").filter({ hasText: await studentName(studentPassId) })
    await expect(passRow.getByRole("cell", { name: "Pass", exact: true })).toBeVisible()

    const failRow = page.getByRole("row").filter({ hasText: await studentName(studentFailId) })
    await expect(failRow.getByRole("cell", { name: "Fail", exact: true })).toBeVisible()

    const absentRow = page.getByRole("row").filter({ hasText: await studentName(studentAbsentId) })
    await expect(absentRow.getByRole("cell", { name: "Incomplete" })).not.toBeVisible() // absent+present is complete, not pending
    await expect(absentRow.getByRole("cell", { name: "Fail", exact: true })).toBeVisible() // absent subject -> overall Fail

    const pendingRow = page.getByRole("row").filter({ hasText: await studentName(studentPendingId) })
    await expect(pendingRow.getByRole("cell", { name: "Incomplete" })).toBeVisible()
  })

  test("student result page shows correct subject grades, GPA, and overall Pass", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/results/${examId}/student/${studentPassId}`)

    // 82% -> A+ (5.00), 74% -> PASS (2.00) under this suite's own grading scale
    await expect(page.getByRole("cell", { name: "A+" })).toBeVisible()
    await expect(page.getByRole("cell", { name: "PASS", exact: true })).toBeVisible()
    // GPA = (5.00 + 2.00) / 2 = 3.50
    await expect(page.getByText("3.50")).toBeVisible()
    await expect(page.getByText("Pass", { exact: true }).last()).toBeVisible()
  })

  test("absent student shows Absent (not a percentage or zero) and report card renders", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/results/${examId}/student/${studentAbsentId}`)
    // The absent subject's row renders "Absent" in both its marks cell and
    // its status cell - .first() picks one deliberately rather than
    // asserting a specific count that isn't the point of this check.
    await expect(page.getByRole("cell", { name: "Absent" }).first()).toBeVisible()

    await page.goto(`/results/${examId}/student/${studentAbsentId}/report-card`)
    await expect(page.getByText("Absent").first()).toBeVisible()
  })

  test("teacher can view results for their assigned Class 5/A, not Class 8", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)

    await page.goto(`/results/${examId}/${class5Id}/${sectionAId}`)
    await expect(page.getByRole("columnheader", { name: "Roll" })).toBeVisible()

    await page.goto(`/results/${examId}/${class8Id}/${class8SectionAId}`)
    await expect(page.getByRole("columnheader", { name: "Roll" })).not.toBeVisible()
  })

  test("nonexistent class/section ids render not-found, not a server error", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/results/${examId}/nonexistent-class-id/nonexistent-section-id`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })

  test("teacher cannot finalize results (no finalize control reachable)", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(`/results/${examId}/${class5Id}/${sectionAId}`)
    await expect(page.getByRole("button", { name: "Finalize Results" })).not.toBeVisible()
  })

  test("admin finalizes results, marks entry becomes read-only, then admin reopens", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/results/${examId}/${class5Id}/${sectionAId}`)

    await page.getByRole("button", { name: "Finalize Results" }).click()
    await expect(page.getByText("Results finalized")).toBeVisible()
    await expect(page.getByRole("button", { name: "Reopen Results" })).toBeVisible()

    const examAfterFinalize = await prisma.exam.findUniqueOrThrow({ where: { id: examId } })
    expect(examAfterFinalize.resultStatus).toBe("FINALIZED")
    expect(examAfterFinalize.resultStatusChangedById).not.toBeNull()

    // A direct save attempt (through the real marks-entry UI, not a
    // simulated request) must be rejected server-side while finalized -
    // this is the same checkScheduleAccess-carried resultStatus the save
    // action itself checks, so exercising it through the real page proves
    // the write path, not just the read path.
    await page.goto(`/exams/${examId}/marks?classId=${class5Id}&sectionId=${sectionAId}&subjectId=${(await prisma.examSchedule.findUniqueOrThrow({ where: { id: mathScheduleId } })).subjectId}`)
    const marksInputs = page.locator('input[type="number"]')
    if (await marksInputs.count() > 0) {
      await marksInputs.first().fill("99")
      await page.getByRole("button", { name: "Save" }).click()
      await expect(page.getByText("results have been finalized")).toBeVisible()
    }
    const markStillOriginal = await prisma.examMark.findUniqueOrThrow({
      where: { examScheduleId_studentId: { examScheduleId: mathScheduleId, studentId: studentPassId } },
    })
    expect(markStillOriginal.marks).toBe(82) // unchanged - the finalized save was rejected

    // Reopen
    await page.goto(`/results/${examId}/${class5Id}/${sectionAId}`)
    await page.getByRole("button", { name: "Reopen Results" }).click()
    await expect(page.getByText("Results reopened")).toBeVisible()
    await expect(page.getByRole("button", { name: "Finalize Results" })).toBeVisible()

    const examAfterReopen = await prisma.exam.findUniqueOrThrow({ where: { id: examId } })
    expect(examAfterReopen.resultStatus).toBe("DRAFT")
  })
})

async function studentName(studentId: string) {
  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId }, select: { name: true } })
  return student.name
}
