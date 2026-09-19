-- Adds the Bangla counterpart to SchoolSettings.schoolName, shown instead
-- of it wherever branding is displayed and the active locale is "bn".
-- Nullable and defaults to NULL, so every existing SchoolSettings row is
-- unaffected until an admin explicitly sets it.
ALTER TABLE "school_settings" ADD COLUMN "schoolNameBangla" TEXT;
