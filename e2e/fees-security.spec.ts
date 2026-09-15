import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E FeesSecurity ${Date.now()}`

// School A is the real seeded school every other spec uses (and where
// student@benwil.test / guardian@benwil.test are linked - see prisma/seed.ts).
// School B exists only so a cross-tenant probe has something real to point
// at.
let schoolAId: string
let ownStudentId: string
let ownStudentFeeId: string
let ownPaymentId: string

let otherSchoolId: string
let otherStudentId: string
let otherStudentFeeId: string
let otherPaymentId: string

// A same-school student NOT linked to guardian@benwil.test, for the
// "unrelated child" check.
let unrelatedStudentId: string

test.describe("Cross-tenant and cross-role fee security", () => {
  test.beforeAll(async () => {
    const schoolA = await prisma.school.findFirstOrThrow()
    schoolAId = schoolA.id
    const academicYearA = await prisma.academicYear.findFirstOrThrow({ where: { schoolId: schoolAId, name: "2026" } })
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId: schoolAId, name: "Class 5" } })
    const sectionA = await prisma.section.findFirstOrThrow({ where: { classId: class5.id, name: "A" } })
    const accountant = await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.accountant.email } })

    const ownStudent = await prisma.student.create({
      data: {
        schoolId: schoolAId,
        studentUid: `${RUN_PREFIX}-STU-OWN`,
        admissionNumber: `${RUN_PREFIX}-ADM-OWN`,
        name: `${RUN_PREFIX} Own Student`,
        dateOfBirth: new Date("2014-01-01"),
        gender: "MALE",
        academicYearId: academicYearA.id,
        classId: class5.id,
        sectionId: sectionA.id,
        roll: 998,
      },
    })
    ownStudentId = ownStudent.id

    unrelatedStudentId = (
      await prisma.student.create({
        data: {
          schoolId: schoolAId,
          studentUid: `${RUN_PREFIX}-STU-UNRELATED`,
          admissionNumber: `${RUN_PREFIX}-ADM-UNRELATED`,
          name: `${RUN_PREFIX} Unrelated Student`,
          dateOfBirth: new Date("2014-01-01"),
          gender: "FEMALE",
          academicYearId: academicYearA.id,
          classId: class5.id,
          sectionId: sectionA.id,
          roll: 997,
        },
      })
    ).id

    const category = await prisma.feeCategory.create({ data: { schoolId: schoolAId, name: `${RUN_PREFIX} Category` } })
    const ownFee = await prisma.studentFee.create({
      data: {
        schoolId: schoolAId,
        studentId: ownStudentId,
        academicYearId: academicYearA.id,
        feeCategoryId: category.id,
        name: `${RUN_PREFIX} Fee`,
        amount: "500.00",
        assignedById: accountant.id,
      },
    })
    ownStudentFeeId = ownFee.id
    const ownPayment = await prisma.payment.create({
      data: {
        schoolId: schoolAId,
        studentId: ownStudentId,
        receiptNumber: `${RUN_PREFIX}-RCPT-OWN`,
        amount: "200.00",
        method: "CASH",
        receivedById: accountant.id,
        allocations: { create: [{ schoolId: schoolAId, studentFeeId: ownFee.id, amount: "200.00" }] },
      },
    })
    ownPaymentId = ownPayment.id
    await prisma.studentFee.update({ where: { id: ownFee.id }, data: { status: "PARTIAL" } })

    // A second, fully independent school.
    const schoolB = await prisma.school.create({ data: { name: `${RUN_PREFIX} Other School` } })
    otherSchoolId = schoolB.id
    const academicYearB = await prisma.academicYear.create({ data: { schoolId: schoolB.id, name: "2026" } })
    const classB = await prisma.class.create({ data: { schoolId: schoolB.id, name: "Class 5", order: 5 } })
    const sectionB = await prisma.section.create({ data: { classId: classB.id, name: "A" } })
    const userB = await prisma.user.create({
      data: {
        schoolId: schoolB.id,
        name: `${RUN_PREFIX} Other Accountant`,
        email: `${RUN_PREFIX.toLowerCase().replace(/\s+/g, "-")}-accountant@benwil.test`,
        passwordHash: accountant.passwordHash,
        role: "ACCOUNTANT",
      },
    })
    const studentB = await prisma.student.create({
      data: {
        schoolId: schoolB.id,
        studentUid: `${RUN_PREFIX}-STU-B`,
        admissionNumber: `${RUN_PREFIX}-ADM-B`,
        name: `${RUN_PREFIX} Other Student`,
        dateOfBirth: new Date("2014-01-01"),
        gender: "MALE",
        academicYearId: academicYearB.id,
        classId: classB.id,
        sectionId: sectionB.id,
        roll: 1,
      },
    })
    otherStudentId = studentB.id
    const categoryB = await prisma.feeCategory.create({ data: { schoolId: schoolB.id, name: `${RUN_PREFIX} Category B` } })
    const otherFee = await prisma.studentFee.create({
      data: {
        schoolId: schoolB.id,
        studentId: studentB.id,
        academicYearId: academicYearB.id,
        feeCategoryId: categoryB.id,
        name: `${RUN_PREFIX} Other Fee`,
        amount: "500.00",
        assignedById: userB.id,
      },
    })
    otherStudentFeeId = otherFee.id
    const otherPayment = await prisma.payment.create({
      data: {
        schoolId: schoolB.id,
        studentId: studentB.id,
        receiptNumber: `${RUN_PREFIX}-RCPT-B`,
        amount: "500.00",
        method: "CASH",
        receivedById: userB.id,
        allocations: { create: [{ schoolId: schoolB.id, studentFeeId: otherFee.id, amount: "500.00" }] },
      },
    })
    otherPaymentId = otherPayment.id
  })

  test.afterAll(async () => {
    await prisma.paymentAllocation.deleteMany({ where: { OR: [{ schoolId: schoolAId }, { schoolId: otherSchoolId }] } })
    await prisma.payment.deleteMany({ where: { id: { in: [ownPaymentId, otherPaymentId] } } })
    await prisma.studentFee.deleteMany({ where: { id: { in: [ownStudentFeeId, otherStudentFeeId] } } })
    await prisma.feeCategory.deleteMany({ where: { name: { startsWith: RUN_PREFIX } } })
    await prisma.student.deleteMany({ where: { id: { in: [ownStudentId, unrelatedStudentId] } } })

    await prisma.student.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.feeCategory.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.user.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.section.deleteMany({ where: { class: { schoolId: otherSchoolId } } })
    await prisma.class.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.academicYear.deleteMany({ where: { schoolId: otherSchoolId } })
    await prisma.school.delete({ where: { id: otherSchoolId } })
    await prisma.$disconnect()
  })

  test("teacher, librarian, and HR cannot reach fee administration", async ({ page }) => {
    for (const account of [ACCOUNTS.teacher, ACCOUNTS.librarian, ACCOUNTS.hr]) {
      await login(page, account.email, account.password)
      await page.goto("/fees/structures")
      await expect(page).toHaveURL(/\/unauthorized$/)
      // Navigate off /unauthorized before logging out - see fees-admin.spec.ts.
      await page.goto("/dashboard")
      await logout(page)
    }
  })

  test("accountant can manage structures/payments but not categories", async ({ page }) => {
    await login(page, ACCOUNTS.accountant.email, ACCOUNTS.accountant.password)

    await page.goto("/fees/structures")
    await expect(page).toHaveURL(/\/fees\/structures$/)

    await page.goto("/fees/categories")
    await expect(page).toHaveURL(/\/unauthorized$/)
  })

  test("another school's student fee page is rejected as not found", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/fees/student/${otherStudentId}`)
    await expect(page.getByText("Record not found.")).toBeVisible()
  })

  test("another school's payment receipt and void route are rejected as not found", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/fees/payments/${otherPaymentId}/receipt`)
    await expect(page.getByText("Page not found")).toBeVisible()

    await page.goto(`/fees/payments/${otherPaymentId}/void`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })

  test("a mixed combination - own school's real student with another school's real fee id - cannot be paid", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.accountant.email, ACCOUNTS.accountant.password)
    // Own student, but the outstanding-fee list on this page will only ever
    // contain ownStudentId's own fees - otherStudentFeeId belongs to a
    // different school and student entirely, so it never appears to select.
    await page.goto(`/fees/payments/new?studentId=${ownStudentId}`)
    await expect(page.getByText(`${RUN_PREFIX} Other Fee`)).toHaveCount(0)
  })

  test("allocating more than a fee's remaining balance is rejected server-side", async ({ page }) => {
    await login(page, ACCOUNTS.accountant.email, ACCOUNTS.accountant.password)
    await page.goto(`/fees/payments/new?studentId=${ownStudentId}`)

    const feeRow = page.locator("tr", { hasText: `${RUN_PREFIX} Fee` })
    await feeRow.getByRole("checkbox").check()
    // Remaining balance is 500 - 200 = 300; try to overpay it.
    await feeRow.locator('input[type="number"]').fill("9999")
    await page.getByRole("button", { name: "Record Payment" }).click()
    await expect(page.getByText("This allocation exceeds the fee's remaining balance.")).toBeVisible()
  })

  test("student portal shows only own fees and receipts", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto("/portal/student/fees")
    await expect(page.getByText("Class 5 Tuition Fee")).toBeVisible()

    // Cannot reach admin fee administration - the dashboard layout bounces
    // any STUDENT/GUARDIAN straight back to their portal home for every
    // (dashboard) route, before any page-level role check even runs.
    await page.goto("/fees")
    await expect(page).toHaveURL(/\/portal\/student$/)

    // Cannot view another student's receipt by guessing its id.
    await page.goto(`/portal/student/fees/${ownPaymentId}/receipt`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })

  test("guardian portal shows only the linked child's fees, never an unrelated student's", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    // guardian@benwil.test's linked child is redirected to automatically;
    // capture that studentId then try the unrelated one directly.
    await page.waitForURL(/\/portal\/guardian\/children\/[^/]+$/)
    const linkedStudentId = page.url().match(/\/children\/([^/]+)/)![1]

    await page.goto(`/portal/guardian/children/${linkedStudentId}/fees`)
    await expect(page).not.toHaveURL(/\/unauthorized$/)

    await page.goto(`/portal/guardian/children/${unrelatedStudentId}/fees`)
    await expect(page.getByText("Page not found")).toBeVisible()

    await page.goto(`/portal/guardian/children/${otherStudentId}/fees`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })
})
