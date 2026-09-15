-- CreateEnum
CREATE TYPE "HomeworkSubmissionStatus" AS ENUM ('SUBMITTED', 'REVIEWED');

-- AlterTable
ALTER TABLE "homeworks" ADD COLUMN     "maxMarks" INTEGER;

-- CreateTable
CREATE TABLE "homework_submissions" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "content" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "status" "HomeworkSubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "marks" DECIMAL(5,2),
    "grade" TEXT,
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "homework_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "homework_submissions_schoolId_idx" ON "homework_submissions"("schoolId");

-- CreateIndex
CREATE INDEX "homework_submissions_homeworkId_idx" ON "homework_submissions"("homeworkId");

-- CreateIndex
CREATE INDEX "homework_submissions_studentId_idx" ON "homework_submissions"("studentId");

-- CreateIndex
CREATE INDEX "homework_submissions_status_idx" ON "homework_submissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "homework_submissions_schoolId_homeworkId_studentId_key" ON "homework_submissions"("schoolId", "homeworkId", "studentId");

-- AddForeignKey
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "homeworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
