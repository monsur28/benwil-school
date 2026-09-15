import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { Role } from "@prisma/client"
import {
  isSubmissionOpen,
  checkStudentSubmissionEligibility,
  checkTeacherReviewAccess,
} from "../homework-submission-access"
import type { SessionData } from "@/lib/auth/session"

describe("isSubmissionOpen", () => {
  it("returns true when dueDate is in the future", () => {
    const future = new Date()
    future.setDate(future.getDate() + 2)
    assert.equal(isSubmissionOpen(future), true)
  })

  it("returns true when dueDate is today", () => {
    const today = new Date()
    assert.equal(isSubmissionOpen(today), true)
  })

  it("returns false when dueDate is in the past", () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    assert.equal(isSubmissionOpen(past), false)
  })
})

describe("checkStudentSubmissionEligibility", () => {
  const student = {
    schoolId: "sch_1",
    academicYearId: "yr_2026",
    classId: "cls_5",
    sectionId: "sec_a",
  }

  const validHomework = {
    schoolId: "sch_1",
    academicYearId: "yr_2026",
    classId: "cls_5",
    sectionId: "sec_a",
    status: "PUBLISHED",
  }

  it("allows eligible student on published homework", () => {
    const result = checkStudentSubmissionEligibility(student, validHomework)
    assert.deepEqual(result, { ok: true })
  })

  it("rejects when school does not match", () => {
    const result = checkStudentSubmissionEligibility(student, { ...validHomework, schoolId: "sch_2" })
    assert.deepEqual(result, { ok: false, reason: "unauthorized" })
  })

  it("rejects when homework is draft", () => {
    const result = checkStudentSubmissionEligibility(student, { ...validHomework, status: "DRAFT" })
    assert.deepEqual(result, { ok: false, reason: "not_found" })
  })

  it("rejects when class does not match", () => {
    const result = checkStudentSubmissionEligibility(student, { ...validHomework, classId: "cls_8" })
    assert.deepEqual(result, { ok: false, reason: "mismatch" })
  })

  it("rejects when section does not match", () => {
    const result = checkStudentSubmissionEligibility(student, { ...validHomework, sectionId: "sec_b" })
    assert.deepEqual(result, { ok: false, reason: "mismatch" })
  })
})

describe("checkTeacherReviewAccess", () => {
  const teacherUser: SessionData = {
    userId: "usr_teacher_1",
    name: "Teacher 1",
    role: Role.TEACHER,
    schoolId: "sch_1",
  }

  const adminUser: SessionData = {
    userId: "usr_admin_1",
    name: "Admin",
    role: Role.SCHOOL_ADMIN,
    schoolId: "sch_1",
  }

  const homework = {
    schoolId: "sch_1",
    teacherId: "usr_teacher_1",
    academicYearId: "yr_2026",
    classId: "cls_5",
    sectionId: "sec_a",
  }

  const matchingStudent = {
    schoolId: "sch_1",
    academicYearId: "yr_2026",
    classId: "cls_5",
    sectionId: "sec_a",
  }

  it("allows owning teacher to review assigned student", () => {
    const result = checkTeacherReviewAccess(teacherUser, homework, matchingStudent)
    assert.deepEqual(result, { ok: true })
  })

  it("rejects teacher who does not own homework", () => {
    const otherTeacher: SessionData = {
      ...teacherUser,
      userId: "usr_teacher_2",
    }
    const result = checkTeacherReviewAccess(otherTeacher, homework, matchingStudent)
    assert.deepEqual(result, { ok: false, reason: "unauthorized" })
  })

  it("allows admin/principal to review any school homework", () => {
    const result = checkTeacherReviewAccess(adminUser, homework, matchingStudent)
    assert.deepEqual(result, { ok: true })
  })

  it("rejects student from different section", () => {
    const wrongStudent = { ...matchingStudent, sectionId: "sec_b" }
    const result = checkTeacherReviewAccess(teacherUser, homework, wrongStudent)
    assert.deepEqual(result, { ok: false, reason: "mismatch" })
  })

  it("rejects cross-school user", () => {
    const crossSchoolAdmin: SessionData = {
      ...adminUser,
      schoolId: "sch_2",
    }
    const result = checkTeacherReviewAccess(crossSchoolAdmin, homework, matchingStudent)
    assert.deepEqual(result, { ok: false, reason: "unauthorized" })
  })
})
