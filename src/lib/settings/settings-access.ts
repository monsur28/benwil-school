import "server-only"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"

// Settings management follows the same admin tier already used for teacher
// assignments and result finalization (see CAN_MANAGE in
// src/actions/academics/teacher-assignments.ts and RESULT_ADMIN_ROLES) -
// PRINCIPAL is treated as an admin here too, not just SUPER_ADMIN/SCHOOL_ADMIN.
export const SETTINGS_ADMIN_ROLES: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export async function requireSettingsAccess() {
  return requireRole(...SETTINGS_ADMIN_ROLES)
}
