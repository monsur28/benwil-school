import "dotenv/config"
import { test, expect } from "@playwright/test"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, Role } from "@prisma/client"
import { login, logout, ACCOUNTS } from "./helpers"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// A run-unique prefix so this spec's fixtures (categories, homework, the
// second teacher) can be cleaned up afterwards without touching the
// deterministic seed fixtures or any other spec's data.
const RUN_PREFIX = `E2E HomeworkAdmin ${Date.now()}`

let schoolId: string
let academicYearId: string
let class5Id: string
let class8Id: string
let sectionA8Id: string
let otherTeacherEmail: string
let otherTeacherId: string
let otherTeacherHomeworkId: string

test.describe("Staff homework management", () => {
  test.beforeAll(async () => {
    const school = await prisma.school.findFirstOrThrow()
    schoolId = school.id
    const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { schoolId, name: "2026" } })
    academicYearId = academicYear.id
    const class5 = await prisma.class.findFirstOrThrow({ where: { schoolId, name: "Class 5" } })
    class5Id = class5.id
    const class8 = await prisma.class.findFirstOrThrow({ where: { schoolId, name: "Class 8" } })
    class8Id = class8.id
    const sectionA8 = await prisma.section.findFirstOrThrow({ where: { classId: class8Id, name: "A" } })
    sectionA8Id = sectionA8.id

    // A second teacher, with no assignments, for the "cannot edit another
    // teacher's homework" check - and one homework row owned by them.
    const admin = await prisma.user.findFirstOrThrow({ where: { email: ACCOUNTS.admin.email } })
    otherTeacherEmail = `${RUN_PREFIX.toLowerCase().replace(/\s+/g, "-")}-teacher@benwil.test`
    const otherTeacher = await prisma.user.create({
      data: {
        schoolId,
        name: `${RUN_PREFIX} Other Teacher`,
        email: otherTeacherEmail,
        passwordHash: admin.passwordHash,
        role: Role.TEACHER,
      },
    })
    otherTeacherId = otherTeacher.id
    const category = await prisma.homeworkCategory.create({ data: { schoolId, name: `${RUN_PREFIX} Fixture Category` } })
    const otherTeacherHomework = await prisma.homework.create({
      data: {
        schoolId,
        academicYearId,
        teacherId: otherTeacherId,
        subjectId: (await prisma.subject.findFirstOrThrow({ where: { schoolId, code: "MATH" } })).id,
        classId: class5Id,
        sectionId: (await prisma.section.findFirstOrThrow({ where: { classId: class5Id, name: "A" } })).id,
        categoryId: category.id,
        title: `${RUN_PREFIX} Other Teacher's Homework`,
        instructions: "Not yours to edit.",
        status: "DRAFT",
        assignedDate: new Date("2026-09-15"),
        dueDate: new Date("2026-09-20"),
      },
    })
    otherTeacherHomeworkId = otherTeacherHomework.id
  })

  test.afterAll(async () => {
    await prisma.homework.deleteMany({ where: { schoolId, title: { startsWith: RUN_PREFIX } } })
    await prisma.homeworkCategory.deleteMany({ where: { schoolId, name: { startsWith: RUN_PREFIX } } })
    await prisma.user.delete({ where: { id: otherTeacherId } })
    await prisma.$disconnect()
  })

  test("admin and teacher can both open the homework list", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/homework")
    await expect(page.getByRole("heading", { name: "Homework" })).toBeVisible()
    await page.goto("/dashboard")
    await logout(page)

    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto("/homework")
    await expect(page.getByRole("heading", { name: "Homework" })).toBeVisible()
    // A teacher never sees the admin-only Categories tab.
    await expect(page.getByRole("link", { name: "Categories" })).toHaveCount(0)
  })

  test("teacher creates a draft, publishes it, then edits it", async ({ page }) => {
    const title = `${RUN_PREFIX} Draft Flow`
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)

    await page.goto("/homework/new")
    await page.locator("#homework-title").fill(title)
    await page.locator("#homework-instructions").fill("Read chapter 4.")
    // teacher@benwil.test's only seeded assignment is Class 5 / Section A / Mathematics.
    await page.locator("#homework-class").selectOption({ label: "Class 5" })
    await page.locator("#homework-section").selectOption({ label: "A" })
    await page.locator("#homework-subject").selectOption({ label: "Mathematics" })
    await page.getByRole("button", { name: "Save Draft" }).click()
    // "new" would also satisfy a plain [^/]+ match, so exclude it explicitly -
    // otherwise this resolves instantly against the pre-navigation URL.
    await expect(page).toHaveURL(/\/homework\/(?!new)[^/]+$/)
    await expect(page.getByText("Draft", { exact: true })).toBeVisible()

    await page.getByRole("button", { name: "Publish" }).click()
    await expect(page.getByText("Published", { exact: true }).first()).toBeVisible()
    await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0)

    const newTitle = `${title} (Updated)`
    // The Edit link is a Base UI Button rendered as an <a> - it carries an
    // explicit role="button" (button semantics over anchor navigation), not
    // the implicit link role, so it must be queried as a button here.
    await page.getByRole("button", { name: "Edit" }).click()
    await page.locator("#homework-title").fill(newTitle)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByRole("heading", { name: newTitle })).toBeVisible()
    // Editing a published homework never silently reverts it to draft.
    await expect(page.getByText("Published", { exact: true }).first()).toBeVisible()
  })

  test("teacher cannot edit another teacher's homework", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto(`/homework/${otherTeacherHomeworkId}`)
    await expect(page.getByText("Page not found")).toBeVisible()
    await page.goto(`/homework/${otherTeacherHomeworkId}/edit`)
    await expect(page.getByText("Page not found")).toBeVisible()
  })

  test("teacher cannot create homework for an unassigned class/section/subject", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto("/homework/new")

    // The dropdowns only ever offer this teacher's real assignments - to
    // prove the server (not just the UI) rejects an unassigned combination,
    // inject an option for Class 8 / Section A (a real class this teacher
    // has no TeacherAssignment for) directly into the DOM, the same way a
    // tampered client request would arrive.
    await page.locator("#homework-title").fill(`${RUN_PREFIX} Unassigned Attempt`)
    await page.locator("#homework-instructions").fill("Should be rejected.")
    await page.evaluate(
      ({ classId, sectionId, subjectId }) => {
        const classSelect = document.querySelector("#homework-class") as HTMLSelectElement
        const sectionSelect = document.querySelector("#homework-section") as HTMLSelectElement
        const subjectSelect = document.querySelector("#homework-subject") as HTMLSelectElement
        classSelect.add(new Option("Class 8 (tampered)", classId))
        sectionSelect.add(new Option("A (tampered)", sectionId))
        subjectSelect.add(new Option("Mathematics (tampered)", subjectId))
        classSelect.value = classId
        sectionSelect.value = sectionId
        subjectSelect.value = subjectId
        // react-hook-form's watch()-driven cascade only picks up a value
        // change via a real 'change' event, not a raw DOM .value assignment.
        for (const el of [classSelect, sectionSelect, subjectSelect]) {
          el.dispatchEvent(new Event("change", { bubbles: true }))
        }
      },
      {
        classId: class8Id,
        sectionId: sectionA8Id,
        subjectId: (await prisma.subject.findFirstOrThrow({ where: { schoolId, code: "MATH" } })).id,
      }
    )
    await page.getByRole("button", { name: "Save Draft" }).click()
    await expect(page.getByText("You are not assigned to teach this class, section, and subject.")).toBeVisible()
  })

  test("admin can create homework on behalf of a teacher", async ({ page }) => {
    const title = `${RUN_PREFIX} Admin Created`
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await page.goto("/homework/new")
    await page.locator("#homework-title").fill(title)
    await page.locator("#homework-instructions").fill("Assigned by admin.")
    await page.locator("#homework-teacher").selectOption({ label: "Teacher" })
    await page.locator("#homework-class").selectOption({ label: "Class 5" })
    await page.locator("#homework-section").selectOption({ label: "A" })
    await page.locator("#homework-subject").selectOption({ label: "Mathematics" })
    await page.getByRole("button", { name: "Publish" }).click()
    await expect(page).toHaveURL(/\/homework\/(?!new)[^/]+$/)
    await expect(page.getByRole("heading", { name: title })).toBeVisible()
    await expect(page.getByText("Published", { exact: true }).first()).toBeVisible()
  })

  test("create a homework category and toggle it active/inactive", async ({ page }) => {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    const name = `${RUN_PREFIX} Category`

    await page.goto("/homework/categories")
    await page.getByRole("button", { name: "Add Category" }).click()
    await page.locator("#homework-category-name").fill(name)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText(name)).toBeVisible()

    const row = page.locator("tr", { hasText: name })
    await row.getByRole("button", { name: "Deactivate" }).click()
    await expect(row.getByText("Inactive")).toBeVisible()
    await row.getByRole("button", { name: "Activate" }).click()
    await expect(row.getByText("Active")).toBeVisible()
  })

  test("teacher cannot reach category management", async ({ page }) => {
    await login(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password)
    await page.goto("/homework/categories")
    await expect(page).toHaveURL(/\/unauthorized$/)
  })

  test("a non-homework role cannot reach homework management", async ({ page }) => {
    await login(page, ACCOUNTS.accountant.email, ACCOUNTS.accountant.password)
    await page.goto("/homework")
    await expect(page).toHaveURL(/\/unauthorized$/)
  })
})
