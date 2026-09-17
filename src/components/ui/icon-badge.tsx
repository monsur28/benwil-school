import type { ComponentType, SVGProps, ReactNode } from "react"
import {
  type LucideIcon,
  ClipboardCheck,
  NotebookPen,
  FileText,
  Target,
  WalletCards,
  Wallet,
  UserPlus,
  Users,
  GraduationCap,
  Megaphone,
  Radio,
  CalendarDays,
  HeartPulse,
  ScrollText,
  BookOpen,
  Award,
  AlertTriangle,
  Info,
  CheckCircle2,
  Settings,
} from "lucide-react"
import { cn } from "cn"

export type IconBadgeTone =
  | "blue"
  | "rose"
  | "pink"
  | "green"
  | "emerald"
  | "orange"
  | "amber"
  | "violet"
  | "purple"
  | "sky"
  | "brand"
  | "muted"

export type IconBadgeVariant = "solid" | "soft" | "outline"
export type IconBadgeSize = "xs" | "sm" | "md" | "lg" | "xl"
export type IconBadgeShape = "squircle" | "circle" | "rounded"

export type IconBadgeName =
  | "attendance"
  | "check"
  | "verify"
  | "homework"
  | "notebook"
  | "assignment"
  | "document"
  | "file"
  | "report"
  | "results"
  | "target"
  | "grade"
  | "fees"
  | "payment"
  | "wallet"
  | "student"
  | "admission"
  | "students"
  | "class"
  | "users"
  | "teacher"
  | "academic"
  | "grad"
  | "notice"
  | "broadcast"
  | "activity"
  | "live"
  | "calendar"
  | "schedule"
  | "event"
  | "health"
  | "status"
  | "exam"
  | "assessment"
  | "book"
  | "library"
  | "award"
  | "trophy"
  | "warning"
  | "alert"
  | "info"
  | "settings"

/**
 * Vibrant solid squircle color map matching Photo 2:
 * - Blue: #1d68f6 (vibrant cobalt blue)
 * - Rose/Pink: #fb2c67 (vibrant punch rose)
 * - Green/Emerald: #009e60 (vibrant emerald)
 * - Orange/Amber: #ff9500 (vibrant warm orange)
 * - Purple/Violet: #7c3aed (vibrant violet)
 * - Sky: #0284c7 (vibrant cerulean)
 * - Brand: deep navy slate
 * - Muted: slate 600
 */
export const SOLID_TONES: Record<IconBadgeTone, string> = {
  blue: "bg-[#1d68f6] text-white shadow-xs shadow-blue-500/25",
  rose: "bg-[#fb2c67] text-white shadow-xs shadow-rose-500/25",
  pink: "bg-[#fb2c67] text-white shadow-xs shadow-rose-500/25",
  green: "bg-[#009e60] text-white shadow-xs shadow-emerald-500/25",
  emerald: "bg-[#009e60] text-white shadow-xs shadow-emerald-500/25",
  orange: "bg-[#ff9500] text-white shadow-xs shadow-amber-500/25",
  amber: "bg-[#ff9500] text-white shadow-xs shadow-amber-500/25",
  purple: "bg-[#7c3aed] text-white shadow-xs shadow-purple-500/25",
  violet: "bg-[#7c3aed] text-white shadow-xs shadow-purple-500/25",
  sky: "bg-[#0284c7] text-white shadow-xs shadow-sky-500/25",
  brand: "bg-brand-navy text-white shadow-xs shadow-slate-900/20",
  muted: "bg-slate-600 text-white shadow-xs shadow-slate-500/20",
}

/**
 * Soft pastel tinted style matching Photo 1:
 * Light background with colored icon glyph for subtle contexts.
 */
export const SOFT_TONES: Record<IconBadgeTone, string> = {
  blue: "bg-blue-50 text-[#1d68f6] border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40",
  rose: "bg-rose-50 text-[#fb2c67] border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40",
  pink: "bg-rose-50 text-[#fb2c67] border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40",
  green: "bg-emerald-50 text-[#009e60] border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40",
  emerald: "bg-emerald-50 text-[#009e60] border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40",
  orange: "bg-amber-50 text-[#ff9500] border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40",
  amber: "bg-amber-50 text-[#ff9500] border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40",
  purple: "bg-purple-50 text-[#7c3aed] border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40",
  violet: "bg-purple-50 text-[#7c3aed] border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40",
  sky: "bg-sky-50 text-[#0284c7] border border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/40",
  brand: "bg-slate-100 text-brand-navy border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700",
  muted: "bg-slate-100 text-slate-600 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
}

/**
 * Outline style with transparent background and colored border/glyph.
 */
export const OUTLINE_TONES: Record<IconBadgeTone, string> = {
  blue: "border border-[#1d68f6] text-[#1d68f6] bg-transparent",
  rose: "border border-[#fb2c67] text-[#fb2c67] bg-transparent",
  pink: "border border-[#fb2c67] text-[#fb2c67] bg-transparent",
  green: "border border-[#009e60] text-[#009e60] bg-transparent",
  emerald: "border border-[#009e60] text-[#009e60] bg-transparent",
  orange: "border border-[#ff9500] text-[#ff9500] bg-transparent",
  amber: "border border-[#ff9500] text-[#ff9500] bg-transparent",
  purple: "border border-[#7c3aed] text-[#7c3aed] bg-transparent",
  violet: "border border-[#7c3aed] text-[#7c3aed] bg-transparent",
  sky: "border border-[#0284c7] text-[#0284c7] bg-transparent",
  brand: "border border-brand-navy text-brand-navy bg-transparent",
  muted: "border border-slate-400 text-slate-500 bg-transparent",
}

// Backwards compatibility
export const ICON_BADGE_TONES = SOLID_TONES

export const ICON_BADGE_SIZES: Record<
  IconBadgeSize,
  { badge: string; squircle: string; icon: string }
> = {
  xs: { badge: "size-6", squircle: "rounded-[8px]", icon: "size-3.5" },
  sm: { badge: "size-8", squircle: "rounded-[11px]", icon: "size-4" },
  md: { badge: "size-10", squircle: "rounded-[14px]", icon: "size-5" },
  lg: { badge: "size-11", squircle: "rounded-[16px]", icon: "size-[22px]" },
  xl: { badge: "size-12", squircle: "rounded-[18px]", icon: "size-6" },
}

/**
 * Centralized semantic presets mapping functional concepts directly to their
 * standard Lucide icon and brand-calibrated tone.
 */
export const ICON_PRESETS: Record<IconBadgeName, { icon: LucideIcon; tone: IconBadgeTone }> = {
  attendance: { icon: ClipboardCheck, tone: "blue" },
  check: { icon: CheckCircle2, tone: "green" },
  verify: { icon: CheckCircle2, tone: "green" },
  homework: { icon: NotebookPen, tone: "rose" },
  notebook: { icon: NotebookPen, tone: "rose" },
  assignment: { icon: NotebookPen, tone: "rose" },
  document: { icon: FileText, tone: "blue" },
  file: { icon: FileText, tone: "blue" },
  report: { icon: FileText, tone: "blue" },
  results: { icon: Target, tone: "green" },
  target: { icon: Target, tone: "green" },
  grade: { icon: Target, tone: "green" },
  fees: { icon: WalletCards, tone: "orange" },
  payment: { icon: WalletCards, tone: "orange" },
  wallet: { icon: Wallet, tone: "orange" },
  student: { icon: UserPlus, tone: "purple" },
  admission: { icon: UserPlus, tone: "purple" },
  students: { icon: Users, tone: "purple" },
  class: { icon: Users, tone: "purple" },
  users: { icon: Users, tone: "purple" },
  teacher: { icon: GraduationCap, tone: "blue" },
  academic: { icon: GraduationCap, tone: "blue" },
  grad: { icon: GraduationCap, tone: "blue" },
  notice: { icon: Megaphone, tone: "rose" },
  broadcast: { icon: Megaphone, tone: "rose" },
  activity: { icon: Radio, tone: "rose" },
  live: { icon: Radio, tone: "rose" },
  calendar: { icon: CalendarDays, tone: "purple" },
  schedule: { icon: CalendarDays, tone: "purple" },
  event: { icon: CalendarDays, tone: "purple" },
  health: { icon: HeartPulse, tone: "green" },
  status: { icon: HeartPulse, tone: "green" },
  exam: { icon: ScrollText, tone: "purple" },
  assessment: { icon: ScrollText, tone: "purple" },
  book: { icon: BookOpen, tone: "orange" },
  library: { icon: BookOpen, tone: "orange" },
  award: { icon: Award, tone: "orange" },
  trophy: { icon: Award, tone: "orange" },
  warning: { icon: AlertTriangle, tone: "amber" },
  alert: { icon: AlertTriangle, tone: "amber" },
  info: { icon: Info, tone: "sky" },
  settings: { icon: Settings, tone: "brand" },
}

export interface IconBadgeProps {
  /**
   * Semantic name preset for the badge (e.g. "attendance", "homework", "fees", "results", "student").
   * Automatically sets the corresponding Lucide icon and default tone.
   */
  name?: IconBadgeName

  /**
   * Custom or override Lucide icon component.
   */
  icon?: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>

  /**
   * Arbitrary children (e.g. custom icon or SVG).
   */
  children?: ReactNode

  /**
   * Color tone of the badge. Defaults to the preset's tone or "blue".
   */
  tone?: IconBadgeTone

  /**
   * Visual variant:
   * - "solid": Vibrant squircle background with pure white icon glyph (Photo 2 style).
   * - "soft": Tinted pastel background with matching colored icon glyph (Photo 1 style).
   * - "outline": Bordered transparent badge with colored icon glyph.
   * Defaults to "solid".
   */
  variant?: IconBadgeVariant

  /**
   * Size of the badge: "xs" (24px), "sm" (32px), "md" (40px), "lg" (44px), "xl" (48px).
   * Defaults to "md".
   */
  size?: IconBadgeSize

  /**
   * Geometry shape: "squircle" (continuous curvature), "circle", or "rounded".
   * Defaults to "squircle".
   */
  shape?: IconBadgeShape

  className?: string
  iconClassName?: string
}

/**
 * Universally reusable icon badge:
 * - Direct semantic name preset support: `<IconBadge name="homework" />`
 * - Dual visual styles: `variant="solid"` (Photo 2) and `variant="soft"` (Photo 1)
 * - Calibrated continuous-curvature squircles
 * - High-contrast bold strokes for ultra-sharp rendering
 */
export function IconBadge({
  name,
  icon: customIcon,
  children,
  tone,
  variant = "solid",
  size = "md",
  shape = "squircle",
  className,
  iconClassName,
}: IconBadgeProps) {
  const preset = name ? ICON_PRESETS[name] : undefined
  const effectiveTone = tone || preset?.tone || "blue"
  const IconComponent = customIcon || preset?.icon

  const toneMap =
    variant === "soft" ? SOFT_TONES : variant === "outline" ? OUTLINE_TONES : SOLID_TONES
  const toneClasses = toneMap[effectiveTone] || toneMap.blue

  const sizeConfig = ICON_BADGE_SIZES[size] || ICON_BADGE_SIZES.md

  const shapeClass =
    shape === "circle"
      ? "rounded-full"
      : shape === "rounded"
        ? "rounded-lg"
        : sizeConfig.squircle

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center select-none",
        sizeConfig.badge,
        shapeClass,
        toneClasses,
        className
      )}
    >
      {IconComponent && (
        <IconComponent
          className={cn(sizeConfig.icon, "shrink-0 stroke-[2.25]", iconClassName)}
        />
      )}
      {children}
    </span>
  )
}

/**
 * Standalone glyph helper for rendering a consistent system icon without a badge wrapper.
 */
export function AppIcon({
  name,
  icon: customIcon,
  size = "md",
  className,
  ...props
}: {
  name?: IconBadgeName
  icon?: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>
  size?: IconBadgeSize
  className?: string
  [key: string]: unknown
}) {
  const preset = name ? ICON_PRESETS[name] : undefined
  const IconComponent = customIcon || preset?.icon
  if (!IconComponent) return null

  const sizeConfig = ICON_BADGE_SIZES[size] || ICON_BADGE_SIZES.md
  return (
    <IconComponent
      className={cn(sizeConfig.icon, "shrink-0 stroke-[2.25]", className)}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// Pre-composed, convenience badge components
// Ready to drop in anywhere with zero icon imports needed!
// ---------------------------------------------------------------------------

export type ConvenienceBadgeProps = Omit<IconBadgeProps, "name">

export const AttendanceBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="attendance" {...props} />
)
export const HomeworkBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="homework" {...props} />
)
export const NotebookBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="notebook" {...props} />
)
export const DocumentBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="document" {...props} />
)
export const ResultBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="results" {...props} />
)
export const TargetBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="target" {...props} />
)
export const FeeBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="fees" {...props} />
)
export const WalletBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="wallet" {...props} />
)
export const StudentBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="student" {...props} />
)
export const StudentsBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="students" {...props} />
)
export const TeacherBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="teacher" {...props} />
)
export const NoticeBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="notice" {...props} />
)
export const ActivityBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="activity" {...props} />
)
export const CalendarBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="calendar" {...props} />
)
export const HealthBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="health" {...props} />
)
export const ExamBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="exam" {...props} />
)
export const BookBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="book" {...props} />
)
export const AwardBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="award" {...props} />
)
export const WarningBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="warning" {...props} />
)
export const InfoBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="info" {...props} />
)
export const CheckBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="check" {...props} />
)
export const SettingsBadge = (props: ConvenienceBadgeProps) => (
  <IconBadge name="settings" {...props} />
)
