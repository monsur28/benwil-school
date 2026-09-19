-- Homework -> Term Exam integration.
-- Both columns are nullable and default to NULL, so every existing
-- ExamSchedule/ExamMark row is unaffected until an admin explicitly sets
-- homeworkMaxMarks on a schedule.

-- ExamSchedule: the portion of fullMarks sourced from reviewed homework for
-- this subject+class+academic year, instead of typed directly as an exam mark.
ALTER TABLE "exam_schedules" ADD COLUMN "homeworkMaxMarks" INTEGER;

-- ExamMark: the homework contribution frozen at finalization time, so a
-- later homework mark edit never silently changes an already-finalized result.
ALTER TABLE "exam_marks" ADD COLUMN "homeworkMarks" DECIMAL(5,2);
