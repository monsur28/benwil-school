import "dotenv/config"
import { before, after, describe, it } from "node:test"
import assert from "node:assert/strict"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { getSchoolIdentity, getSystemSettings } from "../school-settings"
import { SETTINGS_DEFAULTS } from "../defaults"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// Each scenario gets its own throwaway School row (never the shared seeded
// school) so getSchoolIdentity()/getSystemSettings()'s React cache() -
// memoized per distinct schoolId argument, but never invalidated within this
// process - can never serve stale data across scenarios.
const RUN_PREFIX = `UnitTest SchoolSettings ${Date.now()}`

let schoolWithNoRowId: string
let schoolWithNullNameId: string
let schoolWithOverrideId: string
let schoolAId: string
let schoolBId: string

describe("school settings service (DB-backed)", () => {
  before(async () => {
    const schoolWithNoRow = await prisma.school.create({ data: { name: `${RUN_PREFIX} No Settings Row` } })
    schoolWithNoRowId = schoolWithNoRow.id

    const schoolWithNullName = await prisma.school.create({ data: { name: `${RUN_PREFIX} Fallback Name` } })
    schoolWithNullNameId = schoolWithNullName.id
    await prisma.schoolSettings.create({
      data: { schoolId: schoolWithNullNameId, schoolName: null, primaryColor: "#123456" },
    })

    const schoolWithOverride = await prisma.school.create({ data: { name: `${RUN_PREFIX} Real Name Ignored` } })
    schoolWithOverrideId = schoolWithOverride.id
    await prisma.schoolSettings.create({
      data: { schoolId: schoolWithOverrideId, schoolName: `${RUN_PREFIX} Override Name` },
    })

    const schoolA = await prisma.school.create({ data: { name: `${RUN_PREFIX} School A` } })
    schoolAId = schoolA.id
    await prisma.schoolSettings.create({
      data: {
        schoolId: schoolAId,
        schoolName: `${RUN_PREFIX} School A Name`,
        principalName: `${RUN_PREFIX} Principal A`,
        primaryColor: "#111111",
        timezone: "Asia/Dhaka",
      },
    })

    const schoolB = await prisma.school.create({ data: { name: `${RUN_PREFIX} School B` } })
    schoolBId = schoolB.id
    await prisma.schoolSettings.create({
      data: {
        schoolId: schoolBId,
        schoolName: `${RUN_PREFIX} School B Name`,
        principalName: `${RUN_PREFIX} Principal B`,
        primaryColor: "#222222",
        timezone: "America/New_York",
      },
    })
  })

  after(async () => {
    const schoolIds = [schoolWithNoRowId, schoolWithNullNameId, schoolWithOverrideId, schoolAId, schoolBId]
    await prisma.schoolSettings.deleteMany({ where: { schoolId: { in: schoolIds } } })
    await prisma.school.deleteMany({ where: { id: { in: schoolIds } } })
    await prisma.$disconnect()
  })

  describe("fallback behavior", () => {
    it("falls back to application defaults when no SchoolSettings row exists", async () => {
      const identity = await getSchoolIdentity(schoolWithNoRowId)
      // School.name always exists, so schoolName falls back to that (not the
      // app default) - but every branding/contact field with no backing row
      // must be null, and system settings must use the app defaults.
      assert.equal(identity.logoUrl, null)
      assert.equal(identity.principalName, null)
      assert.equal(identity.establishedYear, null)

      const system = await getSystemSettings(schoolWithNoRowId)
      assert.equal(system.timezone, SETTINGS_DEFAULTS.timezone)
      assert.equal(system.currency, SETTINGS_DEFAULTS.currency)
      assert.equal(system.dateFormat, SETTINGS_DEFAULTS.dateFormat)
      assert.equal(system.timeFormat, SETTINGS_DEFAULTS.timeFormat)
      assert.equal(system.weekStartsOn, SETTINGS_DEFAULTS.weekStartsOn)
    })

    it("falls back to School.name when settings.schoolName is null", async () => {
      const identity = await getSchoolIdentity(schoolWithNullNameId)
      assert.equal(identity.schoolName, `${RUN_PREFIX} Fallback Name`)
    })

    it("uses settings.schoolName over School.name when explicitly set", async () => {
      const identity = await getSchoolIdentity(schoolWithOverrideId)
      assert.equal(identity.schoolName, `${RUN_PREFIX} Override Name`)
    })
  })

  describe("school isolation", () => {
    it("never returns another school's identity fields", async () => {
      const identityA = await getSchoolIdentity(schoolAId)
      const identityB = await getSchoolIdentity(schoolBId)

      assert.equal(identityA.schoolName, `${RUN_PREFIX} School A Name`)
      assert.equal(identityA.principalName, `${RUN_PREFIX} Principal A`)
      assert.equal(identityB.schoolName, `${RUN_PREFIX} School B Name`)
      assert.equal(identityB.principalName, `${RUN_PREFIX} Principal B`)

      assert.notEqual(identityA.schoolName, identityB.schoolName)
      assert.notEqual(identityA.principalName, identityB.principalName)
    })

    it("never returns another school's system settings", async () => {
      const systemA = await getSystemSettings(schoolAId)
      const systemB = await getSystemSettings(schoolBId)

      assert.equal(systemA.timezone, "Asia/Dhaka")
      assert.equal(systemB.timezone, "America/New_York")
    })
  })
})
