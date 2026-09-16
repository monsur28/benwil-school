-- Phase 13: single source of truth for school identity, branding, and
-- system defaults. Additive only - one nullable-everything row per school.
CREATE TABLE "school_settings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "schoolName" TEXT,
    "shortName" TEXT,
    "schoolCode" TEXT,
    "motto" TEXT,
    "description" TEXT,
    "establishedYear" INTEGER,
    "principalName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "loginLogoUrl" TEXT,
    "loginBackgroundUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "sidebarColor" TEXT,
    "loginTitle" TEXT,
    "loginSubtitle" TEXT,
    "loginDescription" TEXT,
    "loginFooterText" TEXT,
    "defaultLanguage" TEXT,
    "timezone" TEXT,
    "currency" TEXT,
    "dateFormat" TEXT,
    "timeFormat" TEXT,
    "weekStartsOn" INTEGER,
    "workingDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "pageSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "school_settings_schoolId_key" ON "school_settings"("schoolId");

ALTER TABLE "school_settings" ADD CONSTRAINT "school_settings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
