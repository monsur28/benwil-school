import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  routineEntrySchema,
  editRoutineEntrySchema,
  DAY_OF_WEEK_VALUES,
} from "../routine"
import {
  timesOverlap,
  JS_DAY_TO_DAY_OF_WEEK,
  ORDERED_DAYS_OF_WEEK,
} from "@/lib/academics/routine"
import { DayOfWeek } from "@prisma/client"

const validRoutineInput = {
  academicYearId: "year-1",
  classId: "class-1",
  sectionId: "section-1",
  subjectId: "subject-1",
  teacherId: "teacher-1",
  dayOfWeek: "MONDAY",
  periodNumber: 1,
  startTime: "09:00",
  endTime: "09:45",
  room: "Room 101",
}

describe("routine validation", () => {
  it("accepts a valid routine entry", () => {
    const result = routineEntrySchema.safeParse(validRoutineInput)
    assert.equal(result.success, true)
  })

  it("accepts an entry with null or empty room", () => {
    const result1 = routineEntrySchema.safeParse({ ...validRoutineInput, room: "" })
    assert.equal(result1.success, true)

    const result2 = routineEntrySchema.safeParse({ ...validRoutineInput, room: undefined })
    assert.equal(result2.success, true)
  })

  it("accepts all 7 valid days of week", () => {
    for (const day of DAY_OF_WEEK_VALUES) {
      const result = routineEntrySchema.safeParse({ ...validRoutineInput, dayOfWeek: day })
      assert.equal(result.success, true, `expected ${day} to be valid`)
    }
  })

  it("rejects an invalid day of week", () => {
    const result = routineEntrySchema.safeParse({ ...validRoutineInput, dayOfWeek: "FUNDAY" })
    assert.equal(result.success, false)
  })

  it("rejects periodNumber < 1 or > 12", () => {
    const resultLow = routineEntrySchema.safeParse({ ...validRoutineInput, periodNumber: 0 })
    assert.equal(resultLow.success, false)

    const resultHigh = routineEntrySchema.safeParse({ ...validRoutineInput, periodNumber: 13 })
    assert.equal(resultHigh.success, false)

    const resultValidMax = routineEntrySchema.safeParse({ ...validRoutineInput, periodNumber: 12 })
    assert.equal(resultValidMax.success, true)
  })

  it("rejects invalid time formats", () => {
    const invalidTimes = ["9:00", "25:00", "09:60", "abc", "09:0", "09:000"]
    for (const time of invalidTimes) {
      const resStart = routineEntrySchema.safeParse({ ...validRoutineInput, startTime: time })
      assert.equal(resStart.success, false, `expected invalid start time: ${time}`)

      const resEnd = routineEntrySchema.safeParse({ ...validRoutineInput, endTime: time })
      assert.equal(resEnd.success, false, `expected invalid end time: ${time}`)
    }
  })

  it("rejects endTime earlier than or equal to startTime", () => {
    const equalTimes = routineEntrySchema.safeParse({
      ...validRoutineInput,
      startTime: "10:00",
      endTime: "10:00",
    })
    assert.equal(equalTimes.success, false)

    const invertedTimes = routineEntrySchema.safeParse({
      ...validRoutineInput,
      startTime: "10:00",
      endTime: "09:30",
    })
    assert.equal(invertedTimes.success, false)
  })

  it("rejects missing mandatory IDs", () => {
    const requiredFields = [
      "academicYearId",
      "classId",
      "sectionId",
      "subjectId",
      "teacherId",
    ] as const

    for (const field of requiredFields) {
      const result = routineEntrySchema.safeParse({ ...validRoutineInput, [field]: "" })
      assert.equal(result.success, false, `expected ${field} to be required`)
    }
  })

  it("validates editRoutineEntrySchema requires id", () => {
    const withoutId = editRoutineEntrySchema.safeParse(validRoutineInput)
    assert.equal(withoutId.success, false)

    const withId = editRoutineEntrySchema.safeParse({ ...validRoutineInput, id: "routine-entry-1" })
    assert.equal(withId.success, true)
  })
})

describe("routine time overlap logic", () => {
  it("detects partially overlapping times", () => {
    assert.equal(timesOverlap("09:00", "09:45", "09:30", "10:15"), true)
    assert.equal(timesOverlap("09:30", "10:15", "09:00", "09:45"), true)
  })

  it("detects completely enclosed times", () => {
    assert.equal(timesOverlap("09:00", "11:00", "09:30", "10:00"), true)
    assert.equal(timesOverlap("09:30", "10:00", "09:00", "11:00"), true)
  })

  it("allows adjacent non-overlapping times", () => {
    assert.equal(timesOverlap("09:00", "09:45", "09:45", "10:30"), false)
    assert.equal(timesOverlap("09:45", "10:30", "09:00", "09:45"), false)
  })

  it("allows completely disjoint times", () => {
    assert.equal(timesOverlap("08:00", "08:45", "10:00", "10:45"), false)
  })
})

describe("routine day mappings", () => {
  it("correctly maps JavaScript getDay() integers to DayOfWeek enum", () => {
    assert.equal(JS_DAY_TO_DAY_OF_WEEK[0], DayOfWeek.SUNDAY)
    assert.equal(JS_DAY_TO_DAY_OF_WEEK[1], DayOfWeek.MONDAY)
    assert.equal(JS_DAY_TO_DAY_OF_WEEK[2], DayOfWeek.TUESDAY)
    assert.equal(JS_DAY_TO_DAY_OF_WEEK[3], DayOfWeek.WEDNESDAY)
    assert.equal(JS_DAY_TO_DAY_OF_WEEK[4], DayOfWeek.THURSDAY)
    assert.equal(JS_DAY_TO_DAY_OF_WEEK[5], DayOfWeek.FRIDAY)
    assert.equal(JS_DAY_TO_DAY_OF_WEEK[6], DayOfWeek.SATURDAY)
  })

  it("has Saturday as the first day in ORDERED_DAYS_OF_WEEK", () => {
    assert.equal(ORDERED_DAYS_OF_WEEK[0], DayOfWeek.SATURDAY)
    assert.equal(ORDERED_DAYS_OF_WEEK.length, 7)
  })
})
