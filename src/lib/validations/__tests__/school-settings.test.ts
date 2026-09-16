import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  schoolProfileSchema,
  brandingColorsSchema,
  loginBrandingSchema,
  systemSettingsSchema,
  validateBrandingImage,
} from "../school-settings"

describe("schoolProfileSchema", () => {
  it("accepts a minimal valid profile", () => {
    const result = schoolProfileSchema.safeParse({ schoolName: "Test School" })
    assert.equal(result.success, true)
  })

  it("rejects an empty school name", () => {
    const result = schoolProfileSchema.safeParse({ schoolName: "" })
    assert.equal(result.success, false)
  })

  it("accepts a blank optional email as an empty string", () => {
    const result = schoolProfileSchema.safeParse({ schoolName: "Test School", email: "" })
    assert.equal(result.success, true)
  })

  it("rejects a malformed email", () => {
    const result = schoolProfileSchema.safeParse({ schoolName: "Test School", email: "not-an-email" })
    assert.equal(result.success, false)
  })

  it("rejects a malformed website URL", () => {
    const result = schoolProfileSchema.safeParse({ schoolName: "Test School", website: "not a url" })
    assert.equal(result.success, false)
  })

  it("accepts a valid established year", () => {
    const result = schoolProfileSchema.safeParse({ schoolName: "Test School", establishedYear: "1994" })
    assert.equal(result.success, true)
  })

  it("rejects an established year before 1800", () => {
    const result = schoolProfileSchema.safeParse({ schoolName: "Test School", establishedYear: "1500" })
    assert.equal(result.success, false)
  })

  it("rejects an established year in the future", () => {
    const result = schoolProfileSchema.safeParse({
      schoolName: "Test School",
      establishedYear: String(new Date().getFullYear() + 1),
    })
    assert.equal(result.success, false)
  })
})

describe("brandingColorsSchema (hex color validation)", () => {
  it("accepts a valid 6-digit hex color", () => {
    const result = brandingColorsSchema.safeParse({ primaryColor: "#18315A" })
    assert.equal(result.success, true)
  })

  it("accepts an empty string (no color set)", () => {
    const result = brandingColorsSchema.safeParse({ primaryColor: "" })
    assert.equal(result.success, true)
  })

  it("rejects a 3-digit shorthand hex color", () => {
    const result = brandingColorsSchema.safeParse({ primaryColor: "#FFF" })
    assert.equal(result.success, false)
  })

  it("rejects an rgb() color string", () => {
    const result = brandingColorsSchema.safeParse({ primaryColor: "rgb(24, 49, 90)" })
    assert.equal(result.success, false)
  })

  it("rejects a named CSS color", () => {
    const result = brandingColorsSchema.safeParse({ secondaryColor: "red" })
    assert.equal(result.success, false)
  })

  it("rejects a color missing the # prefix", () => {
    const result = brandingColorsSchema.safeParse({ accentColor: "18315A" })
    assert.equal(result.success, false)
  })

  it("rejects an arbitrary CSS injection attempt", () => {
    const result = brandingColorsSchema.safeParse({ sidebarColor: "javascript:alert(1)" })
    assert.equal(result.success, false)
  })
})

describe("loginBrandingSchema", () => {
  it("accepts all-blank login branding (falls back to defaults)", () => {
    const result = loginBrandingSchema.safeParse({
      loginTitle: "",
      loginSubtitle: "",
      loginDescription: "",
      loginFooterText: "",
    })
    assert.equal(result.success, true)
  })

  it("rejects a login title exceeding the max length", () => {
    const result = loginBrandingSchema.safeParse({ loginTitle: "a".repeat(101) })
    assert.equal(result.success, false)
  })
})

describe("systemSettingsSchema", () => {
  it("accepts a fully blank system settings payload", () => {
    const result = systemSettingsSchema.safeParse({})
    assert.equal(result.success, true)
  })

  it("accepts a valid IANA timezone", () => {
    const result = systemSettingsSchema.safeParse({ timezone: "Asia/Dhaka" })
    assert.equal(result.success, true)
  })

  it("rejects an invalid timezone string", () => {
    const result = systemSettingsSchema.safeParse({ timezone: "Not/A_Real_Zone" })
    assert.equal(result.success, false)
  })

  it("accepts a supported currency code", () => {
    const result = systemSettingsSchema.safeParse({ currency: "BDT" })
    assert.equal(result.success, true)
  })

  it("rejects an unsupported currency code", () => {
    const result = systemSettingsSchema.safeParse({ currency: "XXX" })
    assert.equal(result.success, false)
  })

  it("rejects an unsupported language code", () => {
    const result = systemSettingsSchema.safeParse({ defaultLanguage: "fr" })
    assert.equal(result.success, false)
  })

  it("accepts weekStartsOn within 0-6", () => {
    const result = systemSettingsSchema.safeParse({ weekStartsOn: "6" })
    assert.equal(result.success, true)
  })

  it("rejects weekStartsOn outside 0-6", () => {
    const result = systemSettingsSchema.safeParse({ weekStartsOn: "7" })
    assert.equal(result.success, false)
  })

  it("rejects a pageSize below the minimum", () => {
    const result = systemSettingsSchema.safeParse({ pageSize: "1" })
    assert.equal(result.success, false)
  })

  it("rejects a pageSize above the maximum", () => {
    const result = systemSettingsSchema.safeParse({ pageSize: "500" })
    assert.equal(result.success, false)
  })

  it("rejects a working day outside 0-6", () => {
    const result = systemSettingsSchema.safeParse({ workingDays: [0, 1, 9] })
    assert.equal(result.success, false)
  })
})

describe("validateBrandingImage", () => {
  it("accepts a valid logo image within size limits", () => {
    const error = validateBrandingImage("logo", { type: "image/png", size: 1024 * 1024 })
    assert.equal(error, null)
  })

  it("rejects an unsupported mime type", () => {
    const error = validateBrandingImage("logo", { type: "image/svg+xml", size: 1024 })
    assert.equal(error, "unsupportedType")
  })

  it("rejects a logo image exceeding the size limit", () => {
    const error = validateBrandingImage("logo", { type: "image/png", size: 3 * 1024 * 1024 })
    assert.equal(error, "tooLarge")
  })

  it("rejects an executable disguised with an image mime type but zero size", () => {
    const error = validateBrandingImage("favicon", { type: "image/png", size: 0 })
    assert.equal(error, "invalid")
  })

  it("applies a smaller size limit to favicons than logos", () => {
    const error = validateBrandingImage("favicon", { type: "image/png", size: 1024 * 1024 })
    assert.equal(error, "tooLarge")
  })
})
