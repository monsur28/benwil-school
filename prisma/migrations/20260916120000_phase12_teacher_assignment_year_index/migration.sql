-- Phase 12: index the lookup shape used by teacher academic-year
-- authorization (getTeacherAssignmentTriples, getTeacherClassSectionPairs,
-- teacher dashboard "My Classes") which filters by teacherId first, then
-- optionally narrows by academicYearId. No existing index on
-- teacher_assignments has teacherId as a leading column.
CREATE INDEX "teacher_assignments_teacherId_academicYearId_idx" ON "teacher_assignments"("teacherId", "academicYearId");
