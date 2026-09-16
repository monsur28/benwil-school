ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "employeeId" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "address" TEXT,
  ADD COLUMN IF NOT EXISTS "designation" TEXT,
  ADD COLUMN IF NOT EXISTS "department" TEXT,
  ADD COLUMN IF NOT EXISTS "joiningDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "employmentType" TEXT,
  ADD COLUMN IF NOT EXISTS "qualifications" TEXT,
  ADD COLUMN IF NOT EXISTS "specialization" TEXT;

CREATE INDEX IF NOT EXISTS "users_schoolId_role_isActive_idx" ON "users"("schoolId", "role", "isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "users_schoolId_employeeId_key" ON "users"("schoolId", "employeeId");

ALTER TABLE "teacher_assignments"
  ADD COLUMN IF NOT EXISTS "academicYearId" TEXT,
  ADD COLUMN IF NOT EXISTS "isClassTeacher" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "teacher_assignments" DROP CONSTRAINT IF EXISTS "teacher_assignments_teacherId_classId_sectionId_subjectId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "teacher_assignments_schoolId_academicYearId_teacherId_classId_sectionId_subjectId_key"
  ON "teacher_assignments"("schoolId", "academicYearId", "teacherId", "classId", "sectionId", "subjectId");
CREATE INDEX IF NOT EXISTS "teacher_assignments_academicYearId_idx" ON "teacher_assignments"("academicYearId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teacher_assignments_academicYearId_fkey'
  ) THEN
    ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_academicYearId_fkey"
      FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
