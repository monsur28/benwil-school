-- Phase 14: Teacher management form + data UX.
--
-- Adds the personal/professional profile fields the improved Add/Edit
-- Teacher form needs (gender, date of birth, years of experience), and
-- restores the school-scoped uniqueness on employeeId that phase11 intended
-- (its migration is recorded as applied, but the index is absent from the
-- live database - written IF NOT EXISTS/idempotently, as with every other
-- migration in this project, so this is safe to run regardless).

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "gender" "Gender",
  ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "experience" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_schoolId_employeeId_key" ON "users"("schoolId", "employeeId");
