import "server-only"
import { Role } from "@prisma/client"

// Full notice management (create/edit/publish/archive/categories) is
// admin-tier only per spec: no role below Principal manages notices in this
// phase, including Teacher.
export const NOTICE_ADMIN_ROLES: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]
