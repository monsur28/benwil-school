-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_studentId_fkey";

-- DropForeignKey
ALTER TABLE "exam_marks" DROP CONSTRAINT "exam_marks_studentId_fkey";

-- DropForeignKey
ALTER TABLE "student_documents" DROP CONSTRAINT "student_documents_studentId_fkey";

-- DropForeignKey
ALTER TABLE "student_guardians" DROP CONSTRAINT "student_guardians_studentId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lockedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "firstAttempt" TIMESTAMP(3) NOT NULL,
    "lastAttempt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "attendances_markedById_idx" ON "attendances"("markedById");

-- CreateIndex
CREATE INDEX "payments_receivedById_idx" ON "payments"("receivedById");

-- CreateIndex
CREATE INDEX "payments_voidedById_idx" ON "payments"("voidedById");

-- CreateIndex
CREATE INDEX "students_academicYearId_idx" ON "students"("academicYearId");

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
