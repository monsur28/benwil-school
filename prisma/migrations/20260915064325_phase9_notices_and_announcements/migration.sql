-- CreateEnum
CREATE TYPE "NoticeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NoticeAudienceType" AS ENUM ('ALL', 'STUDENTS', 'GUARDIANS', 'CLASS', 'SECTION');

-- CreateTable
CREATE TABLE "notice_categories" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameBn" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notice_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleBn" TEXT,
    "content" TEXT NOT NULL,
    "contentBn" TEXT,
    "status" "NoticeStatus" NOT NULL DEFAULT 'DRAFT',
    "audienceType" "NoticeAudienceType" NOT NULL,
    "classId" TEXT,
    "sectionId" TEXT,
    "publishAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notice_categories_schoolId_idx" ON "notice_categories"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "notice_categories_schoolId_name_key" ON "notice_categories"("schoolId", "name");

-- CreateIndex
CREATE INDEX "notices_schoolId_idx" ON "notices"("schoolId");

-- CreateIndex
CREATE INDEX "notices_schoolId_status_publishAt_idx" ON "notices"("schoolId", "status", "publishAt");

-- CreateIndex
CREATE INDEX "notices_categoryId_idx" ON "notices"("categoryId");

-- CreateIndex
CREATE INDEX "notices_classId_idx" ON "notices"("classId");

-- CreateIndex
CREATE INDEX "notices_sectionId_idx" ON "notices"("sectionId");

-- AddForeignKey
ALTER TABLE "notice_categories" ADD CONSTRAINT "notice_categories_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "notice_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
