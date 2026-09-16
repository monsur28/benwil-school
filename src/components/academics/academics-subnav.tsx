"use client"

import { useTranslations } from "next-intl"
import { SubNav } from "@/components/shared/sub-nav"

const LINKS = [
  { href: "/academics/years", labelKey: "years.title" },
  { href: "/academics/classes", labelKey: "classes.title" },
  { href: "/academics/subjects", labelKey: "subjects.title" },
  { href: "/academics/assignments", labelKey: "assignments.title" },
]

export function AcademicsSubNav() {
  const t = useTranslations("academics")

  return <SubNav links={LINKS.map((link) => ({ href: link.href, label: t(link.labelKey) }))} />
}
