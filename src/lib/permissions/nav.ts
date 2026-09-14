import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Users,
  Users2,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Wallet,
  NotebookPen,
  Megaphone,
  Library,
  Bus,
  BarChart3,
  Settings,
  Award,
  SlidersHorizontal,
} from "lucide-react"
import { Role } from "@prisma/client"

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]
const ALL_ROLES = Object.values(Role)

export type NavItem = {
  href: string
  labelKey: string
  icon: LucideIcon
  roles: Role[]
}

// One nav definition for every role. Pages are filtered from this list
// rather than maintaining a separate sidebar per role.
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
  { href: "/students", labelKey: "nav.students", icon: Users, roles: [...ADMIN_ROLES, Role.TEACHER, Role.ACCOUNTANT, Role.LIBRARIAN, Role.HR] },
  { href: "/teachers", labelKey: "nav.teachersStaff", icon: Users2, roles: [...ADMIN_ROLES, Role.HR] },
  { href: "/academics", labelKey: "nav.academic", icon: BookOpen, roles: ADMIN_ROLES },
  { href: "/attendance", labelKey: "nav.attendance", icon: ClipboardCheck, roles: [...ADMIN_ROLES, Role.TEACHER] },
  { href: "/exams", labelKey: "nav.examsResults", icon: GraduationCap, roles: [...ADMIN_ROLES, Role.TEACHER] },
  { href: "/exams/types", labelKey: "exams.subnav.types", icon: GraduationCap, roles: ADMIN_ROLES },
  { href: "/results", labelKey: "results.subnav.results", icon: Award, roles: [...ADMIN_ROLES, Role.TEACHER] },
  { href: "/results/grading", labelKey: "results.subnav.grading", icon: SlidersHorizontal, roles: ADMIN_ROLES },
  { href: "/fees", labelKey: "nav.fees", icon: Wallet, roles: [...ADMIN_ROLES, Role.ACCOUNTANT, Role.STUDENT, Role.GUARDIAN] },
  { href: "/homework", labelKey: "nav.homework", icon: NotebookPen, roles: [...ADMIN_ROLES, Role.TEACHER, Role.STUDENT, Role.GUARDIAN] },
  { href: "/notices", labelKey: "nav.notices", icon: Megaphone, roles: ALL_ROLES },
  { href: "/library", labelKey: "nav.library", icon: Library, roles: [...ADMIN_ROLES, Role.LIBRARIAN, Role.STUDENT, Role.GUARDIAN] },
  { href: "/transport", labelKey: "nav.transport", icon: Bus, roles: [...ADMIN_ROLES, Role.STUDENT, Role.GUARDIAN] },
  { href: "/reports", labelKey: "nav.reports", icon: BarChart3, roles: [...ADMIN_ROLES, Role.HR, Role.ACCOUNTANT] },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, roles: [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN] },
]

export function getNavForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

// Lets placeholder pages reuse the exact same role list their nav entry
// uses, instead of duplicating it in every page.tsx.
export function getRolesForHref(href: string): Role[] {
  const item = NAV_ITEMS.find((navItem) => navItem.href === href)
  return item?.roles ?? []
}
