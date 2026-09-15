import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, Prisma } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// School A is the real seeded school every other spec uses. student@benwil.test
// is linked to STU-0501 (Class 5, Section A) and guardian@benwil.test to that
// same student - see prisma/seed.ts. School B exists only so a cross-tenant
// probe has something real to point at.
const RUN_PREFIX = `E2E NoticesSecurity ${Date.now()}`
const past = (msAgo: number) => new Date(Date.now() - msAgo)
const future = (msAhead: number) => new Date(Date.now() + msAhead)

let schoolAId: string
let categoryAId: string
let class5Id: string
let sectionA5Id: string
let class8Id: string
let class9Id: string
let adminAId: string

let noticeStudentsId: string
let noticeGuardiansId: string
let noticeClass8Id: string
let noticeDraftId: string

let schoolBId: string
let noticeBId: string

// A temporary second guardian, linked to two existing seeded students in
// different classes (STU-0501/Class 5 and STU-0801/Class 8), to verify the
// multi-child union rule without touching the shared guardian@benwil.test
// fixture other specs depend on having exactly one linked child.
let tempGuardianUserEmail: string
let tempGuardianId: string
let tempGuardianUserId: string
let tempLink1Id: string
let tempLink2Id: string

test.describe("Notice visibility and cross-tenant security", () => {
  test.beforeAll(async () => {
    const schoolA = await prisma.school.findFirstOrThrow()
    schoolAId = schoolA.id
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId: schoolAId, name: "Class 5" } })
    class5Id = class5.id
    const sectionA5 = await prisma.section.findFirstOrThrow({ where: { classId: class5Id, name: "A" } })
    sectionA5Id = sectionA5.id
    const class8 = await prisma.class.findFirstOrThrow({ where: { schoolId: schoolAId, name: "Class 8" } })
    class8Id = class8.id
    const class9 = await prisma.class.findFirstOrThrow({ where: { schoolId: schoolAId, name: "Class 9" } })
    class9Id = class9.id

    const admin = await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.admin.email } })
    adminAId = admin.id

    const category = await prisma.noticeCategory.create({ data: { schoolId: schoolAId, name: `${RUN_PREFIX} Category` } })
    categoryAId = category.id

    async function createNotice(overrides: Partial<Prisma.NoticeUncheckedCreateInput> & { title: string }) {
      return prisma.notice.create({
        data: {
          schoolId: schoolAId,
          categoryId: categoryAId,
          content: "Test notice body.",
          status: "PUBLISHED",
          audienceType: "ALL",
          publishAt: past(60 * 60 * 1000),
          createdById: adminAId,
          ...overrides,
        },
      })
    }

    await createNotice({ title: `${RUN_PREFIX} All Notice`, audienceType: "ALL" })
    noticeStudentsId = (await createNotice({ title: `${RUN_PREFIX} Students Notice`, audienceType: "STUDENTS" })).id
    noticeGuardiansId = (await createNotice({ title: `${RUN_PREFIX} Guardians Notice`, audienceType: "GUARDIANS" })).id
    await createNotice({ title: `${RUN_PREFIX} Class 5 Notice`, audienceType: "CLASS", classId: class5Id })
    await createNotice({
      title: `${RUN_PREFIX} Section 5A Notice`,
      audienceType: "SECTION",
      classId: class5Id,
      sectionId: sectionA5Id,
    })
    noticeClass8Id = (
      await createNotice({ title: `${RUN_PREFIX} Class 8 Notice`, audienceType: "CLASS", classId: class8Id })
    ).id
    await createNotice({ title: `${RUN_PREFIX} Class 9 Notice`, audienceType: "CLASS", classId: class9Id })
    noticeDraftId = (await createNotice({ title: `${RUN_PREFIX} Draft Notice`, status: "DRAFT" })).id
    await createNotice({ title: `${RUN_PREFIX} Future Notice`, publishAt: future(24 * 60 * 60 * 1000) })
    await createNotice({
      title: `${RUN_PREFIX} Expired Notice`,
      publishAt: past(48 * 60 * 60 * 1000),
      expiresAt: past(24 * 60 * 60 * 1000),
    })
    await createNotice({ title: `${RUN_PREFIX} Archived Notice`, status: "ARCHIVED" })

    // A second, fully independent school.
    const schoolB = await prisma.school.create({ data: { name: `${RUN_PREFIX} Other School` } })
    schoolBId = schoolB.id
    const categoryB = await prisma.noticeCategory.create({ data: { schoolId: schoolBId, name: `${RUN_PREFIX} Category B` } })
    const userB = await prisma.user.create({
      data: {
        schoolId: schoolBId,
        name: `${RUN_PREFIX} Other Admin`,
        email: `${RUN_PREFIX.toLowerCase().replace(/\s+/g, "-")}-admin@benwil.test`,
        passwordHash: admin.passwordHash,
        role: "SCHOOL_ADMIN",
      },
    })
    const noticeB = await prisma.notice.create({
      data: {
        schoolId: schoolBId,
        categoryId: categoryB.id,
        title: `${RUN_PREFIX} Other School Notice`,
        content: "Belongs to another school entirely.",
        status: "PUBLISHED",
        audienceType: "ALL",
        publishAt: past(60 * 60 * 1000),
        createdById: userB.id,
      },
    })
    noticeBId = noticeB.id

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

    await prisma.notice.deleteMany({ where: { schoolId: schoolBId } })
    await prisma.noticeCategory.deleteMany({ where: { schoolId: schoolBId } })
    await prisma.user.deleteMany({ where: { schoolId: schoolBId } })
    await prisma.section.deleteMany({ where: { class: { schoolId: schoolBId } } })
    await prisma.class.deleteMany({ where: { schoolId: schoolBId } })
    await prisma.school.delete({ where: { id: schoolBId } })

    await prisma.notice.deleteMany({ where: { schoolId: schoolAId, title: { startsWith: RUN_PREFIX } } })
    await prisma.noticeCategory.deleteMany({ where: { schoolId: schoolAId, name: { startsWith: RUN_PREFIX } } })
    await prisma.$disconnect()
  })

  test("admin can see draft/archived/future/expired notices in the management list; portal users cannot", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/notices")
    for (const title of [
      `${RUN_PREFIX} Draft Notice`,
      `${RUN_PREFIX} Archived Notice`,
      `${RUN_PREFIX} Future Notice`,
      `${RUN_PREFIX} Expired Notice`,
    ]) {
      await expect(page.getByText(title)).toBeVisible()
    }
  })

  test("student sees ALL/STUDENTS/own-class/own-section notices, not GUARDIANS or an unrelated class", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto("/portal/student/notices")

    await expect(page.getByText(`${RUN_PREFIX} All Notice`)).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Students Notice`)).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Class 5 Notice`)).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Section 5A Notice`)).toBeVisible()

    await expect(page.getByText(`${RUN_PREFIX} Guardians Notice`)).toHaveCount(0)
    await expect(page.getByText(`${RUN_PREFIX} Class 8 Notice`)).toHaveCount(0)
    await expect(page.getByText(`${RUN_PREFIX} Draft Notice`)).toHaveCount(0)
    await expect(page.getByText(`${RUN_PREFIX} Archived Notice`)).toHaveCount(0)
    await expect(page.getByText(`${RUN_PREFIX} Future Notice`)).toHaveCount(0)
    await expect(page.getByText(`${RUN_PREFIX} Expired Notice`)).toHaveCount(0)
    await expect(page.getByText(`${RUN_PREFIX} Other School Notice`)).toHaveCount(0)

    // Direct URL access to a hidden notice is rejected, not just filtered
    // out of the list.
    await page.goto(`/portal/student/notices/${noticeGuardiansId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
    await page.goto(`/portal/student/notices/${noticeDraftId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
    await page.goto(`/portal/student/notices/${noticeBId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })

  test("guardian sees ALL/GUARDIANS/linked child's class/section notices, not STUDENTS or an unrelated class", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await page.goto("/portal/guardian/notices")

    await expect(page.getByText(`${RUN_PREFIX} All Notice`)).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Guardians Notice`)).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Class 5 Notice`)).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Section 5A Notice`)).toBeVisible()

    await expect(page.getByText(`${RUN_PREFIX} Students Notice`)).toHaveCount(0)
    await expect(page.getByText(`${RUN_PREFIX} Class 8 Notice`)).toHaveCount(0)
    await expect(page.getByText(`${RUN_PREFIX} Draft Notice`)).toHaveCount(0)
    await expect(page.getByText(`${RUN_PREFIX} Archived Notice`)).toHaveCount(0)

    await page.goto(`/portal/guardian/notices/${noticeStudentsId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
    await page.goto(`/portal/guardian/notices/${noticeClass8Id}`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })

  test("a guardian with two children in different classes sees notices for both, not a third unrelated class", async ({
    page,
  }) => {
    await login(page, tempGuardianUserEmail, ACCOUNTS.admin.password)
    await page.goto("/portal/guardian/notices")

    await expect(page.getByText(`${RUN_PREFIX} Class 5 Notice`)).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Class 8 Notice`)).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Class 9 Notice`)).toHaveCount(0)
  })

  test("another school's notice is rejected as not found for admin, student, and guardian", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/notices/${noticeBId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
    await page.goto("/dashboard")
    await logout(page)

    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto(`/portal/student/notices/${noticeBId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
    // Navigate off the 404 page before logging out - it doesn't render the
    // full app shell, so the account menu the logout helper needs isn't
    // there (see fees-security.spec.ts for the same pattern).
    await page.goto("/portal/student")
    await logout(page)

    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await page.goto(`/portal/guardian/notices/${noticeBId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })
})
