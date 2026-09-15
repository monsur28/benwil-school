-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "gradingScaleName" TEXT,
ADD COLUMN     "gradingRulesSnapshot" JSONB;
