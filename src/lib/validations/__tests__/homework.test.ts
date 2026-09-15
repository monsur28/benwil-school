import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { createHomeworkSchema, createHomeworkCategorySchema } from "../homework"

const validHomework = {
  academicYearId: "year-1",
  subjectId: "subject-1",
  classId: "class-1",
  sectionId: "section-1",
  categoryId: "",
  teacherId: "",
  title: "Chapter 3 exercises",
  instructions: "Complete questions 1-10.",
  assignedDate: "2026-09-15",
  dueDate: "2026-09-20",
}

describe("homework validation", () => {
  it("accepts a valid homework payload", () => {
    const result = createHomeworkSchema.safeParse(validHomework)
    assert.equal(result.success, true)
  })

  it("accepts a due date equal to the assigned date", () => {
    const result = createHomeworkSchema.safeParse({ ...validHomework, dueDate: validHomework.assignedDate })
    assert.equal(result.success, true)
  })

  it("rejects a due date earlier than the assigned date", () => {
    const result = createHomeworkSchema.safeParse({
      ...validHomework,
      assignedDate: "2026-09-20",
      dueDate: "2026-09-15",
    })
    assert.equal(result.success, false)
    if (!result.success) {
      const dueDateIssue = result.error.issues.find((issue) => issue.path.includes("dueDate"))
      assert.ok(dueDateIssue, "expected a dueDate validation issue")
    }
  })

  it("rejects a missing title", () => {
    const result = createHomeworkSchema.safeParse({ ...validHomework, title: "" })
    assert.equal(result.success, false)
  })

  it("rejects a missing instructions", () => {
    const result = createHomeworkSchema.safeParse({ ...validHomework, instructions: "" })
    assert.equal(result.success, false)
  })

  it("rejects an unparseable date", () => {
    const result = createHomeworkSchema.safeParse({ ...validHomework, dueDate: "not-a-date" })
    assert.equal(result.success, false)
  })

  it("rejects a missing class/section/subject/academic year selection", () => {
    for (const field of ["academicYearId", "subjectId", "classId", "sectionId"] as const) {
      const result = createHomeworkSchema.safeParse({ ...validHomework, [field]: "" })
      assert.equal(result.success, false, `expected ${field} to be required`)
    }
  })
})

describe("homework category validation", () => {
  it("accepts a valid category", () => {
    const result = createHomeworkCategorySchema.safeParse({ name: "Class Work", description: "" })
    assert.equal(result.success, true)
  })

  it("rejects a missing name", () => {
    const result = createHomeworkCategorySchema.safeParse({ name: "", description: "" })
    assert.equal(result.success, false)
  })
})
