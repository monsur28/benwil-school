import "dotenv/config"
import { config as loadEnv } from "dotenv"
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { isTrustedStudentPhotoUrl, validateStudentPhotoFile } from "../cloudinary-student-documents"

// Next.js loads .env.local automatically; the node test runner does not, and
// the Cloudinary credentials live there.
loadEnv({ path: ".env.local", quiet: true })

// The photo is stored as a bare URL on the student row, so the URL is the
// only evidence the server has about where the file came from. These are the
// cases that matter: the field must not become a free-form link, and one
// school must never be able to point at another school's folder.
const CLOUD = process.env.CLOUDINARY_CLOUD_NAME
const SCHOOL = "school_abc123"
const OTHER_SCHOOL = "school_xyz789"

const validUrl = (school: string) =>
  `https://res.cloudinary.com/${CLOUD}/image/upload/v1700000000/benwil-school/${school}/student-photos/photo.jpg`

describe("student photo URL trust", { skip: CLOUD ? false : "CLOUDINARY_CLOUD_NAME not configured" }, () => {
  it("accepts a URL in this school's own photo folder", () => {
    assert.equal(isTrustedStudentPhotoUrl(validUrl(SCHOOL), SCHOOL), true)
  })

  it("rejects another school's photo folder", () => {
    assert.equal(isTrustedStudentPhotoUrl(validUrl(OTHER_SCHOOL), SCHOOL), false)
  })

  it("rejects an arbitrary external host", () => {
    assert.equal(
      isTrustedStudentPhotoUrl(`https://evil.example.com/benwil-school/${SCHOOL}/student-photos/x.jpg`, SCHOOL),
      false
    )
  })

  it("rejects a different Cloudinary account", () => {
    assert.equal(
      isTrustedStudentPhotoUrl(
        `https://res.cloudinary.com/someone-else/image/upload/benwil-school/${SCHOOL}/student-photos/x.jpg`,
        SCHOOL
      ),
      false
    )
  })

  it("rejects the documents folder, which allows PDFs", () => {
    assert.equal(
      isTrustedStudentPhotoUrl(
        `https://res.cloudinary.com/${CLOUD}/image/upload/benwil-school/${SCHOOL}/student-documents/x.pdf`,
        SCHOOL
      ),
      false
    )
  })

  it("rejects an empty string", () => {
    assert.equal(isTrustedStudentPhotoUrl("", SCHOOL), false)
  })
})

describe("student photo file validation", () => {
  it("accepts a small JPEG", () => {
    assert.equal(validateStudentPhotoFile({ name: "a.jpg", type: "image/jpeg", size: 500_000 }), null)
  })

  it("rejects a PDF, which is valid for documents but not for a face", () => {
    assert.ok(validateStudentPhotoFile({ name: "a.pdf", type: "application/pdf", size: 500_000 }))
  })

  it("rejects an image over the 2 MB cap", () => {
    assert.ok(validateStudentPhotoFile({ name: "a.png", type: "image/png", size: 3 * 1024 * 1024 }))
  })

  it("rejects an empty file", () => {
    assert.ok(validateStudentPhotoFile({ name: "a.png", type: "image/png", size: 0 }))
  })
})
