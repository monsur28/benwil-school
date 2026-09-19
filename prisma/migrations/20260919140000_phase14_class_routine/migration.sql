-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY');

-- CreateTable
CREATE TABLE "routine_entries" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routine_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "routine_entries_schoolId_idx" ON "routine_entries"("schoolId");

-- CreateIndex
CREATE INDEX "routine_entries_academicYearId_idx" ON "routine_entries"("academicYearId");

-- CreateIndex
CREATE INDEX "routine_entries_classId_sectionId_idx" ON "routine_entries"("classId", "sectionId");

-- CreateIndex
CREATE INDEX "routine_entries_teacherId_dayOfWeek_periodNumber_idx" ON "routine_entries"("teacherId", "dayOfWeek", "periodNumber");

-- CreateIndex
CREATE INDEX "routine_entries_dayOfWeek_idx" ON "routine_entries"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "routine_entries_schoolId_academicYearId_classId_sectionId_d_key" ON "routine_entries"("schoolId", "academicYearId", "classId", "sectionId", "dayOfWeek", "periodNumber");

-- AddForeignKey
ALTER TABLE "routine_entries" ADD CONSTRAINT "routine_entries_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_entries" ADD CONSTRAINT "routine_entries_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_entries" ADD CONSTRAINT "routine_entries_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_entries" ADD CONSTRAINT "routine_entries_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_entries" ADD CONSTRAINT "routine_entries_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_entries" ADD CONSTRAINT "routine_entries_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
