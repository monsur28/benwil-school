import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, Prisma } from "@prisma/client"
import { login, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// School A is the real seeded school every other spec uses. student@benwil.test
// is linked to STU-0501 (Class 5, Section A) and guardian@benwil.test to that
// same student - see prisma/seed.ts. School B exists only so a cross-tenant
// probe has something real to point at.
const RUN_PREFIX = `E2E HomeworkSecurity ${Date.now()}`

let schoolAId: string
let academicYearId: string
let class5Id: string
let sectionA5Id: string
let class8Id: string
let mathSubjectId: string
let adminAId: string
let categoryAId: string

let publishedHomeworkId: string
let draftHomeworkId: string
let unrelatedClassHomeworkId: string

let schoolBId: string
let otherSchoolHomeworkId: string

// A temporary second guardian, linked to two existing seeded students in
// different classes (STU-0501/Class 5 and STU-0801/Class 8), to verify
// child-switching shows each child's own homework only - without touching
// the shared guardian@benwil.test fixture other specs depend on having
// exactly one linked child.
let tempGuardianUserEmail: string
let tempGuardianId: string
let tempGuardianUserId: string
let tempLink1Id: string
let tempLink2Id: string

test.describe("Homework visibility and cross-tenant security", () => {
  test.beforeAll(async () => {
    const schoolA = await prisma.school.findFirstOrThrow()
    schoolAId = schoolA.id
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId: schoolAId, name: "2026" } })
    academicYearId = academicYear.id
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId: schoolAId, name: "Class 5" } })
    class5Id = class5.id
    const sectionA5 = await prisma.section.findFirstOrThrow({ where: { classId: class5Id, name: "A" } })
    sectionA5Id = sectionA5.id
    const class8 = await prisma.class.findFirstOrThrow({ where: { schoolId: schoolAId, name: "Class 8" } })
    class8Id = class8.id
    const sectionA8 = await prisma.section.findFirstOrThrow({ where: { classId: class8Id, name: "A" } })
    const mathSubject = await prisma.subject.findFirstOrThrow({ where: { schoolId: schoolAId, code: "MATH" } })
    mathSubjectId = mathSubject.id
    const admin = await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.admin.email } })
    adminAId = admin.id
    const category = await prisma.homeworkCategory.create({ data: { schoolId: schoolAId, name: `${RUN_PREFIX} Category` } })
    categoryAId = category.id

    async function createHomework(overrides: Partial<Prisma.HomeworkUncheckedCreateInput> & { title: string }) {
      return prisma.homework.create({
        data: {
          schoolId: schoolAId,
          academicYearId,
          teacherId: adminAId,
          subjectId: mathSubjectId,
          classId: class5Id,
          sectionId: sectionA5Id,
          categoryId: categoryAId,
          instructions: "Test homework body.",
          status: "PUBLISHED",
          assignedDate: new Date("2026-09-15"),
          dueDate: new Date("2026-09-20"),
          ...overrides,
        },
      })
    }

    publishedHomeworkId = (await createHomework({ title: `${RUN_PREFIX} Published` })).id
    draftHomeworkId = (await createHomework({ title: `${RUN_PREFIX} Draft`, status: "DRAFT" })).id
    unrelatedClassHomeworkId = (
      await createHomework({ title: `${RUN_PREFIX} Class 8 Only`, classId: class8Id, sectionId: sectionA8.id })
    ).id

    // A second, fully independent school.
    const schoolB = await prisma.school.create({ data: { name: `${RUN_PREFIX} Other School` } })
    schoolBId = schoolB.id
    const academicYearB = await prisma.academicYear.create({ data: { schoolId: schoolBId, name: "2026" } })
    const classB = await prisma.class.create({ data: { schoolId: schoolBId, name: "Class 5", order: 5 } })
    const sectionB = await prisma.section.create({ data: { classId: classB.id, name: "A" } })
    const subjectB = await prisma.subject.create({ data: { schoolId: schoolBId, name: "Mathematics", code: "MATH" } })
    const userB = await prisma.user.create({
      data: {
        schoolId: schoolBId,
        name: `${RUN_PREFIX} Other Admin`,
        email: `${RUN_PREFIX.toLowerCase().replace(/\s+/g, "-")}-admin@benwil.test`,
        passwordHash: admin.passwordHash,
        role: "SCHOOL_ADMIN",
      },
    })
    const categoryB = await prisma.homeworkCategory.create({ data: { schoolId: schoolBId, name: `${RUN_PREFIX} Category B` } })
    const homeworkB = await prisma.homework.create({
      data: {
        schoolId: schoolBId,
        academicYearId: academicYearB.id,
        teacherId: userB.id,
        subjectId: subjectB.id,
        classId: classB.id,
        sectionId: sectionB.id,
        categoryId: categoryB.id,
        title: `${RUN_PREFIX} Other School Homework`,
        instructions: "Belongs to another school entirely.",
        status: "PUBLISHED",
        assignedDate: new Date("2026-09-15"),
        dueDate: new Date("2026-09-20"),
      },
    })
    otherSchoolHomeworkId = homeworkB.id

    // Temporary second guardian with two children in different classes.
    tempGuardianUserEmail = `${RUN_PREFIX.toLowerCase().replace(/\s+/g, "-")}-guardian@benwil.test`
    const tempGuardianUser = await prisma.user.create({
      data: {
        schoolId: schoolAId,
        name: `${RUN_PREFIX} Temp Guardian`,
        email: tempGuardianUserEmail,
        passwordHash: admin.passwordHash,
        role: "GUARDIAN",
      },
    })
    tempGuardianUserId = tempGuardianUser.id
    const tempGuardian = await prisma.guardian.create({
      data: {
        schoolId: schoolAId,
        name: `${RUN_PREFIX} Temp Guardian`,
        phone: `${RUN_PREFIX}-PHONE`,
        userId: tempGuardianUser.id,
      },
    })
    tempGuardianId = tempGuardian.id
    const studentClass5 = await prisma.student.findUniqueOrThrow({ where: { studentUid: "STU-0501" } })
    const studentClass8 = await prisma.student.findUniqueOrThrow({ where: { studentUid: "STU-0801" } })
    tempLink1Id = (
      await prisma.studentGuardian.create({
        data: { studentId: studentClass5.id, guardianId: tempGuardian.id, relation: "GUARDIAN" },
      })
    ).id
    tempLink2Id = (
      await prisma.studentGuardian.create({
        data: { studentId: studentClass8.id, guardianId: tempGuardian.id, relation: "GUARDIAN" },
      })
    ).id
  })

  test.afterAll(async () => {
    await prisma.studentGuardian.deleteMany({ where: { id: { in: [tempLink1Id, tempLink2Id] } } })
    await prisma.guardian.delete({ where: { id: tempGuardianId } })
    await prisma.user.delete({ where: { id: tempGuardianUserId } })

    await prisma.homework.deleteMany({ where: { schoolId: schoolBId } })
    await prisma.homeworkCategory.deleteMany({ where: { schoolId: schoolBId } })
    await prisma.user.deleteMany({ where: { schoolId: schoolBId } })
    await prisma.section.deleteMany({ where: { class: { schoolId: schoolBId } } })
    await prisma.class.deleteMany({ where: { schoolId: schoolBId } })
    await prisma.subject.deleteMany({ where: { schoolId: schoolBId } })
    await prisma.academicYear.deleteMany({ where: { schoolId: schoolBId } })
    await prisma.school.delete({ where: { id: schoolBId } })

    await prisma.homework.deleteMany({ where: { schoolId: schoolAId, title: { startsWith: RUN_PREFIX } } })
    await prisma.homeworkCategory.deleteMany({ where: { schoolId: schoolAId, name: { startsWith: RUN_PREFIX } } })
    await prisma.$disconnect()
  })

  test("student sees published homework for their own class/section, not draft or another class", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto("/portal/student/homework")

    await expect(page.getByText(`${RUN_PREFIX} Published`)).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Draft`)).toHaveCount(0)
    await expect(page.getByText(`${RUN_PREFIX} Class 8 Only`)).toHaveCount(0)

    await page.getByText(`${RUN_PREFIX} Published`).click()
    await expect(page).toHaveURL(new RegExp(`/portal/student/homework/${publishedHomeworkId}$`))
    await expect(page.getByText("Test homework body.")).toBeVisible()
  })

  test("student cannot access draft, another class's, or another school's homework by URL", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)

    await page.goto(`/portal/student/homework/${draftHomeworkId}`)
    await expect(page.getByText("Page not found")).toBeVisible()

    await page.goto(`/portal/student/homework/${unrelatedClassHomeworkId}`)
    await expect(page.getByText("Page not found")).toBeVisible()

    await page.goto(`/portal/student/homework/${otherSchoolHomeworkId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })

  test("guardian sees published homework for the linked child, not draft or another class", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await page.waitForURL(/\/portal\/guardian\/children\/[^/]+$/)
    const linkedStudentPath = page.url().match(/(\/portal\/guardian\/children\/[^/]+)/)![1]

    await page.goto(`${linkedStudentPath}/homework`)
    await expect(page.getByText(`${RUN_PREFIX} Published`)).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Draft`)).toHaveCount(0)
    await expect(page.getByText(`${RUN_PREFIX} Class 8 Only`)).toHaveCount(0)

    await page.getByText(`${RUN_PREFIX} Published`).click()
    await expect(page).toHaveURL(new RegExp(`${linkedStudentPath.replace(/\//g, "\\/")}/homework/${publishedHomeworkId}$`))
  })

  test("guardian cannot access an unlinked student's homework, a draft, or another school's homework", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await page.waitForURL(/\/portal\/guardian\/children\/[^/]+$/)
    const linkedStudentPath = page.url().match(/(\/portal\/guardian\/children\/[^/]+)/)![1]

    // draft, even for the correctly-linked child
    await page.goto(`${linkedStudentPath}/homework/${draftHomeworkId}`)
    await expect(page.getByText("Page not found")).toBeVisible()

    // another school's homework
    await page.goto(`${linkedStudentPath}/homework/${otherSchoolHomeworkId}`)
    await expect(page.getByText("Page not found")).toBeVisible()

    // an unlinked student id entirely (studentId in the URL itself is fake/unrelated)
    await page.goto(`/portal/guardian/children/${crypto.randomUUID()}/homework`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })

  test("a guardian with two children in different classes sees each child's own homework via the switcher", async ({
    page,
  }) => {
    await login(page, tempGuardianUserEmail, ACCOUNTS.admin.password)
    // Two children -> lands on the picker, not an auto-redirect.
    await expect(page).toHaveURL(/\/portal\/guardian$/)
    await expect(page.getByText("Nusrat Jahan")).toBeVisible()
    await expect(page.getByText("Mizanur Rahman")).toBeVisible()

    await page.getByText("Nusrat Jahan").click()
    await page.waitForURL(/\/portal\/guardian\/children\/[^/]+$/)
    const class5ChildPath = page.url().match(/(\/portal\/guardian\/children\/[^/]+)/)![1]
    await page.goto(`${class5ChildPath}/homework`)
    await expect(page.getByText(`${RUN_PREFIX} Published`)).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Class 8 Only`)).toHaveCount(0)

    // Switch to the Class 8 child via the ChildSwitcher <select> and confirm
    // the reverse: only that child's own homework, never the Class 5 sibling's.
    // waitForURL must wait for the path to actually CHANGE, not just match
    // the pattern - the pre-switch URL already matches /children/[^/]+$ too,
    // so a plain pattern wait resolves instantly against the stale URL.
    await page.goto(class5ChildPath)
    await page.locator("#portal-child-switcher").selectOption({ label: "Mizanur Rahman — Class 8 A" })
    await page.waitForURL((url) => url.pathname.startsWith("/portal/guardian/children/") && url.pathname !== class5ChildPath)
    const class8ChildPath = page.url().match(/(\/portal\/guardian\/children\/[^/]+)/)![1]
    expect(class8ChildPath).not.toBe(class5ChildPath)
    await page.goto(`${class8ChildPath}/homework`)
    await expect(page.getByText(`${RUN_PREFIX} Class 8 Only`)).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Published`)).toHaveCount(0)
  })

  test("admin sees draft and cross-class homework in management, but another school's homework is rejected", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/homework")
    await expect(page.getByText(`${RUN_PREFIX} Draft`)).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Class 8 Only`)).toBeVisible()

    await page.goto(`/homework/${otherSchoolHomeworkId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })
})
