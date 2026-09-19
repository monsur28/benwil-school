"use client"

import { useTranslations } from "next-intl"
import { Calendar, GraduationCap, BookOpen, UserCheck, Clock } from "lucide-react"
import { SubNav } from "@/components/shared/sub-nav"

const LINKS = [
  { href: "/academics/years", labelKey: "years.title", icon: Calendar },
  { href: "/academics/classes", labelKey: "classes.title", icon: GraduationCap },
  { href: "/academics/subjects", labelKey: "subjects.title", icon: BookOpen },
  { href: "/academics/assignments", labelKey: "assignments.title", icon: UserCheck },
  { href: "/academics/routine", labelKey: "routine.title", icon: Clock },
]

export function AcademicsSubNav() {
  const t = useTranslations("academics")

  return (
    <SubNav
      links={LINKS.map((link) => ({
        href: link.href,
        label: t(link.labelKey),
        icon: link.icon,
      }))}
    />
  )
}
