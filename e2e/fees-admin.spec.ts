import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// A run-unique prefix so this spec's fixtures (category, structure, student,
// fees, payments) can be cleaned up afterwards without touching the
// deterministic seed fixture (Tuition Fee / Class 5 Tuition Fee / Nusrat
// Jahan) or any other spec's data.
const RUN_PREFIX = `E2E FeesAdmin ${Date.now()}`

let schoolId: string
let academicYearId: string
let classId: string
let sectionId: string
let studentId: string

test.describe("Admin fee management", () => {
  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    schoolId = school.id
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId, name: "2026" } })
    academicYearId = academicYear.id
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId, name: "Class 5" } })
    classId = class5.id
    const sectionA = await prisma.section.findFirstOrThrow({ where: { classId, name: "A" } })
    sectionId = sectionA.id

    const student = await prisma.student.create({
      data: {
        schoolId,
        studentUid: `${RUN_PREFIX}-STU`,
        admissionNumber: `${RUN_PREFIX}-ADM`,
        name: `${RUN_PREFIX} Student`,
        dateOfBirth: new Date("2014-06-01"),
        gender: "FEMALE",
        academicYearId,
        classId,
        sectionId,
        roll: 999,
      },
    })
    studentId = student.id
  })

  test.afterAll(async () => {
    const structures = await prisma.feeStructure.findMany({ where: { name: { startsWith: RUN_PREFIX } } })
    const structureIds = structures.map((s) => s.id)
    const studentFees = await prisma.studentFee.findMany({
      where: { OR: [{ studentId }, { feeStructureId: { in: structureIds } }] },
    })
    const studentFeeIds = studentFees.map((f) => f.id)
    const allocations = await prisma.paymentAllocation.findMany({ where: { studentFeeId: { in: studentFeeIds } } })
    const paymentIds = [...new Set(allocations.map((a) => a.paymentId))]
    await prisma.paymentAllocation.deleteMany({ where: { studentFeeId: { in: studentFeeIds } } })
    await prisma.payment.deleteMany({ where: { id: { in: paymentIds } } })
    await prisma.studentFee.deleteMany({ where: { id: { in: studentFeeIds } } })
    await prisma.feeStructure.deleteMany({ where: { id: { in: structureIds } } })
    await prisma.feeCategory.deleteMany({ where: { name: { startsWith: RUN_PREFIX } } })
    await prisma.student.delete({ where: { id: studentId } })
    await prisma.$disconnect()
  })

  test("create a fee category and toggle it active/inactive", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    const name = `${RUN_PREFIX} Category`

    await page.goto("/fees/categories")
    await page.getByRole("button", { name: "Add Category" }).click()
    await page.locator("#fee-category-name").fill(name)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText(name)).toBeVisible()

    const row = page.locator("tr", { hasText: name })
    await row.getByRole("button", { name: "Deactivate" }).click()
    await expect(row.getByText("Inactive")).toBeVisible()
    await row.getByRole("button", { name: "Activate" }).click()
    await expect(row.getByText("Active")).toBeVisible()
  })

  test("create a fee structure and reject a duplicate", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    const categoryName = `${RUN_PREFIX} Category For Structure`
    await prisma.feeCategory.create({ data: { schoolId, name: categoryName } })

    const structureName = `${RUN_PREFIX} Structure`
    await page.goto("/fees/structures")
    await page.getByRole("button", { name: "Add Fee Structure" }).click()
    await page.locator("#fee-structure-year").selectOption({ label: "2026" })
    await page.locator("#fee-structure-class").selectOption({ label: "Class 5" })
    await page.locator("#fee-structure-category").selectOption({ label: categoryName })
    await page.locator("#fee-structure-name").fill(structureName)
    await page.locator("#fee-structure-amount").fill("1500")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText(structureName)).toBeVisible()

    // Exact same (year, class, category, name) is rejected as a duplicate.
    await page.getByRole("button", { name: "Add Fee Structure" }).click()
    await page.locator("#fee-structure-year").selectOption({ label: "2026" })
    await page.locator("#fee-structure-class").selectOption({ label: "Class 5" })
    await page.locator("#fee-structure-category").selectOption({ label: categoryName })
    await page.locator("#fee-structure-name").fill(structureName)
    await page.locator("#fee-structure-amount").fill("1500")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("A fee structure with this name already exists")).toBeVisible()
  })

  test("assign a fee, record a partial then final payment, and view the receipt", async ({ page }) => {
    await login(page, ACCOUNTS.accountant.email, ACCOUNTS.accountant.password)

    const feeName = `${RUN_PREFIX} Assigned Fee`
    await page.goto(`/fees/student/${studentId}`)
    await page.getByRole("button", { name: "Assign Fee" }).click()
    await page.locator("#assign-fee-name").fill(feeName)
    await page.locator("#assign-fee-amount").fill("1000")
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByRole("cell", { name: feeName })).toBeVisible()
    await expect(page.getByText("Unpaid")).toBeVisible()

    // Partial payment.
    await page.getByRole("button", { name: "Record Payment" }).click()
    const feeRow = page.locator("tr", { hasText: feeName })
    await feeRow.getByRole("checkbox").check()
    await feeRow.locator('input[type="number"]').fill("400")
    await page.locator("#payment-method").selectOption({ label: "Cash" })
    await page.getByRole("button", { name: "Record Payment" }).click()
    await expect(page).toHaveURL(/\/fees\/payments\/[^/]+\/receipt$/)
    await expect(page.getByText("Payment Receipt").first()).toBeVisible()
    await expect(page.getByText("400.00").first()).toBeVisible()

    await page.goto(`/fees/student/${studentId}`)
    await expect(page.locator("tr", { hasText: feeName }).getByText("Partial")).toBeVisible()

    // Final payment for the remaining balance.
    await page.getByRole("button", { name: "Record Payment" }).click()
    const feeRowAgain = page.locator("tr", { hasText: feeName })
    await feeRowAgain.getByRole("checkbox").check()
    await expect(feeRowAgain.locator('input[type="number"]')).toHaveValue("600.00")
    await page.locator("#payment-method").selectOption({ label: "Cash" })
    await page.getByRole("button", { name: "Record Payment" }).click()
    await expect(page).toHaveURL(/\/fees\/payments\/[^/]+\/receipt$/)

    await page.goto(`/fees/student/${studentId}`)
    await expect(page.locator("tr", { hasText: feeName }).getByText("Paid")).toBeVisible()
  })

  test("accountant cannot void a payment; admin can, and it stays visible as voided", async ({ page }) => {
    const category = await prisma.feeCategory.create({ data: { schoolId, name: `${RUN_PREFIX} Void Category` } })
    const fee = await prisma.studentFee.create({
      data: {
        schoolId,
        studentId,
        academicYearId,
        feeCategoryId: category.id,
        name: `${RUN_PREFIX} Void Fee`,
        amount: "300.00",
        assignedById: (await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.accountant.email } })).id,
        status: "UNPAID",
      },
    })

    await login(page, ACCOUNTS.accountant.email, ACCOUNTS.accountant.password)
    await page.goto(`/fees/payments/new?studentId=${studentId}`)
    const feeRow = page.locator("tr", { hasText: `${RUN_PREFIX} Void Fee` })
    await feeRow.getByRole("checkbox").check()
    await page.getByRole("button", { name: "Record Payment" }).click()
    await expect(page).toHaveURL(/\/fees\/payments\/[^/]+\/receipt$/)

    // Accountant sees no Void action on the receipt, and cannot reach the
    // void route directly either - only SUPER_ADMIN/SCHOOL_ADMIN/PRINCIPAL
    // may void a completed payment.
    await expect(page.getByRole("button", { name: "Void Payment" })).toHaveCount(0)
    const receiptUrl = page.url()
    const paymentId = receiptUrl.match(/\/fees\/payments\/([^/]+)\/receipt$/)![1]
    await page.goto(`/fees/payments/${paymentId}/void`)
    await expect(page).toHaveURL(/\/unauthorized$/)

    // Navigate off /unauthorized before logging out - its minimal content
    // means the shell hasn't necessarily finished hydrating the account
    // menu the instant the redirect lands.
    await page.goto("/dashboard")
    await logout(page)
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/fees/payments/${paymentId}/void`)
    await page.locator("#void-reason").fill("Entered against the wrong student fee.")
    await page.getByRole("button", { name: "Void Payment" }).click()
    await expect(page).toHaveURL(/\/fees\/payments\/[^/]+\/receipt$/)
    await expect(page.getByText("This payment has been voided.")).toBeVisible()

    const feeAfterVoid = await prisma.studentFee.findUniqueOrThrow({ where: { id: fee.id } })
    expect(feeAfterVoid.status).toBe("UNPAID")

    const paymentAfterVoid = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } })
    expect(paymentAfterVoid.status).toBe("VOIDED")
    expect(paymentAfterVoid.amount.toNumber()).toBe(300) // original amount untouched
  })
})
