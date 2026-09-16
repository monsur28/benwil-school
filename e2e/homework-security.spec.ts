import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E HomeworkSecurity ${Date.now()}`

let schoolId: string
let academicYearId: string
let class5Id: string
let sectionA5Id: string
let mathSubjectId: string
let teacherId: string
let studentId: string
let homeworkWithSubmissionId: string
let freshHomeworkId: string
let submissionId: string
let otherTeacherId: string
let otherSchoolId: string
let otherSchoolTeacherId: string

test.describe("Homework security and grading validation", () => {
  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    schoolId = school.id
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId, name: "2026" } })
    academicYearId = academicYear.id
    mathSubjectId = (await prisma.subject.findFirstOrThrow({ where: { schoolId, code: "MATH" } })).id

    const teacher = await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.teacher.email } })
    teacherId = teacher.id

    // The class/section have several students seeded for exam testing -
    // this must be the ONE actually linked to student@benwil.test /
    // guardian@benwil.test (not just any student in the section), since the
    // student-submit and guardian-read-only tests log in as those exact
    // portal accounts and need their real linked student record.
    const studentUser = await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.student.email } })
    const student = await prisma.student.findFirstOrThrow({ where: { userId: studentUser.id, schoolId } })
    studentId = student.id
    class5Id = student.classId
    sectionA5Id = student.sectionId

    // A homework the seeded teacher owns, with a real maxMarks bound and an
    // already-submitted (ungraded) student answer - the fixture the
    // marks-validation tests grade against.
    const homeworkWithSubmission = await prisma.homework.create({
      data: {
        schoolId,
        academicYearId,
        teacherId,
        subjectId: mathSubjectId,
        classId: class5Id,
        sectionId: sectionA5Id,
        title: `${RUN_PREFIX} Graded Assignment`,
        instructions: "Solve all problems and show your work.",
        status: "PUBLISHED",
        assignedDate: new Date(),
        dueDate: new Date(Date.now() + 86400000 * 7),
        maxMarks: 10,
      },
    })
    homeworkWithSubmissionId = homeworkWithSubmission.id

    const submission = await prisma.homeworkSubmission.create({
      data: {
        schoolId,
        homeworkId: homeworkWithSubmissionId,
        studentId,
        status: "SUBMITTED",
        content: `${RUN_PREFIX} answer content`,
        submittedAt: new Date(),
      },
    })
    submissionId = submission.id

    // A second, unsubmitted homework for the "student submits their own
    // homework" happy-path test.
    const freshHomework = await prisma.homework.create({
      data: {
        schoolId,
        academicYearId,
        teacherId,
        subjectId: mathSubjectId,
        classId: class5Id,
        sectionId: sectionA5Id,
        title: `${RUN_PREFIX} Fresh Assignment`,
        instructions: "A homework with no submission yet.",
        status: "PUBLISHED",
        assignedDate: new Date(),
        dueDate: new Date(Date.now() + 86400000 * 7),
        maxMarks: 20,
      },
    })
    freshHomeworkId = freshHomework.id

    // A second teacher in the SAME school with no TeacherAssignment at all -
    // reuses the seeded teacher's password hash so it logs in with the same
    // known plaintext password without needing to run the signup flow.
    const otherTeacher = await prisma.user.create({
      data: {
        schoolId,
        name: `${RUN_PREFIX} Other Teacher`,
        email: `${RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()}-other-teacher@test.local`,
        passwordHash: teacher.passwordHash,
        role: "TEACHER",
      },
    })
    otherTeacherId = otherTeacher.id

    // A second school entirely, with its own teacher, for the cross-school
    // isolation tests. Only the teacher account is needed - the page under
    // test is scoped by schoolId before it ever looks at class/section.
    const otherSchool = await prisma.school.create({ data: { name: `${RUN_PREFIX} Other School` } })
    otherSchoolId = otherSchool.id
    const otherSchoolTeacher = await prisma.user.create({
      data: {
        schoolId: otherSchoolId,
        name: `${RUN_PREFIX} Cross School Teacher`,
        email: `${RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()}-cross-school-teacher@test.local`,
        passwordHash: teacher.passwordHash,
        role: "TEACHER",
      },
    })
    otherSchoolTeacherId = otherSchoolTeacher.id
  })

  test.afterAll(async () => {
    await prisma.homeworkSubmission.deleteMany({ where: { schoolId, homeworkId: { in: [homeworkWithSubmissionId, freshHomeworkId] } } })
    await prisma.homework.deleteMany({ where: { schoolId, id: { in: [homeworkWithSubmissionId, freshHomeworkId] } } })
    await prisma.user.deleteMany({ where: { id: { in: [otherTeacherId, otherSchoolTeacherId] } } })
    await prisma.school.delete({ where: { id: otherSchoolId } })
    await prisma.$disconnect()
  })

  test("teacher can view their own published homework and its submissions", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(`/homework/${homeworkWithSubmissionId}`)
    await expect(page.getByRole("heading", { name: `${RUN_PREFIX} Graded Assignment` })).toBeVisible()
    // The detail page shows the submissions roster (name/status), not the
    // raw submitted text - that only appears on the per-student review page.
    await expect(page.getByText("Nusrat Jahan")).toBeVisible()
    await expect(page.getByRole("table").getByText("Submitted", { exact: true })).toBeVisible()
    await logout(page)
  })

  test("a teacher with no assignment to this class/section/subject cannot view or grade the homework", async ({ page }) => {
    await login(page, `${RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()}-other-teacher@test.local`, ACCOUNTS.teacher.password)

    // Next's streamed SSR can flush a 200 status before a deeper notFound()
    // resolves, so the reliable signal is the rendered not-found content,
    // not the raw response status code.
    await page.goto(`/homework/${homeworkWithSubmissionId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Graded Assignment`)).toHaveCount(0)

    await page.goto(`/homework/${homeworkWithSubmissionId}/submissions/${studentId}`)
    await expect(page.getByText("Page not found")).toBeVisible()

    await logout(page)
  })

  test("a teacher from a different school cannot view this homework", async ({ page }) => {
    await login(page, `${RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()}-cross-school-teacher@test.local`, ACCOUNTS.teacher.password)

    await page.goto(`/homework/${homeworkWithSubmissionId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Graded Assignment`)).toHaveCount(0)

    await logout(page)
  })

  test("a student or guardian cannot open the admin homework management route", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto(`/homework/${homeworkWithSubmissionId}`)
    // The (dashboard) layout redirects STUDENT/GUARDIAN sessions to their
    // own portal before this page's own requireRole() ever runs - the page
    // itself is simply never reached, whichever portal home they land on.
    await expect(page).not.toHaveURL(new RegExp(`/homework/${homeworkWithSubmissionId}`))
    await expect(page.getByText(`${RUN_PREFIX} Graded Assignment`)).toHaveCount(0)
    await logout(page)
  })

  test("teacher rejects marks greater than the homework's maximum marks", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(`/homework/${homeworkWithSubmissionId}/submissions/${studentId}`)

    await page.locator('input[name="marks"]').fill("999")
    await page.getByRole("button", { name: "Save Feedback" }).click()

    await expect(page.getByText("Marks cannot exceed the maximum of 10.")).toBeVisible()

    const submission = await prisma.homeworkSubmission.findUniqueOrThrow({ where: { id: submissionId } })
    expect(submission.marks).toBeNull()
    expect(submission.status).toBe("SUBMITTED")

    await logout(page)
  })

  test("teacher rejects negative marks", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(`/homework/${homeworkWithSubmissionId}/submissions/${studentId}`)

    await page.locator('input[name="marks"]').fill("-5")
    await page.getByRole("button", { name: "Save Feedback" }).click()

    await expect(page.getByText("Marks must be a valid non-negative number.")).toBeVisible()

    const submission = await prisma.homeworkSubmission.findUniqueOrThrow({ where: { id: submissionId } })
    expect(submission.marks).toBeNull()

    await logout(page)
  })

  test("teacher can grade a submission within bounds, and marks/grade persist", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(`/homework/${homeworkWithSubmissionId}/submissions/${studentId}`)

    await page.locator('textarea[name="feedback"]').fill("Solid work overall.")
    await page.locator('input[name="marks"]').fill("8")
    await page.locator('input[name="grade"]').fill("A")
    await page.getByRole("button", { name: "Save Feedback" }).click()

    await expect(page.getByText("Feedback saved successfully.")).toBeVisible()

    const submission = await prisma.homeworkSubmission.findUniqueOrThrow({ where: { id: submissionId } })
    expect(submission.status).toBe("REVIEWED")
    expect(Number(submission.marks)).toBe(8)
    expect(submission.grade).toBe("A")
    expect(submission.reviewedById).toBe(teacherId)

    await logout(page)
  })

  test("student can submit their own homework", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto(`/portal/student/homework/${freshHomeworkId}`)

    await page.getByLabel("Your Answer").fill(`${RUN_PREFIX} student's own answer`)
    await page.getByRole("button", { name: "Submit", exact: true }).click()

    await expect(page.getByText("Homework submitted.")).toBeVisible()

    const submission = await prisma.homeworkSubmission.findUniqueOrThrow({
      where: { schoolId_homeworkId_studentId: { schoolId, homeworkId: freshHomeworkId, studentId } },
    })
    expect(submission.content).toBe(`${RUN_PREFIX} student's own answer`)

    await logout(page)
  })

  test("guardian sees the graded submission read-only, with no grading controls", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await page.goto(`/portal/guardian/children/${studentId}/homework/${homeworkWithSubmissionId}`)

    // Marks/grade from the earlier grading test are visible to the guardian...
    await expect(page.getByText(`${RUN_PREFIX} answer content`)).toBeVisible()
    await expect(page.getByText("Solid work overall.")).toBeVisible()

    // ...but no input the guardian could use to change them exists on the page.
    await expect(page.locator('input[name="marks"]')).toHaveCount(0)
    await expect(page.locator('textarea[name="feedback"]')).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Save Feedback" })).toHaveCount(0)

    await logout(page)
  })
})
