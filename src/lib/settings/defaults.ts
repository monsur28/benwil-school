// Phase 13 application defaults (spec §37). The single place every settings
// getter falls back to when a school has no SchoolSettings row yet, or a
// specific field on that row is null - so no page ever needs its own
// "what if settings is null" fallback logic.
export const SETTINGS_DEFAULTS = {
  schoolName: "School Management System",
  logoUrl: null as string | null,
  faviconUrl: null as string | null,
  primaryColor: "#18315a",
  secondaryColor: "#bb1f23",
  sidebarColor: null as string | null,
  loginLogoUrl: null as string | null,
  loginBackgroundUrl: null as string | null,
  loginTitle: "Welcome Back",
  loginSubtitle: "Sign in to continue to your account",
  loginDescription: "Access your school management portal.",
  loginFooterText: null as string | null,
  defaultLanguage: "en",
  timezone: "Asia/Dhaka",
  currency: "BDT",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12h",
  weekStartsOn: 6, // Saturday - the conventional week start in Bangladesh
  pageSize: 20,
} as const
