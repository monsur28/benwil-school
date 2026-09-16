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
const FEE_STAFF_ROLES = [...ADMIN_ROLES, Role.ACCOUNTANT]
// Full notice management (create/edit/publish/archive/categories) is
// admin-tier only - students/guardians read notices through their own
// portal routes instead of this admin page, and no other staff role
// manages notices in this phase (see src/lib/notices/notice-access.ts).
const NOTICE_ADMIN_ROLES = ADMIN_ROLES
// Homework management (create/edit/publish) is admin-tier or the assigned
// teacher - students/guardians read homework through their own portal
// routes instead of this admin page (see src/lib/homework/homework-access.ts).
const HOMEWORK_MANAGE_ROLES = [...ADMIN_ROLES, Role.TEACHER]

export type NavItem = {
  href: string
  labelKey: string
  icon: LucideIcon
  roles: Role[]
}

export type NavGroup = {
  titleKey: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    titleKey: "nav.groups.overview",
    items: [
      { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
    ],
  },
  {
    titleKey: "nav.groups.people",
    items: [
      { href: "/students", labelKey: "nav.students", icon: Users, roles: [...ADMIN_ROLES, Role.TEACHER, Role.ACCOUNTANT, Role.LIBRARIAN, Role.HR] },
      { href: "/teachers", labelKey: "nav.teachersStaff", icon: Users2, roles: [...ADMIN_ROLES, Role.HR] },
    ],
  },
  {
    titleKey: "nav.groups.academics",
    items: [
      { href: "/academics", labelKey: "nav.academic", icon: BookOpen, roles: ADMIN_ROLES },
      { href: "/attendance", labelKey: "nav.attendance", icon: ClipboardCheck, roles: [...ADMIN_ROLES, Role.TEACHER] },
      { href: "/exams", labelKey: "nav.examsResults", icon: GraduationCap, roles: [...ADMIN_ROLES, Role.TEACHER] },
      { href: "/results", labelKey: "results.subnav.results", icon: Award, roles: [...ADMIN_ROLES, Role.TEACHER] },
      { href: "/results/grading", labelKey: "results.subnav.grading", icon: SlidersHorizontal, roles: ADMIN_ROLES },
    ],
  },
  {
    titleKey: "nav.groups.finance",
    items: [
      { href: "/fees", labelKey: "nav.fees", icon: Wallet, roles: [...FEE_STAFF_ROLES, Role.STUDENT, Role.GUARDIAN] },
      { href: "/fees/structures", labelKey: "fees.subnav.structures", icon: Wallet, roles: FEE_STAFF_ROLES },
      { href: "/fees/student", labelKey: "fees.subnav.student", icon: Wallet, roles: FEE_STAFF_ROLES },
      { href: "/fees/payments", labelKey: "fees.subnav.payments", icon: Wallet, roles: FEE_STAFF_ROLES },
      { href: "/fees/reports/outstanding", labelKey: "fees.subnav.outstanding", icon: BarChart3, roles: FEE_STAFF_ROLES },
    ],
  },
  {
    titleKey: "nav.groups.communication",
    items: [
      { href: "/notices", labelKey: "nav.notices", icon: Megaphone, roles: NOTICE_ADMIN_ROLES },
      { href: "/homework", labelKey: "nav.homework", icon: NotebookPen, roles: HOMEWORK_MANAGE_ROLES },
    ],
  },
  {
    titleKey: "nav.groups.resources",
    items: [
      { href: "/library", labelKey: "nav.library", icon: Library, roles: [...ADMIN_ROLES, Role.LIBRARIAN, Role.STUDENT, Role.GUARDIAN] },
      { href: "/transport", labelKey: "nav.transport", icon: Bus, roles: [...ADMIN_ROLES, Role.STUDENT, Role.GUARDIAN] },
    ],
  },
  {
    titleKey: "nav.groups.insights",
    items: [
      { href: "/reports", labelKey: "nav.reports", icon: BarChart3, roles: [...ADMIN_ROLES, Role.HR, Role.ACCOUNTANT] },
    ],
  },
  {
    titleKey: "nav.groups.system",
    items: [
      { href: "/settings", labelKey: "nav.settings", icon: Settings, roles: [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL] },
    ],
  },
]

// Standalone sub-routes that aren't top-level nav items but need permission lookups
const ADDITIONAL_ROLE_ROUTES: NavItem[] = [
  { href: "/exams/types", labelKey: "exams.subnav.types", icon: GraduationCap, roles: ADMIN_ROLES },
  { href: "/fees/categories", labelKey: "fees.subnav.categories", icon: Wallet, roles: ADMIN_ROLES },
  { href: "/fees/reports/collections", labelKey: "fees.subnav.collections", icon: BarChart3, roles: FEE_STAFF_ROLES },
  { href: "/notices/categories", labelKey: "notices.subnav.categories", icon: Megaphone, roles: NOTICE_ADMIN_ROLES },
  { href: "/homework/categories", labelKey: "homework.subnav.categories", icon: NotebookPen, roles: ADMIN_ROLES },
]

export const NAV_ITEMS: NavItem[] = [
  ...NAV_GROUPS.flatMap((group) => group.items),
  ...ADDITIONAL_ROLE_ROUTES,
]

export function getNavForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

export function getGroupedNavForRole(role: Role): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    titleKey: group.titleKey,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0)
}

// Lets placeholder pages reuse the exact same role list their nav entry
// uses, instead of duplicating it in every page.tsx.
export function getRolesForHref(href: string): Role[] {
  const item = NAV_ITEMS.find((navItem) => navItem.href === href)
  return item?.roles ?? []
}
