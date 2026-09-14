import { Role } from "@prisma/client"

// Deliberately free of "server-only"/"next/headers": this is imported both
// by Server Actions/Components and by proxy.ts, which runs in its own
// bundle and must not pull in render-only modules (same constraint as
// lib/auth/session-config.ts).
export function portalHomeForRole(role: Role): string {
  if (role === Role.STUDENT) return "/portal/student"
  if (role === Role.GUARDIAN) return "/portal/guardian"
  return "/dashboard"
}
