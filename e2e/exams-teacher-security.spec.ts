import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

let examId: string
let mathScheduleId: string
let class5Id: string
let class5SectionAId: string
let class5SectionBId: string
let class8Id: string
let class8SectionAId: string
let mathSubjectId: string
let englishSubjectId: string

test.describe("Teacher marks-entry authorization and security", () => {
  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId: school.id, name: "2026" } })

    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId: school.id, name: "Class 5" } })
    const class8 = await prisma.class.findFirstOrThrow({ where: { schoolId: school.id, name: "Class 8" } })
    class5Id = class5.id
    class8Id = class8.id
    class5SectionAId = (await prisma.section.findFirstOrThrow({ where: { classId: class5.id, name: "A" } })).id
    class5SectionBId = (await prisma.section.findFirstOrThrow({ where: { classId: class5.id, name: "B" } })).id
    class8SectionAId = (await prisma.section.findFirstOrThrow({ where: { classId: class8.id, name: "A" } })).id
    mathSubjectId = (await prisma.subject.findFirstOrThrow({ where: { schoolId: school.id, code: "MATH" } })).id
    englishSubjectId = (await prisma.subject.findFirstOrThrow({ where: { schoolId: school.id, code: "ENG" } })).id

    const examType = await prisma.examType.create({
      data: { schoolId: school.id, name: `Security Test Type ${Date.now()}` },
    })
    const exam = await prisma.exam.create({
      data: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        examTypeId: examType.id,
        name: `Security Test Exam ${Date.now()}`,
        startDate: new Date("2026-12-01"),
        endDate: new Date("2026-12-10"),
      },
    })
    examId = exam.id

    const mathSchedule = await prisma.examSchedule.create({
      data: {
        schoolId: school.id,
        examId,
        classId: class5Id,
        subjectId: mathSubjectId,
        examDate: new Date("2026-12-02"),
        fullMarks: 100,
        passMarks: 33,
      },
    })
    mathScheduleId = mathSchedule.id

    await prisma.examSchedule.create({
      data: {
        schoolId: school.id,
        examId,
        classId: class5Id,
        subjectId: englishSubjectId,
        examDate: new Date("2026-12-03"),
        fullMarks: 100,
        passMarks: 33,
      },
    })
    await prisma.examSchedule.create({
      data: {
        schoolId: school.id,
        examId,
        classId: class8Id,
        subjectId: mathSubjectId,
        examDate: new Date("2026-12-04"),
        fullMarks: 100,
        passMarks: 33,
      },
    })
  })

  test.afterAll(async () => {
    await prisma.examMark.deleteMany({ where: { examScheduleId: mathScheduleId } })
    const examTypeId = (await prisma.exam.findUniqueOrThrow({ where: { id: examId } })).examTypeId
    await prisma.examSchedule.deleteMany({ where: { examId } })
    await prisma.exam.delete({ where: { id: examId } })
    await prisma.examType.delete({ where: { id: examTypeId } })
    await prisma.$disconnect()
  })

  test("teacher can enter and update marks for their assigned class+section+subject", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(
      `/exams/${examId}/marks?classId=${class5Id}&sectionId=${class5SectionAId}&subjectId=${mathSubjectId}`
    )

    const marksInputs = page.locator('input[type="number"]')
    await expect(marksInputs.first()).toBeVisible()
    const count = await marksInputs.count()
    expect(count).toBeGreaterThan(0)

    const saveButton = page.getByRole("button", { name: "Save" })

    await marksInputs.first().fill("88")
    await saveButton.click()
    // Wait for this save's async server round trip (useTransition's pending
    // state, reflected in the button re-enabling) to actually finish before
    // starting the next one - otherwise the two saves can complete out of
    // click order and the second (91) can be overwritten by the first (88)
    // arriving late.
    await expect(saveButton).toBeEnabled()
    await expect(marksInputs.first()).toHaveValue("88")

    await marksInputs.first().fill("91")
    await saveButton.click()
    await expect(saveButton).toBeEnabled()
    await expect(marksInputs.first()).toHaveValue("91")

    const firstStudent = await prisma.student.findFirstOrThrow({
      where: { sectionId: class5SectionAId, academicYearId: (await prisma.academicYear.findFirstOrThrow({ where: { name: "2026" } })).id, status: "ACTIVE" },
      orderBy: { roll: "asc" },
    })
    const savedMark = await prisma.examMark.findUnique({
      where: { examScheduleId_studentId: { examScheduleId: mathScheduleId, studentId: firstStudent.id } },
    })
    expect(savedMark?.marks).toBe(91)
  })

  test("teacher's class/section/subject pickers only ever offer their own assignment", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(`/exams/${examId}/marks`)

    expect(await page.getByLabel("Class").locator("option").allTextContents()).toEqual(["Class 5"])
    expect(await page.getByLabel("Section").locator("option").allTextContents()).toEqual(["A"])
    expect(await page.getByLabel("Subject").locator("option").allTextContents()).toEqual(["Mathematics"])
  })

  test("teacher cannot reach 5A English by editing the URL", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(
      `/exams/${examId}/marks?classId=${class5Id}&sectionId=${class5SectionAId}&subjectId=${englishSubjectId}`
    )
    // The page silently falls back to the teacher's own valid schedule
    // rather than exposing English's roster - confirm no English-only data
    // is shown by checking the subject selection landed on Mathematics.
    await expect(page.getByLabel("Subject")).toHaveValue(mathSubjectId)
  })

  test("teacher cannot reach 5B Mathematics by editing the URL", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(
      `/exams/${examId}/marks?classId=${class5Id}&sectionId=${class5SectionBId}&subjectId=${mathSubjectId}`
    )
    await expect(page.getByLabel("Section")).toHaveValue(class5SectionAId)
  })

  test("teacher cannot reach Class 8 Mathematics by editing the URL", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(
      `/exams/${examId}/marks?classId=${class8Id}&sectionId=${class8SectionAId}&subjectId=${mathSubjectId}`
    )
    await expect(page.getByLabel("Class")).toHaveValue(class5Id)
  })

  test("a genuinely invalid combination (mixed from two real assignments) is rejected server-side", async ({
    page,
  }) => {
    // Give the teacher a second, real assignment (Class 5 / Section B /
    // Science) so an invalid combination can be constructed where each
    // individual field is independently valid, but the pairing is not
    // (Section B paired with Mathematics, which the teacher does not teach).
    const school = await prisma.school.findFirstOrThrow()
    const teacher = await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.teacher.email } })
    const scienceSubject = await prisma.subject.findFirstOrThrow({ where: { schoolId: school.id, code: "SCI" } })
    const secondAssignment = await prisma.teacherAssignment.create({
      data: {
        schoolId: school.id,
        teacherId: teacher.id,
        classId: class5Id,
        sectionId: class5SectionBId,
        subjectId: scienceSubject.id,
      },
    })

    try {
      await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)

      // Invalid: Section B (valid for Science) + Mathematics (valid for
      // Section A) - teacher has no assignment for this exact pairing. Both
      // fields independently pass the page's own allowed-options filtering
      // (each is valid for *some* of the teacher's assignments), so this one
      // actually reaches checkScheduleAccess and gets redirected, unlike the
      // single-assignment cases above which never even resolve to a schedule.
      await page.goto(
        `/exams/${examId}/marks?classId=${class5Id}&sectionId=${class5SectionBId}&subjectId=${mathSubjectId}`
      )
      await expect(page).toHaveURL(/\/unauthorized$/)

      const leaked = await prisma.examMark.findFirst({
        where: { examScheduleId: mathScheduleId, student: { sectionId: class5SectionBId } },
      })
      expect(leaked).toBeNull()
    } finally {
      await prisma.teacherAssignment.delete({ where: { id: secondAssignment.id } })
    }
  })

  test("a nonexistent exam id renders the not-found page, not a server error", async ({ page }) => {
    // Next's notFound() here renders the not-found boundary with a 200 on
    // the initial document request rather than a raw HTTP 404 (consistent
    // with how redirect() behaves the same way for /unauthorized above) -
    // assert on the actual rendered content instead of the status code.
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/exams/nonexistent-exam-id-000000")
    await expect(page.getByText("Page not found")).toBeVisible()
  })

  test("no ExamMark rows leaked into an unauthorized section across the whole run", async () => {
    const leaked = await prisma.examMark.findFirst({
      where: {
        examScheduleId: mathScheduleId,
        student: { sectionId: { in: [class5SectionBId, class8SectionAId] } },
      },
    })
    expect(leaked).toBeNull()
  })
})
