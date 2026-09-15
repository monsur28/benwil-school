import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { submitHomeworkSchema, reviewHomeworkSubmissionSchema } from "../homework-submission"

describe("submitHomeworkSchema", () => {
  it("accepts valid submission payload", () => {
    const result = submitHomeworkSchema.safeParse({
      homeworkId: "hw_123",
      content: "This is my homework answer.",
    })
    assert.equal(result.success, true)
  })

  it("rejects empty homeworkId", () => {
    const result = submitHomeworkSchema.safeParse({
      homeworkId: "   ",
      content: "Answer",
    })
    assert.equal(result.success, false)
  })

  it("rejects content exceeding 10,000 characters", () => {
    const result = submitHomeworkSchema.safeParse({
      homeworkId: "hw_123",
      content: "a".repeat(10001),
    })
    assert.equal(result.success, false)
  })
})

describe("reviewHomeworkSubmissionSchema", () => {
  it("accepts review with marks, grade, and feedback", () => {
    const result = reviewHomeworkSubmissionSchema.safeParse({
      homeworkId: "hw_123",
      studentId: "stu_456",
      marks: 18.5,
      grade: "A+",
      feedback: "Great work!",
    })
    assert.equal(result.success, true)
  })

  it("accepts review with only feedback", () => {
    const result = reviewHomeworkSubmissionSchema.safeParse({
      homeworkId: "hw_123",
      studentId: "stu_456",
      feedback: "Needs more detail.",
    })
    assert.equal(result.success, true)
  })

  it("accepts review with only marks", () => {
    const result = reviewHomeworkSubmissionSchema.safeParse({
      homeworkId: "hw_123",
      studentId: "stu_456",
      marks: "20",
    })
    assert.equal(result.success, true)
    if (result.success) {
      assert.equal(result.data.marks, 20)
    }
  })

  it("rejects review with no marks, grade, or feedback", () => {
    const result = reviewHomeworkSubmissionSchema.safeParse({
      homeworkId: "hw_123",
      studentId: "stu_456",
      marks: "",
      grade: "",
      feedback: "",
    })
    assert.equal(result.success, false)
  })

  it("rejects negative marks", () => {
    const result = reviewHomeworkSubmissionSchema.safeParse({
      homeworkId: "hw_123",
      studentId: "stu_456",
      marks: -5,
      feedback: "Bad",
    })
    assert.equal(result.success, false)
  })

  it("rejects feedback exceeding 10,000 characters", () => {
    const result = reviewHomeworkSubmissionSchema.safeParse({
      homeworkId: "hw_123",
      studentId: "stu_456",
      feedback: "f".repeat(10001),
    })
    assert.equal(result.success, false)
  })
})
