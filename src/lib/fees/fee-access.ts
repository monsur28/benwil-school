import "server-only"
import { Role } from "@prisma/client"

// Category management and voiding a payment are admin-tier only (spec:
// Accountant may not manage fee categories, and "cannot void completed
// payments unless existing permissions explicitly allow it").
export const FEE_ADMIN_ROLES: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

// Day-to-day fee work (structures, assigning charges, collecting payments,
// printing receipts, viewing reports) additionally includes the
// Accountant role.
export const FEE_STAFF_ROLES: Role[] = [...FEE_ADMIN_ROLES, Role.ACCOUNTANT]
