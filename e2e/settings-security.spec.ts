import "dotenv/config"
import { test, expect, type Locator } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

// A plain .fill() on a react-hook-form-controlled input can append to rather
// than replace a non-empty defaultValue (the same quirk already documented
// on the login form in helpers.ts) - select-all + retype is the robust fix.
async function fillReplace(locator: Locator, value: string) {
  await locator.click({ clickCount: 3 })
  await locator.press("Backspace")
  await locator.pressSequentially(value)
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const RUN_PREFIX = `E2E SettingsSecurity ${Date.now()}`

let schoolId: string
let otherSchoolId: string

test.describe("School settings security, validation, and persistence", () => {
  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    schoolId = school.id

    // A second school with its own settings row, to prove isolation - School
    // A's admin saving changes must never touch this row.
    const otherSchool = await prisma.school.create({ data: { name: `${RUN_PREFIX} Other School` } })
    otherSchoolId = otherSchool.id
    await prisma.schoolSettings.create({
      data: { schoolId: otherSchoolId, schoolName: `${RUN_PREFIX} Other School Settings`, primaryColor: "#654321" },
    })
  })

  test.afterAll(async () => {
    // The seeded school had no SchoolSettings row before this suite ran (this
    // suite is what creates one, via the forms' upsert) - deleting it here
    // restores that baseline for any other spec that assumes no settings
    // row exists yet.
    await prisma.schoolSettings.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } })
    await prisma.school.delete({ where: { id: otherSchoolId } })
    await prisma.$disconnect()
  })

  test("a student cannot access settings", async ({ page }) => {
    await login(page, ACCOUNTS.student.email, ACCOUNTS.student.password)
    await page.goto("/settings")
    await expect(page).not.toHaveURL(/\/settings$/)
    await logout(page)
  })

  test("a guardian cannot access settings", async ({ page }) => {
    await login(page, ACCOUNTS.guardian.email, ACCOUNTS.guardian.password)
    await page.goto("/settings")
    await expect(page).not.toHaveURL(/\/settings$/)
    await logout(page)
  })

  test("a teacher cannot access or modify settings", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)

    await page.goto("/settings")
    await expect(page).toHaveURL(/\/unauthorized/)

    await page.goto("/settings/school")
    await expect(page).toHaveURL(/\/unauthorized/)

    await page.goto("/settings/branding")
    await expect(page).toHaveURL(/\/unauthorized/)

    await page.goto("/settings/system")
    await expect(page).toHaveURL(/\/unauthorized/)

    await logout(page)
  })

  test("an accountant cannot access settings", async ({ page }) => {
    await login(page, ACCOUNTS.accountant.email, ACCOUNTS.accountant.password)
    await page.goto("/settings")
    await expect(page).toHaveURL(/\/unauthorized/)
    await logout(page)
  })

  test("a school admin can view and update the school profile, and changes persist", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/settings/school")

    const newName = `${RUN_PREFIX} Admin Updated School`
    await fillReplace(page.locator("#school-name"), newName)
    await page.locator("#school-principal-name").fill(`${RUN_PREFIX} Principal`)
    await page.getByRole("button", { name: "Save Changes" }).click()
    await expect(page.getByText("Settings saved.")).toBeVisible()

    await page.reload()
    await expect(page.locator("#school-name")).toHaveValue(newName)

    const settings = await prisma.schoolSettings.findUniqueOrThrow({ where: { schoolId } })
    expect(settings.schoolName).toBe(newName)
    expect(settings.principalName).toBe(`${RUN_PREFIX} Principal`)

    await logout(page)
  })

  test("a principal can update branding settings", async ({ page }) => {
    await login(page, ACCOUNTS.principal.email, ACCOUNTS.principal.password)
    await page.goto("/settings/branding")

    await page.locator("#branding-primary-color").fill("#123ABC")
    // /settings/branding has two independent "Save Changes" buttons (colors
    // and login branding, in separate cards) - .first() is the colors one.
    await page.getByRole("button", { name: "Save Changes" }).first().click()
    await expect(page.getByText("Settings saved.")).toBeVisible()

    const settings = await prisma.schoolSettings.findUniqueOrThrow({ where: { schoolId } })
    expect(settings.primaryColor).toBe("#123ABC")

    await logout(page)
  })

  test("rejects an invalid color and does not save it", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/settings/branding")

    const before = await prisma.schoolSettings.findUniqueOrThrow({ where: { schoolId } })

    await page.locator("#branding-secondary-color").fill("not-a-color")
    await page.getByRole("button", { name: "Save Changes" }).first().click()
    await expect(page.getByText("Enter a color as #RRGGBB.")).toBeVisible()

    const after = await prisma.schoolSettings.findUniqueOrThrow({ where: { schoolId } })
    expect(after.secondaryColor).toBe(before.secondaryColor)

    await logout(page)
  })

  test("rejects a malformed email on the school profile form", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/settings/school")

    await page.locator("#school-email").fill("not-an-email")
    await page.getByRole("button", { name: "Save Changes" }).click()
    await expect(page.getByText("Enter a valid email address.")).toBeVisible()

    await logout(page)
  })

  test("rejects an invalid timezone on system settings", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/settings/system")

    await page.locator("#system-timezone").fill("Not/A_Real_Zone")
    await page.getByRole("button", { name: "Save Changes" }).click()
    await expect(page.getByText("Enter a valid timezone (e.g. Asia/Dhaka).")).toBeVisible()

    await logout(page)
  })

  test("rejects an unsupported file type for the logo upload", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/settings/branding")

    await page.setInputFiles('input[aria-label="School Logo"]', {
      name: "malicious.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from("<svg onload=alert(1)></svg>"),
    })
    await expect(page.getByText("That file type isn't supported.")).toBeVisible()

    await logout(page)
  })

  test("login page reflects updated login branding after saving", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/settings/branding")

    const newTitle = `${RUN_PREFIX} Custom Login Title`
    await page.locator("#login-title").fill(newTitle)
    // The login branding card is the one with id="login" (see
    // src/app/(dashboard)/settings/branding/page.tsx) - scoping avoids the
    // colors form's own "Save Changes" button on the same page.
    await page.locator("#login").getByRole("button", { name: "Save Changes" }).click()
    await expect(page.getByText("Settings saved.")).toBeVisible()
    await logout(page)

    await page.goto("/login")
    await expect(page.getByRole("heading", { name: newTitle })).toBeVisible()
  })

  test("a Bangla school name displays instead of the English one when the interface language is Bangla", async ({
    page,
  }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/settings/school")

    const banglaName = `${RUN_PREFIX} বাংলা নাম`
    await fillReplace(page.locator("#school-name-bangla"), banglaName)
    await page.getByRole("button", { name: "Save Changes" }).click()
    await expect(page.getByText("Settings saved.")).toBeVisible()

    await page.goto("/dashboard")
    await page.getByRole("button", { name: "Language" }).click()
    await page.getByRole("menuitem", { name: "বাংলা" }).click()
    // Branding propagates to more than one surface at once (sidebar, dashboard
    // greeting, route announcer) - that's the point of this phase, so
    // .first() rather than a locator coupled to exactly one of them.
    await expect(page.getByText(banglaName).first()).toBeVisible()

    // logout()'s "Account"/"Log out" labels are English-only (see
    // portal-student.spec.ts's own Bangla/English toggle test) - switch back
    // before calling it, same convention as that test.
    await page.getByRole("button", { name: "ভাষা" }).click()
    await page.getByRole("menuitem", { name: "English" }).click()
    await logout(page)
  })

  test("the report card shows the settings-configured school name, not the raw School record name", async ({
    page,
  }) => {
    const overrideName = `${RUN_PREFIX} Report Card School Name`
    // upsert, not update - this test must not depend on an earlier test in
    // this file having already created the settings row.
    await prisma.schoolSettings.upsert({
      where: { schoolId },
      create: { schoolId, schoolName: overrideName },
      update: { schoolName: overrideName },
    })

    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId, name: "2026" } })
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId, name: "Class 5" } })
    const sectionA = await prisma.section.findFirstOrThrow({ where: { classId: class5.id, name: "A" } })
    const mathSubject = await prisma.subject.findFirstOrThrow({ where: { schoolId, code: "MATH" } })
    const student = await prisma.student.findFirstOrThrow({
      where: { schoolId, classId: class5.id, sectionId: sectionA.id, academicYearId: academicYear.id },
    })
    const teacher = await prisma.user.findFirstOrThrow({ where: { schoolId, email: ACCOUNTS.teacher.email } })
    const examType = await prisma.examType.create({ data: { schoolId, name: `${RUN_PREFIX} Report Card Type` } })
    const exam = await prisma.exam.create({
      data: {
        schoolId,
        academicYearId: academicYear.id,
        examTypeId: examType.id,
        name: `${RUN_PREFIX} Report Card Exam`,
        startDate: new Date("2026-12-01"),
        endDate: new Date("2026-12-05"),
      },
    })
    const schedule = await prisma.examSchedule.create({
      data: {
        schoolId,
        examId: exam.id,
        classId: class5.id,
        subjectId: mathSubject.id,
        examDate: new Date("2026-12-02"),
        fullMarks: 100,
        passMarks: 33,
      },
    })
    await prisma.examMark.create({
      data: { schoolId, examScheduleId: schedule.id, studentId: student.id, marks: 80, enteredById: teacher.id },
    })

    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto(`/results/${exam.id}/student/${student.id}/report-card`)
    await expect(page.getByRole("heading", { name: overrideName })).toBeVisible()

    await prisma.examMark.deleteMany({ where: { examScheduleId: schedule.id } })
    await prisma.examSchedule.delete({ where: { id: schedule.id } })
    await prisma.exam.delete({ where: { id: exam.id } })
    await prisma.examType.delete({ where: { id: examType.id } })
    await logout(page)
  })

  test("saving School A's settings never modifies School B's settings row", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/settings/branding")
    await page.locator("#branding-accent-color").fill("#ABCDEF")
    await page.getByRole("button", { name: "Save Changes" }).first().click()
    await expect(page.getByText("Settings saved.")).toBeVisible()
    await logout(page)

    const otherSchoolSettings = await prisma.schoolSettings.findUniqueOrThrow({ where: { schoolId: otherSchoolId } })
    expect(otherSchoolSettings.schoolName).toBe(`${RUN_PREFIX} Other School Settings`)
    expect(otherSchoolSettings.primaryColor).toBe("#654321")
    expect(otherSchoolSettings.accentColor).not.toBe("#ABCDEF")
  })
})
