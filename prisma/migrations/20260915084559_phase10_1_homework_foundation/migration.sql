-- CreateEnum
CREATE TYPE "HomeworkStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "homework_categories" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homework_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homeworks" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "assignedDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" "HomeworkStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homeworks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "homework_categories_schoolId_idx" ON "homework_categories"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "homework_categories_schoolId_name_key" ON "homework_categories"("schoolId", "name");

-- CreateIndex
CREATE INDEX "homeworks_schoolId_idx" ON "homeworks"("schoolId");

-- CreateIndex
CREATE INDEX "homeworks_academicYearId_idx" ON "homeworks"("academicYearId");

-- CreateIndex
CREATE INDEX "homeworks_teacherId_idx" ON "homeworks"("teacherId");

-- CreateIndex
CREATE INDEX "homeworks_subjectId_idx" ON "homeworks"("subjectId");

-- CreateIndex
CREATE INDEX "homeworks_classId_idx" ON "homeworks"("classId");

-- CreateIndex
CREATE INDEX "homeworks_sectionId_idx" ON "homeworks"("sectionId");

-- CreateIndex
CREATE INDEX "homeworks_status_idx" ON "homeworks"("status");

-- CreateIndex
CREATE INDEX "homeworks_dueDate_idx" ON "homeworks"("dueDate");

-- AddForeignKey
ALTER TABLE "homework_categories" ADD CONSTRAINT "homework_categories_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "homework_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
