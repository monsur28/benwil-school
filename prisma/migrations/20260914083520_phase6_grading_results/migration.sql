-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('DRAFT', 'FINALIZED');

-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "resultStatus" "ResultStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "resultStatusChangedAt" TIMESTAMP(3),
ADD COLUMN     "resultStatusChangedById" TEXT;

-- CreateTable
CREATE TABLE "grading_scales" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameBn" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_rules" (
    "id" TEXT NOT NULL,
    "gradingScaleId" TEXT NOT NULL,
    "minPercentage" DECIMAL(5,2) NOT NULL,
    "maxPercentage" DECIMAL(5,2) NOT NULL,
    "grade" TEXT NOT NULL,
    "gradeBn" TEXT,
    "gradePoint" DECIMAL(3,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grading_scales_schoolId_idx" ON "grading_scales"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "grading_scales_schoolId_name_key" ON "grading_scales"("schoolId", "name");

-- CreateIndex
CREATE INDEX "grade_rules_gradingScaleId_idx" ON "grade_rules"("gradingScaleId");

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_resultStatusChangedById_fkey" FOREIGN KEY ("resultStatusChangedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grading_scales" ADD CONSTRAINT "grading_scales_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_rules" ADD CONSTRAINT "grade_rules_gradingScaleId_fkey" FOREIGN KEY ("gradingScaleId") REFERENCES "grading_scales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
