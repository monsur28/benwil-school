import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E AcademicsSecurity ${Date.now()}`

let schoolAId: string
let class5Id: string

let otherSchoolId: string
let otherClassId: string
let otherYearId: string
let otherSubjectId: string

test.describe("Academic setup security and school isolation", () => {
  test.beforeAll(async () => {
    const schoolA = await prisma.school.findFirstOrThrow()
    schoolAId = schoolA.id
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId: schoolAId, name: "Class 5" } })
    class5Id = class5.id

    const otherSchool = await prisma.school.create({ data: { name: `${RUN_PREFIX} Other School` } })
    otherSchoolId = otherSchool.id
    const otherClass = await prisma.class.create({ data: { schoolId: otherSchoolId, name: `${RUN_PREFIX} Other Class`, order: 1 } })
    otherClassId = otherClass.id
    await prisma.section.create({ data: { classId: otherClassId, name: "A" } })
    const otherYear = await prisma.academicYear.create({ data: { schoolId: otherSchoolId, name: `${RUN_PREFIX} Other Year` } })
    otherYearId = otherYear.id
    const otherSubject = await prisma.subject.create({
      data: { schoolId: otherSchoolId, name: `${RUN_PREFIX} Other Subject`, code: `${RUN_PREFIX.slice(0, 8)}OS` },
    })
    otherSubjectId = otherSubject.id
  })

  test.afterAll(async () => {
    await prisma.section.deleteMany({ where: { classId: otherClassId } })
    await prisma.class.deleteMany({ where: { id: otherClassId } })
    await prisma.academicYear.deleteMany({ where: { id: otherYearId } })
    await prisma.subject.deleteMany({ where: { id: otherSubjectId } })
    await prisma.school.delete({ where: { id: otherSchoolId } })
    await prisma.$disconnect()
  })

  test("TEACHER cannot open academic setup routes", async ({ page }) => {
    const routes = ["/academics", "/academics/years", "/academics/classes", "/academics/subjects", "/academics/assignments"]
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    for (const route of routes) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/unauthorized/)
    }
    await logout(page)
  })

  test("STUDENT and GUARDIAN never reach academic setup routes at all", async ({ page }) => {
    // Redirected to their own portal by the (dashboard) layout itself,
    // before any page-level role check runs - see
    // src/app/(dashboard)/layout.tsx. One representative route is enough to
    // prove the layout-level gate fires; it applies identically to every
    // route under (dashboard), already proven generically here.
    for (const account of [ACCOUNTS.student, ACCOUNTS.guardian]) {
      await login(page, account.email, account.password)
      await page.goto("/academics/classes")
      await expect(page).not.toHaveURL(/\/academics\/classes$/)
      await logout(page)
    }
  })

  test("a class from a different school cannot be opened by id", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/academics/classes/${otherClassId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
    await expect(page.getByText(`${RUN_PREFIX} Other Class`)).toHaveCount(0)
    await logout(page)
  })

  test("academic years, classes, and subjects lists never leak another school's records", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)

    await page.goto("/academics/years")
    await expect(page.getByText(`${RUN_PREFIX} Other Year`)).toHaveCount(0)

    await page.goto("/academics/classes")
    await expect(page.getByText(`${RUN_PREFIX} Other Class`)).toHaveCount(0)

    await page.goto("/academics/subjects")
    await expect(page.getByText(`${RUN_PREFIX} Other Subject`)).toHaveCount(0)

    await logout(page)
  })

  test("assigning a subject to a class never offers a subject from a different school", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/academics/classes/${class5Id}`)
    await expect(page.locator(`select[name="subjectId"] option[value="${otherSubjectId}"]`)).toHaveCount(0)
    await logout(page)
  })
})
