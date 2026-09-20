import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, DayOfWeek, Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { login, logout } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E StudentDashboard ${Date.now()}`
const PASSWORD = "DashTest1234!"

const JS_DAY_TO_DAY_OF_WEEK: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
}

let schoolId: string
let academicYearId: string
let class5Id: string
let section5AId: string
let class6Id: string
let section6AId: string
let mathSubjectId: string
let teacherId: string

let studentAId: string
let studentBId: string
let userAId: string
let userBId: string
const accountA = { email: `${RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()}-a@benwil.test`, password: PASSWORD }
const accountB = { email: `${RUN_PREFIX.replace(/\s+/g, "-").toLowerCase()}-b@benwil.test`, password: PASSWORD }

let routineEntryId: string | null = null
let homeworkVisibleId: string
let homeworkDraftId: string
let homeworkOtherClassId: string
let examTypeId: string
let examId: string
let examScheduleId: string
let examMarkId: string
let feeCategoryId: string
let studentFeeId: string
let paymentId: string
let noticeCategoryId: string
let noticeVisibleId: string
let noticeDraftId: string
let noticeExpiredId: string
let noticeOtherClassId: string
let attendanceIds: string[] = []

test.describe("Student Dashboard - real data wiring", () => {
  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    schoolId = school.id
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId, name: "2026" } })
    academicYearId = academicYear.id
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId, name: "Class 5" } })
    class5Id = class5.id
    const section5A = await prisma.section.findFirstOrThrow({ where: { classId: class5Id, name: "A" } })
    section5AId = section5A.id
    const class6 = await prisma.class.findFirstOrThrow({ where: { schoolId, name: "Class 6" } })
    class6Id = class6.id
    const section6A = await prisma.section.findFirstOrThrow({ where: { classId: class6Id, name: "A" } })
    section6AId = section6A.id
    const math = await prisma.subject.findFirstOrThrow({ where: { schoolId, code: "MATH" } })
    mathSubjectId = math.id
    const teacher = await prisma.user.findFirstOrThrow({ where: { schoolId, email: "teacher@benwil.test" } })
    teacherId = teacher.id

    const passwordHash = await bcrypt.hash(PASSWORD, 12)

    const userA = await prisma.user.create({
      data: { name: `${RUN_PREFIX} Student A`, email: accountA.email, role: Role.STUDENT, schoolId, passwordHash },
    })
    userAId = userA.id
    const studentA = await prisma.student.create({
      data: {
        schoolId,
        studentUid: `${RUN_PREFIX}-STU-A`,
        admissionNumber: `${RUN_PREFIX}-ADM-A`,
        name: `${RUN_PREFIX} Student A`,
        dateOfBirth: new Date("2014-01-01"),
        gender: "MALE",
        academicYearId,
        classId: class5Id,
        sectionId: section5AId,
        roll: 971,
        userId: userAId,
      },
    })
    studentAId = studentA.id

    const userB = await prisma.user.create({
      data: { name: `${RUN_PREFIX} Student B`, email: accountB.email, role: Role.STUDENT, schoolId, passwordHash },
    })
    userBId = userB.id
    const studentB = await prisma.student.create({
      data: {
        schoolId,
        studentUid: `${RUN_PREFIX}-STU-B`,
        admissionNumber: `${RUN_PREFIX}-ADM-B`,
        name: `${RUN_PREFIX} Student B`,
        dateOfBirth: new Date("2014-01-01"),
        gender: "FEMALE",
        academicYearId,
        classId: class5Id,
        sectionId: section5AId,
        roll: 972,
        userId: userBId,
      },
    })
    studentBId = studentB.id

    // Routine: a real entry for today, on a period no other routine spec
    // touches for this class/section (routine.spec.ts uses P1, routine-
    // security.spec.ts uses P2, routine-portal.spec.ts uses P9 - these run
    // concurrently in other workers against the same shared Class 5 A).
    const todayEnum = JS_DAY_TO_DAY_OF_WEEK[new Date().getDay()]
    await prisma.routineEntry.deleteMany({
      where: { schoolId, academicYearId, classId: class5Id, sectionId: section5AId, dayOfWeek: todayEnum, periodNumber: 11 },
    })
    const routineEntry = await prisma.routineEntry.create({
      data: {
        schoolId,
        academicYearId,
        classId: class5Id,
        sectionId: section5AId,
        subjectId: mathSubjectId,
        teacherId,
        dayOfWeek: todayEnum,
        periodNumber: 11,
        startTime: "13:00",
        endTime: "13:45",
        room: `${RUN_PREFIX} Room`,
      },
    })
    routineEntryId = routineEntry.id

    // Homework: one published+visible, one draft (must be hidden), one
    // published for an unrelated class (must be hidden - class isolation).
    const visibleHomework = await prisma.homework.create({
      data: {
        schoolId,
        academicYearId,
        teacherId,
        subjectId: mathSubjectId,
        classId: class5Id,
        sectionId: section5AId,
        title: `${RUN_PREFIX} Visible Homework`,
        instructions: "Solve the attached worksheet.",
        // Dashboard's homework widget orders by dueDate ascending and shows
        // only the first 4 - an earliest-possible due date guarantees this
        // fixture always sorts first regardless of how many other Class 5 A
        // homework rows already exist from other (possibly uncleaned) specs.
        assignedDate: new Date("2000-01-01"),
        dueDate: new Date("2000-01-02"),
        status: "PUBLISHED",
      },
    })
    homeworkVisibleId = visibleHomework.id

    const draftHomework = await prisma.homework.create({
      data: {
        schoolId,
        academicYearId,
        teacherId,
        subjectId: mathSubjectId,
        classId: class5Id,
        sectionId: section5AId,
        title: `${RUN_PREFIX} Draft Homework`,
        instructions: "Not yet published.",
        assignedDate: new Date(),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: "DRAFT",
      },
    })
    homeworkDraftId = draftHomework.id

    const otherClassHomework = await prisma.homework.create({
      data: {
        schoolId,
        academicYearId,
        teacherId,
        subjectId: mathSubjectId,
        classId: class6Id,
        sectionId: section6AId,
        title: `${RUN_PREFIX} Other Class Homework`,
        instructions: "For Class 6 only.",
        assignedDate: new Date(),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: "PUBLISHED",
      },
    })
    homeworkOtherClassId = otherClassHomework.id

    // Results: an exam scheduled for Class 5, starting DRAFT. Only Student A
    // gets an ExamMark - Student B has none, proving marks never leak
    // across students who share the same class/exam.
    const examType = await prisma.examType.create({ data: { schoolId, name: `${RUN_PREFIX} Type` } })
    examTypeId = examType.id
    const exam = await prisma.exam.create({
      data: {
        schoolId,
        academicYearId,
        examTypeId,
        name: `${RUN_PREFIX} Exam`,
        startDate: new Date("2026-11-01"),
        endDate: new Date("2026-11-05"),
      },
    })
    examId = exam.id
    const schedule = await prisma.examSchedule.create({
      data: { schoolId, examId, classId: class5Id, subjectId: mathSubjectId, examDate: new Date("2026-11-02"), fullMarks: 100, passMarks: 33 },
    })
    examScheduleId = schedule.id
    const mark = await prisma.examMark.create({
      // 82, not 75 - the hero card has an unrelated decorative "You're 75%
      // through this term" string, and 75% would collide with it.
      data: { schoolId, examScheduleId, studentId: studentAId, marks: 82, isAbsent: false, enteredById: teacherId },
    })
    examMarkId = mark.id

    // Fees: Student A owes 1000, has paid 400 of it. Student B has no fee
    // records at all.
    const feeCategory = await prisma.feeCategory.create({ data: { schoolId, name: `${RUN_PREFIX} Category` } })
    feeCategoryId = feeCategory.id
    const studentFee = await prisma.studentFee.create({
      data: {
        schoolId,
        studentId: studentAId,
        academicYearId,
        feeCategoryId,
        name: `${RUN_PREFIX} Fee`,
        amount: 1000,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        assignedById: teacherId,
      },
    })
    studentFeeId = studentFee.id
    const payment = await prisma.payment.create({
      data: {
        schoolId,
        studentId: studentAId,
        receiptNumber: `${RUN_PREFIX}-RCPT-1`,
        amount: 400,
        method: "CASH",
        receivedById: teacherId,
      },
    })
    paymentId = payment.id
    await prisma.paymentAllocation.create({
      data: { schoolId, paymentId, studentFeeId, amount: 400 },
    })

    // Notices: one visible (published, targeted at Class 5), one draft, one
    // expired, and one targeted at an unrelated class - only the first must
    // ever appear on Student A/B's dashboard.
    const noticeCategory = await prisma.noticeCategory.create({ data: { schoolId, name: `${RUN_PREFIX} Category` } })
    noticeCategoryId = noticeCategory.id
    const now = new Date()
    const visibleNotice = await prisma.notice.create({
      data: {
        schoolId,
        categoryId: noticeCategoryId,
        title: `${RUN_PREFIX} Visible Notice`,
        content: "Visible to Class 5.",
        status: "PUBLISHED",
        audienceType: "CLASS",
        classId: class5Id,
        // Dashboard's notices widget orders by publishAt descending and
        // shows only the first 4 - as close to "now" as possible (while
        // still satisfying publishAt <= now by the time the page queries)
        // keeps this fixture ranked above older leftover notices from other
        // specs sharing this school.
        publishAt: now,
        createdById: teacherId,
      },
    })
    noticeVisibleId = visibleNotice.id
    const draftNotice = await prisma.notice.create({
      data: {
        schoolId,
        categoryId: noticeCategoryId,
        title: `${RUN_PREFIX} Draft Notice`,
        content: "Never published.",
        status: "DRAFT",
        audienceType: "CLASS",
        classId: class5Id,
        publishAt: new Date(now.getTime() - 60 * 60 * 1000),
        createdById: teacherId,
      },
    })
    noticeDraftId = draftNotice.id
    const expiredNotice = await prisma.notice.create({
      data: {
        schoolId,
        categoryId: noticeCategoryId,
        title: `${RUN_PREFIX} Expired Notice`,
        content: "Already expired.",
        status: "PUBLISHED",
        audienceType: "CLASS",
        classId: class5Id,
        publishAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        createdById: teacherId,
      },
    })
    noticeExpiredId = expiredNotice.id
    const otherClassNotice = await prisma.notice.create({
      data: {
        schoolId,
        categoryId: noticeCategoryId,
        title: `${RUN_PREFIX} Other Class Notice`,
        content: "For Class 6 only.",
        status: "PUBLISHED",
        audienceType: "CLASS",
        classId: class6Id,
        publishAt: new Date(now.getTime() - 60 * 60 * 1000),
        createdById: teacherId,
      },
    })
    noticeOtherClassId = otherClassNotice.id

    // Attendance: Student A gets 3 PRESENT, 1 ABSENT, 1 LATE (real percentage
    // = round(3/5*100) = 60%, per getStudentAttendanceSummary's own
    // definition - deliberately not 82/75/92 to avoid colliding with other
    // decorative/fixture strings already on this dashboard). Student B gets
    // none, to prove the empty state doesn't fall back to fabricated numbers.
    const attendanceRows = await prisma.$transaction(
      [
        { date: new Date("2026-01-05"), status: "PRESENT" as const },
        { date: new Date("2026-01-06"), status: "PRESENT" as const },
        { date: new Date("2026-01-07"), status: "PRESENT" as const },
        { date: new Date("2026-01-08"), status: "ABSENT" as const },
        { date: new Date("2026-01-09"), status: "LATE" as const },
      ].map(({ date, status }) =>
        prisma.attendance.create({
          data: {
            schoolId,
            studentId: studentAId,
            classId: class5Id,
            sectionId: section5AId,
            academicYearId,
            date,
            status,
            markedById: teacherId,
          },
        })
      )
    )
    attendanceIds = attendanceRows.map((row) => row.id)
  })

  test.afterAll(async () => {
    await prisma.attendance.deleteMany({ where: { id: { in: attendanceIds } } })

    await prisma.notice.deleteMany({ where: { id: { in: [noticeVisibleId, noticeDraftId, noticeExpiredId, noticeOtherClassId] } } })
    await prisma.noticeCategory.deleteMany({ where: { id: noticeCategoryId } })

    await prisma.paymentAllocation.deleteMany({ where: { paymentId } })
    await prisma.payment.deleteMany({ where: { id: paymentId } })
    await prisma.studentFee.deleteMany({ where: { id: studentFeeId } })
    await prisma.feeCategory.deleteMany({ where: { id: feeCategoryId } })

    await prisma.examMark.deleteMany({ where: { id: examMarkId } })
    await prisma.examSchedule.deleteMany({ where: { id: examScheduleId } })
    await prisma.exam.deleteMany({ where: { id: examId } })
    await prisma.examType.deleteMany({ where: { id: examTypeId } })

    await prisma.homework.deleteMany({ where: { id: { in: [homeworkVisibleId, homeworkDraftId, homeworkOtherClassId] } } })

    if (routineEntryId) {
      await prisma.routineEntry.deleteMany({ where: { id: routineEntryId } })
    }

    await prisma.student.deleteMany({ where: { id: { in: [studentAId, studentBId] } } })
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } })
    await prisma.$disconnect()
  })

  test("dashboard identity comes from the real student record", async ({ page }) => {
    await login(page, accountA.email, accountA.password)
    await expect(page).toHaveURL(/\/portal\/student$/)
    // Roll 971/972 are unique to these two fixtures - unambiguous proof the
    // header pulls from this exact student's own record, not another's.
    await expect(page.getByText("Class 5").first()).toBeVisible()
    await expect(page.getByText("Roll 971")).toBeVisible()
    await expect(page.getByText("2026").first()).toBeVisible()
    await logout(page)
  })

  test("today's schedule shows the real routine entry", async ({ page }) => {
    await login(page, accountA.email, accountA.password)
    await expect(page.getByText(`${RUN_PREFIX} Room`)).toBeVisible()
    await expect(page.getByText("13:00")).toBeVisible()
    await logout(page)
  })

  test("published homework for the student's class/section appears; draft and other-class homework do not", async ({ page }) => {
    await login(page, accountA.email, accountA.password)
    await expect(page.getByText(`${RUN_PREFIX} Visible Homework`)).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Draft Homework`)).toHaveCount(0)
    await expect(page.getByText(`${RUN_PREFIX} Other Class Homework`)).toHaveCount(0)
    await logout(page)
  })

  test("a draft exam is hidden; finalizing it reveals the result, and marks never leak to another student", async ({ page }) => {
    // While DRAFT: no result shown for either student.
    await login(page, accountA.email, accountA.password)
    await expect(page.getByText(`${RUN_PREFIX} Exam`)).toHaveCount(0)
    await expect(page.getByText("Results will appear here once published.")).toBeVisible()
    await logout(page)

    await prisma.exam.update({ where: { id: examId }, data: { resultStatus: "FINALIZED" } })

    // Student A: real percentage now visible.
    await login(page, accountA.email, accountA.password)
    await expect(page.getByText(`${RUN_PREFIX} Exam`)).toBeVisible()
    await expect(page.getByText("82%")).toBeVisible()
    await logout(page)

    // Student B: the exam is listed (class-wide schedule) but Student A's
    // specific percentage must never appear on Student B's dashboard.
    await login(page, accountB.email, accountB.password)
    await expect(page.getByText("82%")).toHaveCount(0)
    await logout(page)

    await prisma.exam.update({ where: { id: examId }, data: { resultStatus: "DRAFT" } })
  })

  test("fee balance reflects the student's own real charges/payments and never another student's", async ({ page }) => {
    await login(page, accountA.email, accountA.password)
    await expect(page.getByText("৳ 600")).toBeVisible()
    await expect(page.getByText(/৳ 400/)).toBeVisible()
    await logout(page)

    await login(page, accountB.email, accountB.password)
    await expect(page.getByText("৳ 600")).toHaveCount(0)
    await expect(page.getByText(/৳ 400/)).toHaveCount(0)
    await expect(page.getByText("All Fees Cleared")).toBeVisible()
    await logout(page)
  })

  test("published class-targeted notice appears; draft, expired, and other-class notices do not", async ({ page }) => {
    await login(page, accountA.email, accountA.password)
    await expect(page.getByText(`${RUN_PREFIX} Visible Notice`)).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Draft Notice`)).toHaveCount(0)
    await expect(page.getByText(`${RUN_PREFIX} Expired Notice`)).toHaveCount(0)
    await expect(page.getByText(`${RUN_PREFIX} Other Class Notice`)).toHaveCount(0)
    await logout(page)
  })

  test("attendance widget shows the student's real percentage and counts, not the old fabricated demo values", async ({ page }) => {
    await login(page, accountA.email, accountA.password)
    await expect(page.getByText("60%").first()).toBeVisible()
    // Old hardcoded demo values must never appear.
    await expect(page.getByText("92%")).toHaveCount(0)
    await expect(page.getByText("22 days")).toHaveCount(0)
    await logout(page)
  })

  test("student with no attendance records sees the real empty state, not a fabricated percentage", async ({ page }) => {
    await login(page, accountB.email, accountB.password)
    await expect(page.getByText("No attendance records yet.")).toBeVisible()
    await expect(page.getByText("92%")).toHaveCount(0)
    await expect(page.getByText("60%")).toHaveCount(0)
    await logout(page)
  })

  test("Student A and Student B see different dashboards despite sharing a class/section", async ({ page }) => {
    await login(page, accountA.email, accountA.password)
    await expect(page.getByText("Roll 971")).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Visible Homework`)).toBeVisible()
    await logout(page)

    await login(page, accountB.email, accountB.password)
    await expect(page.getByText("Roll 972")).toBeVisible()
    // Same class/section, so the same published homework is legitimately
    // shared - the isolation that matters is per-student data (results/fees,
    // checked in dedicated tests above), not class-wide content like this.
    await expect(page.getByText(`${RUN_PREFIX} Visible Homework`)).toBeVisible()
    await logout(page)
  })
})
